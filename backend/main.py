import os
import json
from pathlib import Path
from datetime import datetime
import zoneinfo
from fastapi import FastAPI, Request, Query, Body, Header, Response, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import DEFAULT_LOCATION, APP_TITLE, APP_SUBTITLE, TIMEZONE, PORT, KAKAO_JS_API_KEY, KAKAO_REST_API_KEY
from backend.database import init_db, write_audit_log, get_audit_logs
from backend.services.auth import (
    authenticate_user,
    get_user_by_token,
    get_family_members_list,
    touch_user_heartbeat,
    revoke_token,
    ADMIN_USERNAMES,
)
from backend.services.location import (
    update_user_location,
    update_gps_permission_status,
    get_family_locations,
    get_location_history,
    get_shortcut_configs,
    rotate_shortcut_key,
    verify_shortcut_key,
    request_child_ping,
    reverse_geocode,
)
from backend.services.push import (
    get_vapid_public_key,
    save_push_subscription,
    remove_push_subscription,
    get_push_subscription_count,
    WEBPUSH_AVAILABLE,
)
from backend.services.chat import get_chat_rooms, get_messages, send_message
from backend.services.places import add_favorite_place, get_favorite_places, remove_favorite_place, update_favorite_place
from backend.services.weather import get_weather_data
from backend.services.transit import get_transit_routes, add_favorite_route, delete_favorite_route, update_favorite_route, search_nearby_bus_stops, get_station_arrivals
from backend.services.hospital import get_hospital_pharmacy_info
from backend.services.restaurant import get_favorite_restaurants, add_favorite_restaurant, delete_favorite_restaurant, update_favorite_restaurant, search_places_kakao
from backend.services.health import get_health_alerts
from backend.services.culture import get_culture_and_crowd

KST = zoneinfo.ZoneInfo(TIMEZONE)

app = FastAPI(title=APP_TITLE, description=APP_SUBTITLE)

ALLOWED_ORIGINS = [
    "https://family.danminlove.com",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3090",
    "http://127.0.0.1:3090",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Cache-Control"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "geolocation=(self), notifications=(self)")
    response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

def _extract_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.headers.get("x-real-ip", "")
    if xri:
        return xri.strip()
    return request.client.host if request.client else ""

def _extract_bearer_token(authorization: str = Header(None)) -> str:
    if not authorization:
        return ""
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip()

async def optional_auth(authorization: str = Header(None)):
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    return await get_user_by_token(token)

async def require_auth(authorization: str = Header(None)):
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="세션이 만료되었습니다. 다시 로그인해주세요.")
    return user

async def require_parent(user: dict = Depends(require_auth)):
    if user.get("role_type") != "PARENT":
        raise HTTPException(status_code=403, detail="부모 계정 권한이 필요합니다.")
    return user

async def require_admin(user: dict = Depends(require_auth)):
    if user.get("username") not in ADMIN_USERNAMES:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user

# 데이터베이스 초기화
init_db()

