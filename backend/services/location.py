import urllib.request
import urllib.parse
import json
from datetime import datetime
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE, DEFAULT_LOCATION
from backend.database import get_db_connection
from backend.coords import haversine_distance

KST = zoneinfo.ZoneInfo(TIMEZONE)

# 가족 주요 안심 거점 (지오펜스)
SAFE_ZONES = [
    {"name": "집 (평내유진마젤란)", "lat": 37.6434558, "lon": 127.2311716, "radius": 200},
    {"name": "평내초등학교 & 병설유치원", "lat": 37.646123, "lon": 127.234512, "radius": 250},
    {"name": "평내호평역 & 학원가", "lat": 37.653412, "lon": 127.244123, "radius": 300},
    {"name": "평내도서관 & 주민센터", "lat": 37.641203, "lon": 127.228945, "radius": 200}
]

def determine_landmark(lat: float, lon: float):
    for zone in SAFE_ZONES:
        dist = haversine_distance(lat, lon, zone["lat"], zone["lon"])
        if dist <= zone["radius"]:
            return f"{zone['name']} 안심구역 (반경 {int(dist)}m)"

    # 집과의 거리 계산
    home_dist = haversine_distance(lat, lon, DEFAULT_LOCATION["lat"], DEFAULT_LOCATION["lon"])
    if home_dist < 1000:
        return f"집 인근 ({int(home_dist)}m)"
    else:
        return f"외출 중 (집에서 {round(home_dist/1000, 1)}km)"

async def update_user_location(username: str, lat: float, lon: float, accuracy: float = 10.0, battery: int = 100, is_moving: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")

    landmark = determine_landmark(lat, lon)
    address = "경기도 남양주시 평내동"

    # 카카오 좌표계 변환 및 상세 주소 조회 (가능한 경우)
    if KAKAO_REST_API_KEY:
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
    INSERT INTO user_locations (username, latitude, longitude, accuracy, address, landmark, battery_level, is_moving, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        address = excluded.address,
        landmark = excluded.landmark,
        battery_level = excluded.battery_level,
        is_moving = excluded.is_moving,
        updated_at = excluded.updated_at
    """, (username, lat, lon, accuracy, address, landmark, battery, 1 if is_moving else 0, now_kst))

    conn.commit()
    conn.close()
    return {"success": True, "landmark": landmark, "address": address, "updated_at": now_kst}

async def get_family_locations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT l.*, u.name, u.role_title, u.role_type, u.avatar, u.avatar_color
    FROM user_locations l
    JOIN users u ON l.username = u.username
    ORDER BY u.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    children = []
    parents = []

    for r in rows:
        item = {
            "username": r["username"],
            "name": r["name"],
            "role_title": r["role_title"],
            "role_type": r["role_type"],
            "avatar": r["avatar"],
            "avatar_color": r["avatar_color"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "accuracy": r["accuracy"],
            "address": r["address"],
            "landmark": r["landmark"],
            "battery_level": r["battery_level"],
            "is_moving": bool(r["is_moving"]),
            "updated_at": r["updated_at"],
            "status_badge": "🟢 안심 구역" if "안심" in (r["landmark"] or "") or "집" in (r["landmark"] or "") else "🟡 이동 중"
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
