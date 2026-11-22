import urllib.parse
from datetime import datetime
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE
from backend.coords import haversine_distance
from backend.database import get_db_connection, get_cached_data, set_cached_data
from backend.http_client import async_http_get_json
from backend.services.location import reverse_geocode

KST = zoneinfo.ZoneInfo(TIMEZONE)

def _dynamic_restaurant_status(now: datetime, is_weekend: bool) -> str:
    """현재 KST 시각 기반 동적 영업 상태 표출 (새벽/심야 '영업중' 오표기 방지)"""
    hm = now.hour * 100 + now.minute
    close_str = "21:00" if is_weekend else "21:30"
    close_hm = 2100 if is_weekend else 2130
    if 1100 <= hm <= close_hm:
        return f"🟢 영업중 ({close_str} 마감 예상)"
    if hm < 1100:
        return "🟡 영업 준비중 (11:00 오픈 예상)"
    return "🔴 영업종료 (전화 확인 권장)"

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
            "status_badge": _dynamic_restaurant_status(now, is_weekend)
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

async def delete_favorite_restaurant(restaurant_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM favorite_restaurants WHERE id = ?", (restaurant_id,))
    conn.commit()
    conn.close()
    return True

async def update_favorite_restaurant(restaurant_id: int, name: str = None, category: str = None, phone: str = None, address: str = None, family_note: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    updates = []
    params = []
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    if category is not None:
        updates.append("category = ?")
        params.append(category)
    if phone is not None:
        updates.append("phone = ?")
        params.append(phone)
    if address is not None:
        updates.append("address = ?")
        params.append(address)
    if family_note is not None:
        updates.append("family_note = ?")
        params.append(family_note)
    if updates:
        params.append(restaurant_id)
        sql = f"UPDATE favorite_restaurants SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(sql, tuple(params))
        conn.commit()
    conn.close()
    return True

async def search_places_kakao(query: str = "맛집", lat: float = 37.643421, lon: float = 127.236018, radius: int = 4000):
    clean_q = (query or "맛집").strip()
    cache_key = f"kakao_places_{clean_q}_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    if not KAKAO_REST_API_KEY:
        # 키가 없을 때 기본 폴백
        return [
            {"name": f"{clean_q} 평내본점", "category": "음식점", "address": "남양주시 평내로 145", "phone": "031-590-1111", "distance": "200m", "distance_meters": 200, "lat": lat + 0.002, "lon": lon + 0.002, "latitude": lat + 0.002, "longitude": lon + 0.002, "status_badge": "🟢 영업중"},
            {"name": f"{clean_q} 호평점", "category": "음식점", "address": "남양주시 늘을2로 20", "phone": "031-590-2222", "distance": "800m", "distance_meters": 800, "lat": lat + 0.006, "lon": lon + 0.006, "latitude": lat + 0.006, "longitude": lon + 0.006, "status_badge": "🟢 영업중"}
        ]

    try:
        url = "https://dapi.kakao.com/v2/local/search/keyword.json"
        
        # 1차 시도: 사용자가 입력한 검색어 그대로 + 현재 좌표 반경 검색
        params = {
            "query": clean_q,
            "x": str(lon),
            "y": str(lat),
            "radius": radius,
            "size": 15,
            "sort": "distance"
        }
        query_str = urllib.parse.urlencode(params)
        docs = []
        try:
            data = await async_http_get_json(f"{url}?{query_str}", headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}, timeout=5.0)
            docs = data.get("documents", [])
        except Exception:
            docs = []

        # 만약 반경 내 결과가 0건이면 현재 역지오코딩된 시/군/구 접두사를 붙여 재검색 시도
        if not docs:
            geo = await reverse_geocode(lat, lon)
            area_prefix = geo.get("sigungu") or geo.get("dong") or geo.get("sido_short") or ""
            if area_prefix and area_prefix not in clean_q:
                params["query"] = f"{area_prefix} {clean_q}"
                params.pop("radius", None)
                params.pop("x", None)
                params.pop("y", None)
                query_str = urllib.parse.urlencode(params)
                try:
                    data2 = await async_http_get_json(f"{url}?{query_str}", headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}, timeout=5.0)
                    docs = data2.get("documents", [])
                except Exception:
                    pass

        places = []
        now = datetime.now(KST)
        is_weekend = now.weekday() >= 5
        cur_status_badge = _dynamic_restaurant_status(now, is_weekend)

        for d in docs:
            d_x = float(d.get("x", lon))
            d_y = float(d.get("y", lat))
            dist = int(d.get("distance", 0)) if d.get("distance") else int(haversine_distance(lat, lon, d_y, d_x))
            dist_str = f"{dist}m" if dist < 1000 else f"{round(dist/1000, 1)}km"
            places.append({
                "id": d.get("id"),
                "name": d.get("place_name"),
                "category": d.get("category_name", "").split(">")[-1].strip() or "일반음식점",
                "address": d.get("road_address_name") or d.get("address_name"),
                "phone": d.get("phone") or "정보없음",
                "distance": dist_str,
                "distance_meters": dist,
                "lat": d_y,
                "lon": d_x,
                "latitude": d_y,
                "longitude": d_x,
                "place_url": d.get("place_url"),
                "is_weekend_open": True,
                "status_badge": cur_status_badge
            })

        # 캐시 저장
        if places:
            set_cached_data(cache_key, places, ttl_seconds=1800)
        return places
    except Exception as e:
        return []
