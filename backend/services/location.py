import urllib.request
import urllib.parse
import json
from datetime import datetime, timedelta
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE, DEFAULT_LOCATION
from backend.database import get_db_connection
from backend.coords import haversine_distance

KST = zoneinfo.ZoneInfo(TIMEZONE)

# 가족 주요 안심 거점 (지오펜스)
SAFE_ZONES = [
    {"name": "집 (평내마젤란21)", "lat": DEFAULT_LOCATION["lat"], "lon": DEFAULT_LOCATION["lon"], "radius": 250},
    {"name": "평내초등학교 & 병설유치원", "lat": 37.646123, "lon": 127.234512, "radius": 250},
    {"name": "평내호평역 & 학원가", "lat": 37.653412, "lon": 127.244123, "radius": 350},
    {"name": "평내도서관 & 주민센터", "lat": 37.641203, "lon": 127.228945, "radius": 200}
]

def determine_landmark(lat: float, lon: float):
    if lat is None or lon is None:
        return "위치 미확인"

    for zone in SAFE_ZONES:
        dist = haversine_distance(lat, lon, zone["lat"], zone["lon"])
        if dist <= zone["radius"]:
            return f"{zone['name']} 안심구역 (반경 {int(dist)}m)"

    home_dist = haversine_distance(lat, lon, DEFAULT_LOCATION["lat"], DEFAULT_LOCATION["lon"])
    if home_dist < 800:
        return f"집 인근 ({int(home_dist)}m)"
    else:
        return f"외출 중 (집에서 {round(home_dist/1000, 1)}km)"

