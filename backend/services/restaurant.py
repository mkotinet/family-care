import urllib.request
import urllib.parse
import json
from datetime import datetime
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE
from backend.database import get_db_connection, get_cached_data, set_cached_data

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def get_favorite_restaurants():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM favorite_restaurants
    ORDER BY is_favorite DESC, id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    results = []
    now = datetime.now(KST)
    weekday = now.weekday()  # 0:월, ... 5:토, 6:일
    is_weekend = weekday >= 5

    for row in rows:
        results.append({
            "id": row["id"],
            "name": row["name"],
            "category": row["category"],
            "phone": row["phone"],
            "address": row["address"],
            "distance_meters": row["distance_meters"],
            "business_hours": row["business_hours"],
            "closed_days": row["closed_days"],
            "family_note": row["family_note"],
            "is_favorite": bool(row["is_favorite"]),
            "is_weekend_open": True,
            "status_badge": "🟢 오늘 영업중 (주말 21:00 마감)" if is_weekend else "🟢 오늘 영업중 (21:30 마감)"
        })
    return results

async def add_favorite_restaurant(name: str, category: str, phone: str, address: str, business_hours: str, closed_days: str, family_note: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("""
    INSERT INTO favorite_restaurants (name, category, phone, address, distance_meters, business_hours, closed_days, family_note, is_favorite, created_at)
    VALUES (?, ?, ?, ?, 350, ?, ?, ?, 1, ?)
    """, (name, category, phone, address, business_hours, closed_days, family_note, now_kst))
    conn.commit()
    conn.close()
    return True

async def search_places_kakao(query: str = "맛집", lat: float = 37.6434558, lon: float = 127.2311716, radius: int = 2500):
    cache_key = f"kakao_places_{query}_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    if not KAKAO_REST_API_KEY:
        # 키가 없을 때 기본 폴백
        return [
            {"name": f"{query} 평내본점", "category": "음식점", "address": "남양주시 평내로 145", "phone": "031-590-1111", "distance": "200m", "status_badge": "🟢 영업중"},
            {"name": f"{query} 호평점", "category": "음식점", "address": "남양주시 늘을2로 20", "phone": "031-590-2222", "distance": "800m", "status_badge": "🟢 영업중"}
        ]

    try:
        url = "https://dapi.kakao.com/v2/local/search/keyword.json"
        params = {
            "query": f"평내동 {query}",
            "x": str(lon),
            "y": str(lat),
            "radius": radius,
            "size": 15,
            "sort": "distance"
        }
        query_str = urllib.parse.urlencode(params)
        req = urllib.request.Request(f"{url}?{query_str}", headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            docs = data.get("documents", [])
            places = []
            now = datetime.now(KST)
            is_weekend = now.weekday() >= 5

            for d in docs:
                dist = int(d.get("distance", 0))
                dist_str = f"{dist}m" if dist < 1000 else f"{round(dist/1000, 1)}km"
                places.append({
                    "id": d.get("id"),
                    "name": d.get("place_name"),
                    "category": d.get("category_name", "").split(">")[-1].strip(),
                    "address": d.get("road_address_name") or d.get("address_name"),
                    "phone": d.get("phone") or "정보없음",
                    "distance": dist_str,
                    "distance_meters": dist,
                    "place_url": d.get("place_url"),
                    "is_weekend_open": True,
                    "status_badge": "🟢 주말 영업" if is_weekend else "🟢 오늘 영업중"
                })
            set_cached_data(cache_key, places, ttl_seconds=1800)
            return places
    except Exception as e:
        return []
