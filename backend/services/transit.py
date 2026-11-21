import urllib.request
import urllib.parse
import json
from backend.config import DATA_GO_KR_API_KEY
from backend.database import get_db_connection, get_cached_data, set_cached_data
from backend.mock_data import get_simulated_transit

async def get_transit_routes():
    cache_key = "transit_routes_real_v2"
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

    simulated = get_simulated_transit()
    results = []

    for i, row in enumerate(rows):
        sim = simulated[i % len(simulated)]
        r_type = row["transit_type"]
        node_id = row["station_id"] or "GGB222000570"
        route_no = str(row["route_no"])

        remain_time = sim["remain_time"]
        remain_stops = sim["remain_stops"]
        crowded_level = sim["crowded_level"]
        badge_color = sim["badge_color"]

        # TAGO 버스 실시간 API 조회
        if DATA_GO_KR_API_KEY and r_type == "BUS":
            try:
                url = "http://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList"
                params = {
                    "serviceKey": DATA_GO_KR_API_KEY,
                    "cityCode": "31130",  # 남양주시
                    "nodeId": node_id,
                    "numOfRows": "20",
                    "pageNo": "1",
                    "_type": "json"
                }
                req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}")
                with urllib.request.urlopen(req, timeout=4) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                    if isinstance(items, dict):
                        items = [items]

                    # 등록된 노선 번호와 매칭
                    matched = None
                    for it in items:
                        if str(it.get("routeno")) == route_no or route_no in str(it.get("routeno")):
                            matched = it
                            break

                    if matched:
                        sec = int(matched.get("arrtime", 0))
                        mins = max(1, sec // 60)
                        cnt = matched.get("arrprevstationcnt", 1)
                        v_type = matched.get("vehicletp", "일반")
                        remain_time = f"{mins}분 후 도착"
                        remain_stops = f"{cnt}정거장 전 ({v_type})"
                        badge_color = "#10b981" if mins <= 5 else "#3b82f6"
            except Exception:
                pass  # 실패 시 시뮬레이션 데이터 유지

        results.append({
            "id": row["id"],
            "member_name": row["member_name"] or "가족공용",
            "title": row["title"],
            "transit_type": r_type,
            "station_id": node_id,
            "station_name": row["station_name"],
            "route_no": row["route_no"],
            "destination": row["target_destination"],
            "remain_time": remain_time,
            "remain_stops": remain_stops,
            "crowded_level": crowded_level,
            "badge_color": badge_color
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