async def update_user_location(username: str, lat: float, lon: float, accuracy: float = 10.0, battery: int = 100, is_moving: bool = False, is_manual: bool = False, custom_landmark: str = None):
    """
    자녀 스마트폰 실제 GPS 전송 또는 부모 수동 설정
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst_dt = datetime.now(KST)
    now_kst = now_kst_dt.strftime("%Y-%m-%d %H:%M:%S")

    landmark = custom_landmark or determine_landmark(lat, lon)
    address = "경기도 남양주시 평내동"

    # 카카오 좌표계 변환 및 상세 주소 조회
    if KAKAO_REST_API_KEY and lat is not None and lon is not None:
        try:
            url = f"https://dapi.kakao.com/v2/local/geo/coord2address.json?x={lon}&y={lat}"
            req = urllib.request.Request(url, headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                res_data = json.loads(resp.read().decode())
                docs = res_data.get("documents", [])
                if docs:
                    road = docs[0].get("road_address")
                    jibun = docs[0].get("address")
                    address = (road.get("address_name") if road else (jibun.get("address_name") if jibun else address))
        except Exception:
            pass

    cursor.execute("""
    INSERT INTO user_locations (username, latitude, longitude, accuracy, address, landmark, battery_level, is_moving, is_manual, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        address = excluded.address,
        landmark = excluded.landmark,
        battery_level = excluded.battery_level,
        is_moving = excluded.is_moving,
        is_manual = excluded.is_manual,
        updated_at = excluded.updated_at
    """, (username, lat, lon, accuracy, address, landmark, battery, 1 if is_moving else 0, 1 if is_manual else 0, now_kst))

    conn.commit()
    conn.close()
    return {
        "success": True,
        "landmark": landmark,
        "address": address,
        "updated_at": now_kst,
        "is_manual": is_manual
    }

async def get_family_locations():
    """
    가족 4인 전체 위치 및 실시간 로그인 접속 상태 모니터링 (실제 수신 여부, 경과 시간, 안심존 상태 정밀 산출)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        u.username, u.name, u.role_title, u.role_type, u.avatar, u.avatar_color,
        l.latitude, l.longitude, l.accuracy, l.address, l.landmark, l.battery_level, 
        l.is_moving, l.is_manual, l.updated_at,
        t.token, t.device_info, t.last_used_at AS token_last_used_at
    FROM users u
    LEFT JOIN user_locations l ON u.username = l.username
    LEFT JOIN (
        SELECT username, token, device_info, last_used_at,
               ROW_NUMBER() OVER(PARTITION BY username ORDER BY last_used_at DESC) as rn
        FROM user_tokens
    ) t ON u.username = t.username AND t.rn = 1
    ORDER BY u.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    now_dt = datetime.now(KST)
    children = []
    parents = []

    for row_item in rows:
        r = dict(row_item)
        # 1. 로그인 및 세션 실시간 모니터링 판별
        token_last = r.get("token_last_used_at")
        is_online = False
        login_status = "NEVER_LOGGED_IN"
        login_badge = "⚪ 앱 미설치 / 미로그인"
        login_desc = "로그인 기록 없음"

        if token_last:
            try:
                if "T" in token_last:
                    tok_dt = datetime.fromisoformat(token_last)
                else:
                    tok_dt = datetime.strptime(token_last, "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
                
                if tok_dt.tzinfo is None:
                    tok_dt = tok_dt.replace(tzinfo=KST)
                
                tok_diff = (now_dt - tok_dt).total_seconds()
                is_child = (r.get("role_type") == "CHILD" or r.get("username") in ["도비사랑녀", "미니미니채"])

                if tok_diff < 900:  # 15분 이내
                    is_online = True
                    login_status = "ONLINE"
                    login_badge = "🟢 실시간 접속 중"
                    login_desc = "실시간 활동 (메모리 상주)"
                elif tok_diff < 3600:  # 1시간 이내
                    is_online = is_child  # 자녀는 백그라운드 상주 온라인 유지
                    login_status = "BACKGROUND_STANDBY"
                    login_badge = "🟡 백그라운드 대기"
                    login_desc = f"{int(tok_diff // 60)}분 전 활동 (메모리 상주)"
                elif tok_diff < 86400:
                    login_status = "STANDBY"
                    login_badge = "🟠 대기 상태"
                    login_desc = f"{int(tok_diff // 3600)}시간 전 접속"
                else:
                    login_status = "OFFLINE"
                    login_badge = "⚪ 미접속"
                    login_desc = tok_dt.strftime("%m월 %d일 접속")
            except Exception as ex:
                login_desc = f"활동 확인 ({str(ex)})"

        # 2. 위치 및 GPS 판별 (자녀는 위치 미보고 시에도 안심 거점 기본좌표를 보장하여 지도 핀 표출)
        has_real_gps = bool(r["updated_at"] and r["latitude"] is not None and r["longitude"] is not None)
        has_location = True
        status_badge = "⚪ 기본 안심구역 (집)"
        time_diff_desc = "미수신"
        is_fresh = False
        is_manual = bool(r["is_manual"]) if has_real_gps else False

        # 자녀별 기본 안심 위치 (집 핀과 겹치지 않도록 미세 분리 오프셋 적용)
        default_child_coords = {
            "도비사랑녀": {"lat": round(DEFAULT_LOCATION["lat"] + 0.00025, 6), "lon": round(DEFAULT_LOCATION["lon"] + 0.00030, 6)},
            "미니미니채": {"lat": round(DEFAULT_LOCATION["lat"] - 0.00025, 6), "lon": round(DEFAULT_LOCATION["lon"] - 0.00030, 6)}
        }

        if has_real_gps:
            target_lat = r["latitude"]
            target_lon = r["longitude"]
            target_address = r["address"] or "경기도 남양주시 평내로 89 (평내동, 평내마젤란21아파트)"
            target_landmark = r["landmark"] or "집 안심구역"
            try:
                up_str = r["updated_at"]
                if "T" in up_str:
                    up_dt = datetime.fromisoformat(up_str)
                else:
                    up_dt = datetime.strptime(up_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
                diff_sec = (now_dt - up_dt).total_seconds()
                if diff_sec < 60:
                    time_diff_desc = "방금 전"
                elif diff_sec < 3600:
                    time_diff_desc = f"{int(diff_sec // 60)}분 전"
                elif diff_sec < 86400:
                    time_diff_desc = f"{int(diff_sec // 3600)}시간 전"
                else:
                    time_diff_desc = up_dt.strftime("%m월 %d일 %H:%M")

                is_fresh = (diff_sec < 1800) # 30분 이내

                if is_manual:
                    status_badge = f"📌 부모 수동지정 ({target_landmark})"
                else:
                    if "안심구역" in target_landmark or "집" in target_landmark:
                        status_badge = "🟢 안심 구역 (실시간 GPS)" if is_fresh else "🟠 안심 구역 (GPS 확인 지연)"
                    else:
                        status_badge = "🟡 외출/이동 중 (실시간 GPS)" if is_fresh else "🟠 외출 중 (GPS 확인 지연)"
            except Exception:
                time_diff_desc = r["updated_at"]
        else:
            # 아직 GPS 보고가 없더라도 자녀는 기본 거점 좌표를 주입하여 지도 핀 보장
            target_coords = default_child_coords.get(r["username"], {"lat": DEFAULT_LOCATION["lat"], "lon": DEFAULT_LOCATION["lon"]})
            target_lat = target_coords["lat"]
            target_lon = target_coords["lon"]
            target_address = "경기도 남양주시 평내로 89 (평내마젤란21아파트)"

            if is_online:
                target_landmark = "집 안심구역 (스마트폰 접속 중)"
                status_badge = "🟢 실시간 접속 중 (GPS 수신 대기)"
                time_diff_desc = "방금 접속"
                is_fresh = True
            elif login_status in ("BACKGROUND_STANDBY", "STANDBY"):
                target_landmark = f"집 안심구역 ({login_desc})"
                status_badge = f"🟡 최근 접속 ({login_desc}) / 안심구역"
                time_diff_desc = login_desc
            else:
                target_landmark = "집 안심구역 (기본 거점)"
                status_badge = "⚪ 기본 안심구역 (집)"
                time_diff_desc = "미수신"

        item = {
            "username": r["username"],
            "name": r["name"],
            "role_title": r["role_title"],
            "role_type": r["role_type"],
            "avatar": r["avatar"],
            "avatar_color": r["avatar_color"],
            "is_online": is_online,
            "login_status": login_status,
            "login_badge": login_badge,
            "login_desc": login_desc,
            "device_info": r["device_info"] or "기기 정보 없음",
            "has_location": True,
            "has_real_gps": has_real_gps,
            "latitude": target_lat,
            "longitude": target_lon,
            "accuracy": r["accuracy"] if has_real_gps else 10.0,
            "address": target_address,
            "landmark": target_landmark,
            "battery_level": r["battery_level"] if has_real_gps else (90 if is_online else None),
            "is_moving": bool(r["is_moving"]) if has_real_gps else False,
            "is_manual": is_manual,
            "updated_at": r["updated_at"] if has_real_gps else "안심 거점 기준",
            "time_diff_desc": time_diff_desc,
            "status_badge": status_badge,
            "is_fresh": is_fresh
        }

        if r["role_type"] == "CHILD":
            children.append(item)
        else:
            parents.append(item)

    return {
        "children": children,
        "parents": parents,
        "safe_zones": SAFE_ZONES
    }

async def request_child_ping(child_username: str, requester_name: str = "아빠"):
    """
    자녀에게 위치 전송 요청 알림 메시지를 가족 채팅방으로 발송
    """
    from backend.services.chat import send_message
    sender_username = "Ljh" if "엄마" in (requester_name or "") or requester_name == "Ljh" else "미니미니"
    msg_text = f"📍 [위치 확인 요청] {requester_name}님이 {child_username}의 현재 위치를 확인하고 싶어해요. 채팅방 하단의 [📍 위치전송] 버튼을 눌러 위치를 알려주세요!"
    await send_message(
        room_id="family_all",
        sender_username=sender_username,
        text=msg_text,
        msg_type="TEXT"
    )
    return {"success": True, "message": f"{child_username}에게 위치 전송 요청을 보냈습니다."}
