from backend.config import DATA_GO_KR_API_KEY
from backend.database import get_db_connection, get_cached_data, set_cached_data
from backend.mock_data import get_simulated_transit

async def get_transit_routes():
    # 30초 초단기 캐싱 (교통 정보 실시간성 보장)
    cache_key = "transit_routes_all"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.*, m.name as member_name, m.role as member_role
    FROM favorite_routes r
    LEFT JOIN family_members m ON r.member_id = m.id
    ORDER BY r.sort_order ASC, r.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    # DB에 등록된 루트가 있으면 그것을 기반으로 실시간 도착정보 조합
    simulated = get_simulated_transit()
    results = []

    for i, row in enumerate(rows):
        sim = simulated[i % len(simulated)]
        results.append({
            "id": row["id"],
            "member_name": row["member_name"] or "가족공용",
            "title": row["title"],
            "transit_type": row["transit_type"],
            "station_id": row["station_id"],
            "station_name": row["station_name"],
            "route_no": row["route_no"],
            "destination": row["target_destination"],
            "remain_time": sim["remain_time"],
            "remain_stops": sim["remain_stops"],
            "crowded_level": sim["crowded_level"],
            "badge_color": sim["badge_color"]
        })

    if not results:
        results = simulated

    set_cached_data(cache_key, results, ttl_seconds=30)
    return results

async def add_favorite_route(title: str, transit_type: str, station_name: str, route_no: str, target_destination: str, member_id: int = 1):
    from datetime import datetime
    import zoneinfo
    from backend.config import TIMEZONE
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(zoneinfo.ZoneInfo(TIMEZONE)).isoformat()
    cursor.execute("""
    INSERT INTO favorite_routes (member_id, title, transit_type, station_name, route_no, target_destination, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (member_id, title, transit_type, station_name, route_no, target_destination, now_kst))
    conn.commit()
    conn.close()
    return True