# 정적 파일 마운트
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        html_content = index_file.read_text(encoding="utf-8")
        # version.json의 최신 버전을 <meta name="app-version">에 동적 동기화 (60초 무한 리로드 원천 차단)
        v_file = BASE_DIR / "version.json"
        if v_file.exists():
            try:
                v_ver = json.loads(v_file.read_text(encoding="utf-8")).get("version")
                if v_ver:
                    import re
                    html_content = re.sub(
                        r'(<meta\s+name="app-version"\s+content=")[^"]*(")',
                        rf'\g<1>{v_ver}\g<2>',
                        html_content,
                        count=1
                    )
            except Exception:
                pass
        return HTMLResponse(
            content=html_content,
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    return HTMLResponse("<h3>우리가족챙기기 웹앱 초기화 중입니다...</h3>")

@app.api_route("/manifest.json", methods=["GET", "HEAD"])
async def serve_manifest():
    """PWA 표준 Web App Manifest 서빙 (안드로이드/데스크톱 A2HS 설치 보장)"""
    file_path = STATIC_DIR / "manifest.json"
    if file_path.exists():
        response = FileResponse(file_path, media_type="application/manifest+json")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response
    return JSONResponse(status_code=404, content={"error": "manifest not found"})

@app.api_route("/sw.js", methods=["GET", "HEAD"])
async def serve_sw():
    """PWA 루트 서비스 워커 서빙 (Service-Worker-Allowed: /)"""
    file_path = STATIC_DIR / "sw.js"
    if file_path.exists():
        response = FileResponse(file_path, media_type="application/javascript")
        response.headers["Service-Worker-Allowed"] = "/"
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response
    return Response(status_code=404, content="sw not found")

@app.api_route("/favicon.ico", methods=["GET", "HEAD"])
async def serve_favicon():
    file_path = STATIC_DIR / "icons" / "icon-192.png"
    if file_path.exists():
        return FileResponse(file_path, media_type="image/png")
    return Response(status_code=204)

@app.post("/api/auth/heartbeat")
async def api_auth_heartbeat(payload: dict = Body(None), authorization: str = Header(None)):
    """클라이언트 화면 실행 중 실시간 접속 세션 유지 하트비트"""
    token = (authorization or "").replace("Bearer ", "").strip()
    if not token and payload:
        token = payload.get("token", "")
    device_info = payload.get("device_info") if payload else None
    success = await touch_user_heartbeat(token, device_info)
    return {
        "success": success,
        "is_online": True,
        "time": datetime.now(KST).isoformat()
    }

@app.get("/api/healthz")
async def health_check():
    return {
        "status": "healthy",
        "app": APP_TITLE,
        "time": datetime.now(KST).isoformat(),
        "timezone": TIMEZONE
    }

@app.get("/api/version")
@app.get("/version.json")
async def get_app_version():
    """하루퀴즈 포맷: version.json 기반 동적 버전 메타데이터 (Cache-Control: no-cache)"""
    v_file = BASE_DIR / "version.json"
    default_meta = {
        "version": "1.1.0",
        "build": "20261121_1740",
        "name": "우리가족챙기기",
        "releaseNotes": "1) 최신 페이지 자동 업데이트 & 업데이트 안내창 탑재\n2) 카카오맵/오픈스트리트맵 무장애 하이브리드 지도 엔진 탑재"
    }
    if v_file.exists():
        try:
            with open(v_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return JSONResponse(
                    content=data,
                    headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
                )
        except Exception:
            pass
    return JSONResponse(
        content=default_meta,
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@app.get("/api/init")
async def get_app_init(authorization: str = Header(None)):
    """초기 앱 로드: 가족 4인 정보, 기본 거점, 서버시간, 카카오 SDK 연동 상태 전달"""
    members = await get_family_members_list()
    now_kst = datetime.now(KST)

    current_user = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        current_user = await get_user_by_token(token)

    return {
        "app_title": APP_TITLE,
        "app_subtitle": APP_SUBTITLE,
        "default_location": DEFAULT_LOCATION,
        "family_members": members,
        "current_user": current_user,
        "kakao_js_key": KAKAO_JS_API_KEY,
        "has_kakao_rest_key": bool(KAKAO_REST_API_KEY),
        "server_time": now_kst.isoformat(),
        "kst_date_string": now_kst.strftime("%Y년 %m월 %d일"),
        "kst_day_name": ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][now_kst.weekday()],
        "is_weekend": now_kst.weekday() >= 5
    }

# --- 1. 회원 인증 (하루퀴즈 포맷 4인 가족 + 감사 로깅 + Rate Limiting) ---
@app.post("/api/auth/login")
async def api_auth_login(request: Request, payload: dict = Body(...)):
    username = payload.get("username", "")
    password = payload.get("password", "")
    device_info = payload.get("device_info", "Mobile Web")
    client_ip = _extract_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    res = await authenticate_user(username, password, device_info, client_ip=client_ip, user_agent=user_agent)
    if res.get("rate_limited"):
        return JSONResponse(status_code=429, content=res)
    return res

@app.post("/api/auth/logout")
async def api_auth_logout(request: Request, authorization: str = Header(None), user: dict = Depends(require_auth)):
    token = _extract_bearer_token(authorization)
    await revoke_token(token, username=user["username"], client_ip=_extract_client_ip(request), user_agent=request.headers.get("user-agent", ""))
    return {"success": True}

@app.get("/api/auth/me")
async def api_auth_me(authorization: str = Header(None)):
    token = _extract_bearer_token(authorization)
    user = await get_user_by_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"success": False, "message": "로그인이 필요합니다."})
    return {"success": True, "user": user}

@app.get("/api/auth/family")
async def api_auth_family():
    members = await get_family_members_list()
    return members

