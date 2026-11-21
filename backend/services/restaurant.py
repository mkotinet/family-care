import urllib.request
import urllib.parse
import json
from datetime import datetime
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE
from backend.database import get_db_connection

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
    weekday = now.weekday() # 0:월, ... 5:토, 6:일
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
            "is_weekend_open": True, # 기본 주말 오픈 여부
            "status_badge": "🟢 오늘 영업중"
        })
    return results

async def add_favorite_restaurant(name: str, category: str, phone: str, address: str, business_hours: str, closed_days: str, family_note: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("""
    INSERT INTO favorite_restaurants (name, category, phone, address, distance_meters, business_hours, closed_days, family_note, is_favorite, created_at)
    VALUES (?, ?, ?, ?, 300, ?, ?, ?, 1, ?)
    """, (name, category, phone, address, business_hours, closed_days, family_note, now_kst))
    conn.commit()
    conn.close()
    return True

async def search_places_kakao(query: str, lat: float, lon: float):
    if not KAKAO_REST_API_KEY:
        # 키가 없을 때 기본 평내동 인근 음식점 추천 목록
        return [
            {"name": f"{query} 평내본점", "category": "음식점", "address": "남양주시 평내로 145", "phone": "031-590-1111", "distance": "200m"},
            {"name": f"{query} 호평점", "category": "음식점", "address": "남양주시 늘을2로 20", "phone": "031-590-2222", "distance": "800m"}
        ]
    try:
        url = "https://dapi.kakao.com/v2/local/search/keyword.json"
        params = {"query": query, "x": str(lon), "y": str(lat), "radius": 5000, "size": 5}
        query_str = urllib.parse.urlencode(params)
        req = urllib.request.Request(f"{url}?{query_str}", headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            docs = data.get("documents", [])
            return [
                {
                    "name": d.get("place_name"),
                    "category": d.get("category_name", "").split(">")[-1].strip(),
                    "address": d.get("road_address_name") or d.get("address_name"),
                    "phone": d.get("phone"),
                    "distance": f"{d.get('distance')}m"
                }
                for d in docs
            ]
    except Exception:
        return []
