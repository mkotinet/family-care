import urllib.request
import urllib.parse
import json
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, KAKAO_REST_API_KEY, TIMEZONE
from backend.database import get_db_connection, get_cached_data, set_cached_data
from backend.mock_data import get_simulated_transit

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def search_nearby_bus_stops(lat: float, lon: float, radius: int = 1000):
    cache_key = f"bus_stops_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    stops = []
    if KAKAO_REST_API_KEY:
        try:
            url = "https://dapi.kakao.com/v2/local/search/keyword.json"
            params = {
                "query": "버스정류장",
                "x": str(lon),
                "y": str(lat),
                "radius": radius,
                "size": 15,
                "sort": "distance"
            }
            req = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}", headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                for d in data.get("documents", []):
                    stops.append({
                        "id": d.get("id"),
                        "name": d.get("place_name").replace(" 버스정류장", "").strip(),
                        "full_name": d.get("place_name"),
                        "address": d.get("road_address_name") or d.get("address_name"),
                        "latitude": float(d.get("y")),
                        "longitude": float(d.get("x")),
                        "distance": int(d.get("distance", 0))
                    })
        except Exception:
            pass

    if not stops:
        # 평내동 기본 정류소 폴백
        stops = [
            {"id": "s1", "name": "평내유진아파트", "full_name": "평내유진아파트 버스정류장", "address": "남양주시 평내로 145", "latitude": 37.6434558, "longitude": 127.2311716, "distance": 50},
            {"id": "s2", "name": "평내화성·유진아파트", "full_name": "평내화성·유진아파트 정류소", "address": "남양주시 평내로 140", "latitude": 37.643900, "longitude": 127.231500, "distance": 120},
            {"id": "s3", "name": "평내호평역", "full_name": "평내호평역 정류소", "address": "남양주시 늘을2로 20", "latitude": 37.653412, "longitude": 127.244123, "distance": 850},
            {"id": "s4", "name": "평내동주민센터·남양주소방서", "full_name": "평내동주민센터 버스정류장", "address": "남양주시 평내로 110", "latitude": 37.641500, "longitude": 127.229000, "distance": 320}
        ]

    set_cached_data(cache_key, stops, ttl_seconds=3600)
    return stops

async def get_transit_routes():
    cache_key = "transit_routes_real_v3"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM favorite_routes
    ORDER BY sort_order ASC, id ASC
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
                pass

        dest_text = row["dest_station_name"] or row["target_destination"]
        results.append({
            "id": row["id"],
            "user_username": row["user_username"] or "가족공용",
            "title": row["title"],
            "transit_type": r_type,
            "station_id": node_id,
            "station_name": row["station_name"],
            "dest_station_name": dest_text,
            "route_no": row["route_no"],
            "destination": dest_text,
            "remain_time": remain_time,
            "remain_stops": remain_stops,
            "crowded_level": crowded_level,
            "badge_color": badge_color
        })

    if not results:
        results = simulated

    set_cached_data(cache_key, results, ttl_seconds=30)
    return results

async def add_favorite_route(title: str, transit_type: str, station_name: str, route_no: str, target_destination: str, dest_station_name: str = "", user_username: str = "미니미니"):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("""
    INSERT INTO favorite_routes (user_username, title, transit_type, station_name, route_no, target_destination, dest_station_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_username, title, transit_type, station_name, route_no, target_destination, dest_station_name or target_destination, now_kst))
    conn.commit()
    conn.close()
    return True