@app.get("/api/admin/audit-logs")
async def api_admin_audit_logs(limit: int = Query(100), admin: dict = Depends(require_admin)):
    """관리자 전용 보안 감사 로그 조회 (기본지침 제7조 RBAC)"""
    return {"success": True, "admin": admin["username"], "logs": get_audit_logs(limit)}

# --- 2. 실시간 GPS 안심 위치 추적 & Web Push & iOS 단축어 무인 웹훅 ---
@app.post("/api/location/update")
async def api_location_update(payload: dict = Body(...), user: dict = Depends(require_auth)):
    requested_username = payload.get("username") or user["username"]
    # IDOR 방어: 자녀는 본인 위치만 갱신 가능, 부모는 본인 및 자녀 위치 갱신 가능
    if user.get("role_type") != "PARENT" and requested_username != user["username"]:
        raise HTTPException(status_code=403, detail="본인의 위치만 업데이트할 수 있습니다.")
    lat = float(payload.get("latitude", DEFAULT_LOCATION["lat"]))
    lon = float(payload.get("longitude", DEFAULT_LOCATION["lon"]))
    accuracy = float(payload.get("accuracy", 10.0))
    battery = int(payload.get("battery_level", 100))
    is_moving = bool(payload.get("is_moving", False))
    source = str(payload.get("source") or "WEB_GPS").upper()
    if source not in ("WEB_GPS", "PING_REPLY"):
        source = "WEB_GPS"

    res = await update_user_location(
        requested_username, lat, lon, accuracy, battery, is_moving,
        is_manual=False, source=source, gps_permission="GRANTED"
    )
    return res

@app.post("/api/location/status")
async def api_location_status(payload: dict = Body(...), user: dict = Depends(require_auth)):
    """자녀 기기 위치 권한 거부(DENIED) 또는 실내 GPS 타임아웃(TIMEOUT) 상태 보고"""
    perm = str(payload.get("gps_permission") or "UNKNOWN").upper()
    return await update_gps_permission_status(user["username"], perm)

@app.get("/api/location/history")
async def api_location_history(username: str = Query(...), limit: int = Query(50), user: dict = Depends(require_auth)):
    """자녀 최근 이동 동선 타임라인 조회 (부모: 전체 자녀 조회 가능, 자녀: 본인만)"""
    if user.get("role_type") != "PARENT" and username != user["username"]:
        raise HTTPException(status_code=403, detail="다른 구성원의 이동 동선은 부모 계정에서만 조회할 수 있습니다.")
    items = await get_location_history(username, limit=limit)
    return {"username": username, "count": len(items), "items": items}

@app.get("/api/location/shortcut-config")
async def api_location_shortcut_config(user: dict = Depends(require_auth)):
    """아이폰 '단축어(Shortcuts)' 자동화 무인 백그라운드 위치전송용 웹훅 URL & 전용 키 조회"""
    configs = await get_shortcut_configs(user)
    return {"success": True, "configs": configs}

