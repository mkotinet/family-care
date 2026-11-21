import os
import json
from pathlib import Path
from datetime import datetime
import zoneinfo
from fastapi import FastAPI, Request, Query, Body, Header, Response
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import DEFAULT_LOCATION, APP_TITLE, APP_SUBTITLE, TIMEZONE, PORT, KAKAO_JS_API_KEY, KAKAO_REST_API_KEY
from backend.database import init_db
from backend.services.auth import authenticate_user, get_user_by_token, get_family_members_list, touch_user_heartbeat
from backend.services.location import update_user_location, get_family_locations, request_child_ping
from backend.services.chat import get_chat_rooms, get_messages, send_message
from backend.services.places import add_favorite_place, get_favorite_places, remove_favorite_place
from backend.services.weather import get_weather_data
from backend.services.transit import get_transit_routes, add_favorite_route, search_nearby_bus_stops, get_station_arrivals
from backend.services.hospital import get_hospital_pharmacy_info
from backend.services.restaurant import get_favorite_restaurants, add_favorite_restaurant, search_places_kakao
from backend.services.health import get_health_alerts
from backend.services.culture import get_culture_and_crowd

KST = zoneinfo.ZoneInfo(TIMEZONE)

app = FastAPI(title=APP_TITLE, description=APP_SUBTITLE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h3>우리가족챙기기 웹앱 초기화 중입니다...</h3>")

@app.api_route("/manifest.json", methods=["GET", "HEAD"])
async def serve_manifest():
    """PWA 표준 Web App Manifest 서빙 (안드로이드/데스크톱 A2HS 설치 보장)"""
    file_path = STATIC_DIR / "manifest.json"
    if file_path.exists():
        return FileResponse(file_path, media_type="application/manifest+json")
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

# --- 1. 회원 인증 (하루퀴즈 포맷 4인 가족) ---
@app.post("/api/auth/login")
async def api_auth_login(payload: dict = Body(...)):
    username = payload.get("username", "")
    password = payload.get("password", "")
    device_info = payload.get("device_info", "Mobile Web")
    res = await authenticate_user(username, password, device_info)
    return res

@app.get("/api/auth/me")
async def api_auth_me(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    user = await get_user_by_token(token)
    if not user:
        return {"success": False, "message": "로그인이 필요합니다."}
    return {"success": True, "user": user}

@app.get("/api/auth/family")
async def api_auth_family():
    members = await get_family_members_list()
    return members

# --- 2. 실시간 GPS 안심 위치 추적 ---
@app.post("/api/location/update")
async def api_location_update(payload: dict = Body(...)):
    username = payload.get("username")
    lat = float(payload.get("latitude", DEFAULT_LOCATION["lat"]))
    lon = float(payload.get("longitude", DEFAULT_LOCATION["lon"]))
    accuracy = float(payload.get("accuracy", 10.0))
    battery = int(payload.get("battery_level", 100))
    is_moving = bool(payload.get("is_moving", False))

    res = await update_user_location(username, lat, lon, accuracy, battery, is_moving, is_manual=False)
    return res

@app.post("/api/location/manual-set")
async def api_location_manual_set(payload: dict = Body(...)):
    """부모가 자녀의 현재 위치(장소/좌표)를 수동으로 지정/갱신"""
    username = payload.get("username")
    lat = float(payload.get("latitude", DEFAULT_LOCATION["lat"]))
    lon = float(payload.get("longitude", DEFAULT_LOCATION["lon"]))
    landmark = payload.get("landmark", "외부 장소")
    battery = int(payload.get("battery_level", 85))

    res = await update_user_location(username, lat, lon, accuracy=5.0, battery=battery, is_moving=False, is_manual=True, custom_landmark=landmark)
    return res

@app.post("/api/location/test-simulate")
async def api_location_test_simulate(payload: dict = Body(...)):
    """자녀 실시간 위치/GPS 실측 검증 시뮬레이션"""
    username = payload.get("username", "도비사랑녀")
    lat = float(payload.get("latitude", 37.653412))
    lon = float(payload.get("longitude", 127.244123))
    accuracy = float(payload.get("accuracy", 8.0))
    battery = int(payload.get("battery_level", 85))
    is_moving = bool(payload.get("is_moving", False))
    is_manual = bool(payload.get("is_manual", False))
    landmark = payload.get("landmark")
    res = await update_user_location(username, lat, lon, accuracy=accuracy, battery=battery, is_moving=is_moving, is_manual=is_manual, custom_landmark=landmark)
    return res

@app.post("/api/location/request-ping")
async def api_location_request_ping(payload: dict = Body(...)):
    """자녀에게 실시간 위치 전송 요청 톡 발송"""
    child_username = payload.get("child_username", "도비사랑녀")
    requester = payload.get("requester_name", "아빠")
    res = await request_child_ping(child_username, requester)
    return res

@app.get("/api/location/family")
async def api_location_family():
    """부모 화면에서 우리 아이들 및 가족 실시간 위치 조회"""
    data = await get_family_locations()
    return data

# --- 3. 실시간 가족 채팅방 ---
@app.get("/api/chat/rooms")
async def api_chat_rooms(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "").strip()
    user = await get_user_by_token(token)
    uname = user["username"] if user else "미니미니"
    rooms = await get_chat_rooms(uname)
    return rooms

@app.get("/api/chat/messages")
async def api_chat_messages(room_id: str = Query("family_all"), limit: int = Query(50)):
    msgs = await get_messages(room_id, limit)
    return msgs

@app.post("/api/chat/send")
async def api_chat_send(payload: dict = Body(...)):
    res = await send_message(
        room_id=payload.get("room_id", "family_all"),
        sender_username=payload.get("sender_username", "미니미니"),
        text=payload.get("text", ""),
        msg_type=payload.get("msg_type", "TEXT"),
        location_data=payload.get("location_data"),
        photo_url=payload.get("photo_url")
    )
    return res

# --- 4. 지도 즐겨찾기 장소 ---
@app.post("/api/places/favorite")
async def api_places_favorite_add(payload: dict = Body(...)):
    res = await add_favorite_place(
        user_username=payload.get("user_username", "미니미니"),
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
async def api_places_favorites(user: str = Query(None)):
    data = await get_favorite_places(user)
    return data

@app.delete("/api/places/favorite/{place_id}")
async def api_places_favorite_remove(place_id: int):
    res = await remove_favorite_place(place_id)
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
async def api_transit():
    data = await get_transit_routes()
    return data

@app.get("/api/transit/nearby-stops")
async def api_transit_nearby_stops(lat: float = Query(None), lon: float = Query(None), radius: int = Query(1000)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    stops = await search_nearby_bus_stops(lat, lon, radius)
    return stops

@app.get("/api/transit/station-arrivals")
async def api_transit_station_arrivals(station_name: str = Query(...)):
    """특정 정류소의 실시간 버스 도착 정보 조회"""
    data = await get_station_arrivals(station_name)
    return data

@app.post("/api/transit/add")
async def api_transit_add(payload: dict = Body(...)):
    await add_favorite_route(
        title=payload.get("title", "새 루트"),
        transit_type=payload.get("transit_type", "BUS"),
        station_name=payload.get("station_name", "정류장"),
        route_no=payload.get("route_no", "100"),
        target_destination=payload.get("target_destination", "시내방면"),
        dest_station_name=payload.get("dest_station_name", ""),
        user_username=payload.get("user_username", "미니미니")
    )
    return {"success": True}

# --- 7. 병원 & 당번약국 ---
@app.get("/api/hospital")
async def api_hospital(lat: float = Query(None), lon: float = Query(None), filter_type: str = Query("ALL")):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_hospital_pharmacy_info(lat, lon, filter_type)
    return data

# --- 8. 식당 & 카카오 로컬 검색 ---
@app.get("/api/restaurant")
async def api_restaurant():
    data = await get_favorite_restaurants()
    return data

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
async def api_culture(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_culture_and_crowd(lat, lon)
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)