@app.post("/api/location/shortcut-rotate")
async def api_location_shortcut_rotate(request: Request, payload: dict = Body(...), user: dict = Depends(require_auth)):
    target_user = payload.get("username") or user["username"]
    if user.get("role_type") != "PARENT" and target_user != user["username"]:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    res = await rotate_shortcut_key(target_user)
    write_audit_log(user["username"], "SHORTCUT_KEY_ROTATE", "SUCCESS", f"target={target_user}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

@app.post("/api/location/shortcut-webhook")
async def api_location_shortcut_webhook(
    request: Request,
    payload: dict = Body(default={}),
    x_shortcut_key: str = Header(None, alias="X-Shortcut-Key"),
    key: str = Query(None),
):
    """
    아이폰 내장 [단축어(Shortcuts) > 자동화] 무인 백그라운드 GPS 수신 웹훅
    (앱 미실행·화면 잠금 상태에서도 추적 팝업 0회로 자동 위치 보고)
    """
    api_key = x_shortcut_key or payload.get("key") or payload.get("api_key") or key or ""
    username = verify_shortcut_key(api_key)
    if not username:
        raise HTTPException(status_code=401, detail="유효하지 않은 단축어 키입니다.")

    raw_lat = payload.get("latitude") if payload.get("latitude") is not None else payload.get("lat")
    raw_lon = payload.get("longitude") if payload.get("longitude") is not None else payload.get("lon")
    if raw_lat is None or raw_lon is None:
        raise HTTPException(status_code=400, detail="latitude, longitude 값이 필요합니다.")
    try:
        lat = float(str(raw_lat).strip())
        lon = float(str(raw_lon).strip())
    except Exception:
        raise HTTPException(status_code=400, detail="좌표 형식이 올바르지 않습니다.")

    raw_bat = payload.get("battery_level") if payload.get("battery_level") is not None else payload.get("battery")
    battery = 85
    if raw_bat is not None and str(raw_bat).strip() != "":
        try:
            b_val = float(str(raw_bat).replace("%", "").strip())
            battery = int(round(b_val * 100)) if 0 < b_val <= 1.0 else int(round(max(0, min(100, b_val))))
        except Exception:
            battery = 85

    accuracy = 15.0
    if payload.get("accuracy") is not None:
        try:
            accuracy = float(payload.get("accuracy"))
        except Exception:
            pass

    res = await update_user_location(
        username, lat, lon, accuracy=accuracy, battery=battery,
        is_moving=False, is_manual=False, source="IOS_SHORTCUT", gps_permission="GRANTED"
    )
    write_audit_log(username, "IOS_SHORTCUT_LOCATION", "SUCCESS", f"landmark={res.get('landmark')}, bat={battery}%", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

# --- 2-1. Web Push (VAPID / iOS 16.4+ PWA APNs & Android FCM) ---
@app.get("/api/push/vapid-public-key")
async def api_push_vapid_public_key():
    pub = get_vapid_public_key()
    return {"public_key": pub, "available": bool(WEBPUSH_AVAILABLE and pub)}

@app.post("/api/push/subscribe")
async def api_push_subscribe(request: Request, payload: dict = Body(...), user: dict = Depends(require_auth)):
    endpoint = payload.get("endpoint") or ""
    keys = payload.get("keys") or {}
    p256dh = keys.get("p256dh") or payload.get("p256dh") or ""
    auth = keys.get("auth") or payload.get("auth") or ""
    if not endpoint or not p256dh or not auth:
        raise HTTPException(status_code=400, detail="유효한 Web Push 구독 정보가 아닙니다.")
    ok = save_push_subscription(user["username"], endpoint, p256dh, auth, request.headers.get("user-agent", ""))
    write_audit_log(user["username"], "PUSH_SUBSCRIBE", "SUCCESS" if ok else "FAIL", f"subs={get_push_subscription_count(user['username'])}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return {"success": ok, "sub_count": get_push_subscription_count(user["username"])}

@app.post("/api/push/unsubscribe")
async def api_push_unsubscribe(payload: dict = Body(...), user: dict = Depends(require_auth)):
    endpoint = payload.get("endpoint") or ""
    ok = remove_push_subscription(endpoint)
    return {"success": ok, "sub_count": get_push_subscription_count(user["username"])}

@app.get("/api/push/status")
async def api_push_status(user: dict = Depends(require_auth)):
    cnt = get_push_subscription_count(user["username"])
    return {"subscribed": cnt > 0, "sub_count": cnt, "available": WEBPUSH_AVAILABLE}

@app.post("/api/location/manual-set")
async def api_location_manual_set(request: Request, payload: dict = Body(...), parent: dict = Depends(require_parent)):
    """부모가 자녀의 현재 위치(장소/좌표)를 수동으로 지정/갱신"""
    username = payload.get("username")
    lat = float(payload.get("latitude", DEFAULT_LOCATION["lat"]))
    lon = float(payload.get("longitude", DEFAULT_LOCATION["lon"]))
    landmark = payload.get("landmark", "외부 장소")
    battery = int(payload.get("battery_level", 85))

    res = await update_user_location(username, lat, lon, accuracy=5.0, battery=battery, is_moving=False, is_manual=True, custom_landmark=landmark)
    write_audit_log(parent["username"], "LOCATION_MANUAL_SET", "SUCCESS", f"target={username}, landmark={landmark}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

@app.post("/api/location/test-simulate")
async def api_location_test_simulate(request: Request, payload: dict = Body(...), parent: dict = Depends(require_parent)):
    """자녀 실시간 위치/GPS 실측 검증 시뮬레이션 (부모 전용)"""
    username = payload.get("username", "도비사랑녀")
    lat = float(payload.get("latitude", 37.653412))
    lon = float(payload.get("longitude", 127.244123))
    accuracy = float(payload.get("accuracy", 8.0))
    battery = int(payload.get("battery_level", 85))
    is_moving = bool(payload.get("is_moving", False))
    is_manual = bool(payload.get("is_manual", False))
    landmark = payload.get("landmark")
    res = await update_user_location(username, lat, lon, accuracy=accuracy, battery=battery, is_moving=is_moving, is_manual=is_manual, custom_landmark=landmark)
    write_audit_log(parent["username"], "LOCATION_SIMULATE", "SUCCESS", f"target={username}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

@app.post("/api/location/request-ping")
async def api_location_request_ping(request: Request, payload: dict = Body(...), parent: dict = Depends(require_parent)):
    """자녀에게 실시간 위치 전송 요청 톡 발송 (부모 전용)"""
    child_username = payload.get("child_username", "도비사랑녀")
    requester = parent.get("role_title") or parent.get("name") or "아빠"
    res = await request_child_ping(child_username, requester)
    write_audit_log(parent["username"], "LOCATION_PING_REQUEST", "SUCCESS", f"target={child_username}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

@app.get("/api/location/reverse-geocode")
async def api_location_reverse_geocode(lat: float = Query(None), lon: float = Query(None)):
    """좌표 기반 실시간 행정구역/도로명 주소 역지오코딩 (초기화면 위치표시 및 전국 생활정보 연동)"""
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    return await reverse_geocode(lat, lon)

@app.get("/api/location/family")
async def api_location_family(user: dict = Depends(require_auth)):
    """로그인 가족 전용 실시간 위치 조회"""
    data = await get_family_locations()
    return data

# --- 3. 실시간 가족 채팅방 (인증 보호 및 발신자 사칭 차단) ---
@app.get("/api/chat/rooms")
async def api_chat_rooms(user: dict = Depends(require_auth)):
    rooms = await get_chat_rooms(user["username"])
    return rooms

@app.get("/api/chat/messages")
async def api_chat_messages(room_id: str = Query("family_all"), limit: int = Query(50), user: dict = Depends(require_auth)):
    safe_limit = max(1, min(limit, 200))
    msgs = await get_messages(room_id, safe_limit)
    return msgs

@app.post("/api/chat/send")
async def api_chat_send(request: Request, payload: dict = Body(...), user: dict = Depends(require_auth)):
    # 발신자는 반드시 인증된 토큰 소유자 본인으로 강제 (사칭 원천 차단)
    res = await send_message(
        room_id=payload.get("room_id", "family_all"),
        sender_username=user["username"],
        text=str(payload.get("text", ""))[:1000],
        msg_type=payload.get("msg_type", "TEXT"),
        location_data=payload.get("location_data"),
        photo_url=payload.get("photo_url")
    )
    write_audit_log(user["username"], "CHAT_SEND", "SUCCESS", f"room={payload.get('room_id', 'family_all')}, type={payload.get('msg_type', 'TEXT')}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

# --- 4. 지도 즐겨찾기 장소 ---
@app.post("/api/places/favorite")
async def api_places_favorite_add(payload: dict = Body(...), user: dict = Depends(require_auth)):
    res = await add_favorite_place(
        user_username=user["username"],
        category=payload.get("category", "식당"),
        name=payload.get("name"),
        address=payload.get("address", ""),
        lat=payload.get("latitude"),
        lon=payload.get("longitude"),
        phone=payload.get("phone", ""),
        status_info=payload.get("status_info", ""),
        memo=payload.get("memo", "")
    )
    return res

@app.get("/api/places/favorites")
async def api_places_favorites(user: str = Query(None), auth_user: dict = Depends(optional_auth)):
    if not auth_user:
        return []
    data = await get_favorite_places(auth_user["username"])
    return data

@app.delete("/api/places/favorite/{place_id}")
async def api_places_favorite_remove(request: Request, place_id: int, user: dict = Depends(require_auth)):
    res = await remove_favorite_place(place_id)
    write_audit_log(user["username"], "FAVORITE_PLACE_DELETE", "SUCCESS", f"place_id={place_id}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return res

@app.put("/api/places/favorite/{place_id}")
async def api_places_favorite_update(place_id: int, payload: dict = Body(...), user: dict = Depends(require_auth)):
    res = await update_favorite_place(
        place_id=place_id,
        name=payload.get("name"),
        memo=payload.get("memo"),
        phone=payload.get("phone"),
        status_info=payload.get("status_info")
    )
    return res

# --- 5. 날씨 상세 (1시간별 / 3시간별 / 주간) ---
@app.get("/api/weather")
async def api_weather(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_weather_data(lat, lon)
    return data

# --- 6. 교통 & 버스 정류소 지도 검색 ---
@app.get("/api/transit")
async def api_transit(username: str = Query(None), auth_user: dict = Depends(optional_auth)):
    if not auth_user:
        return []
    data = await get_transit_routes(auth_user["username"])
    return data

@app.get("/api/transit/nearby-stops")
async def api_transit_nearby_stops(lat: float = Query(None), lon: float = Query(None), radius: int = Query(1000)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    stops = await search_nearby_bus_stops(lat, lon, radius)
    return stops

@app.get("/api/transit/station-arrivals")
async def api_transit_station_arrivals(
    station_name: str = Query(...),
    direction: str = Query(None),
    station_id: str = Query(None),
    city_code: str = Query(None),
    lat: float = Query(None),
    lon: float = Query(None),
):
    """특정 정류소의 실시간 버스 도착 정보 조회 (평내·호평 양방향 + 전국 TAGO 실시간)"""
    data = await get_station_arrivals(
        station_name,
        station_id=station_id,
        direction=direction or "hopyeong",
        city_code=city_code,
        lat=lat,
        lon=lon,
    )
    return data

@app.post("/api/transit/add")
async def api_transit_add(payload: dict = Body(...), user: dict = Depends(require_auth)):
    await add_favorite_route(
        title=payload.get("title", "새 루트"),
        transit_type=payload.get("transit_type", "BUS"),
        station_name=payload.get("station_name", "정류장"),
        route_no=payload.get("route_no", "100"),
        target_destination=payload.get("target_destination", "시내방면"),
        dest_station_name=payload.get("dest_station_name", ""),
        user_username=user["username"]
    )
    return {"success": True}

@app.delete("/api/transit/{route_id}")
async def api_transit_delete(request: Request, route_id: int, user: dict = Depends(require_auth)):
    res = await delete_favorite_route(route_id)
    write_audit_log(user["username"], "TRANSIT_DELETE", "SUCCESS", f"route_id={route_id}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return {"success": res}

@app.put("/api/transit/{route_id}")
async def api_transit_update(route_id: int, payload: dict = Body(...), user: dict = Depends(require_auth)):
    res = await update_favorite_route(
        route_id=route_id,
        title=payload.get("title"),
        route_no=payload.get("route_no"),
        target_destination=payload.get("target_destination"),
        dest_station_name=payload.get("dest_station_name")
    )
    return {"success": res}

# --- 7. 병원 & 당번약국 ---
@app.get("/api/hospital")
async def api_hospital(lat: float = Query(None), lon: float = Query(None), filter_type: str = Query("ALL")):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_hospital_pharmacy_info(lat, lon, filter_type)
    return data

# --- 8. 식당 & 카카오 로컬 검색 ---
@app.get("/api/restaurant")
async def api_restaurant(auth_user: dict = Depends(optional_auth)):
    if not auth_user:
        return []
    data = await get_favorite_restaurants()
    return data

@app.delete("/api/restaurant/{restaurant_id}")
async def api_restaurant_delete(request: Request, restaurant_id: int, user: dict = Depends(require_auth)):
    res = await delete_favorite_restaurant(restaurant_id)
    write_audit_log(user["username"], "RESTAURANT_DELETE", "SUCCESS", f"restaurant_id={restaurant_id}", _extract_client_ip(request), request.headers.get("user-agent", ""))
    return {"success": res}

@app.put("/api/restaurant/{restaurant_id}")
async def api_restaurant_update(restaurant_id: int, payload: dict = Body(...), user: dict = Depends(require_auth)):
    res = await update_favorite_restaurant(
        restaurant_id=restaurant_id,
        name=payload.get("name"),
        category=payload.get("category"),
        phone=payload.get("phone"),
        address=payload.get("address"),
        family_note=payload.get("memo") or payload.get("family_note")
    )
    return {"success": res}

@app.get("/api/restaurant/search")
async def api_restaurant_search(query: str = Query(...), lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    results = await search_places_kakao(query, lat, lon)
    return results

# --- 9. 건강 알레르기 & 축제 ---
@app.get("/api/health")
async def api_health(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_health_alerts(lat, lon)
    return data

@app.get("/api/culture")
async def api_culture(lat: float = Query(None), lon: float = Query(None), scope: str = Query("local")):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_culture_and_crowd(lat, lon, scope)
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)
