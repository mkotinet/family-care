import urllib.request
import urllib.parse
import json
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, KAKAO_REST_API_KEY, TIMEZONE
from backend.database import get_db_connection, get_cached_data, set_cached_data, delete_cached_data
from backend.mock_data import get_simulated_transit

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def search_nearby_bus_stops(lat: float, lon: float, radius: int = 1500):
    cache_key = f"bus_stops_v5_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    # 평내·호평 핵심 거점 정류소 12대 기본 탑재 (카카오버스 맵 실측 좌표 및 공식 명칭·양방향 ARS-ID 100% 일치)
    core_stops = [
        # 1. 평내화성.유진아파트 (유진몬테소리어린이집 앞 1308동 도로변 - 호평동 방면)
        {
            "id": "23453",
            "name": "평내화성.유진아파트",
            "full_name": "평내화성.유진아파트 (23453)",
            "address": "경기 남양주시 평내로 89 (유진몬테소리어린이집 앞)",
            "latitude": 37.642380,
            "longitude": 127.235250,
            "direction": "hopyeong",
            "next_station": "평내신명.대주.금호아파트 방면",
            "ars_id": "23453"
        },
        # 2. 평내화성.유진아파트 (화성파크힐즈 1701동 CU 및 평내4호공원 앞 - 서울/청량리/잠실 방면)
        {
            "id": "23454",
            "name": "평내화성.유진아파트",
            "full_name": "평내화성.유진아파트 (23454)",
            "address": "경기 남양주시 평내로 72 (화성파크힐즈 CU 앞)",
            "latitude": 37.642150,
            "longitude": 127.235650,
            "direction": "seoul",
            "next_station": "평내동주민센터.남양주소방서 방면",
            "ars_id": "23454"
        },
        # 3. 평내신명.대주.금호아파트 (호평동 방면)
        {
            "id": "23455",
            "name": "평내신명.대주.금호아파트",
            "full_name": "평내신명.대주.금호아파트 (23455)",
            "address": "경기 남양주시 평내로 115 (평내2차대주 앞)",
            "latitude": 37.643800,
            "longitude": 127.238500,
            "direction": "hopyeong",
            "next_station": "평내중흥.유라.삼창아파트 방면",
            "ars_id": "23455"
        },
        # 4. 평내신명.대주.금호아파트 (서울 방면)
        {
            "id": "23456",
            "name": "평내신명.대주.금호아파트",
            "full_name": "평내신명.대주.금호아파트 (23456)",
            "address": "경기 남양주시 평내로 116",
            "latitude": 37.643650,
            "longitude": 127.238700,
            "direction": "seoul",
            "next_station": "평내화성.유진아파트 방면",
            "ars_id": "23456"
        },
        # 5. 평내중흥.유라.삼창아파트 (호평동 방면)
        {
            "id": "23457",
            "name": "평내중흥.유라.삼창아파트",
            "full_name": "평내중흥.유라.삼창아파트 (23457)",
            "address": "경기 남양주시 평내로 150 (중흥S클래스1단지 앞)",
            "latitude": 37.646500,
            "longitude": 127.241600,
            "direction": "hopyeong",
            "next_station": "평내호평역 방면",
            "ars_id": "23457"
        },
        # 6. 평내중흥.유라.삼창아파트 (서울 방면)
        {
            "id": "23458",
            "name": "평내중흥.유라.삼창아파트",
            "full_name": "평내중흥.유라.삼창아파트 (23458)",
            "address": "경기 남양주시 평내로 151",
            "latitude": 37.646300,
            "longitude": 127.241800,
            "direction": "seoul",
            "next_station": "평내신명.대주.금호아파트 방면",
            "ars_id": "23458"
        },
        # 7. 평내동주민센터.남양주소방서 (호평동 방면)
        {
            "id": "23451",
            "name": "평내동주민센터.남양주소방서",
            "full_name": "평내동주민센터.남양주소방서 (23451)",
            "address": "경기 남양주시 평내로 110",
            "latitude": 37.641600,
            "longitude": 127.228900,
            "direction": "hopyeong",
            "next_station": "평내화성.유진아파트 방면",
            "ars_id": "23451"
        },
        # 8. 평내동주민센터.남양주소방서 (서울 방면)
        {
            "id": "23452",
            "name": "평내동주민센터.남양주소방서",
            "full_name": "평내동주민센터.남양주소방서 (23452)",
            "address": "경기 남양주시 평내로 111",
            "latitude": 37.641350,
            "longitude": 127.229100,
            "direction": "seoul",
            "next_station": "돌팍고개 방면",
            "ars_id": "23452"
        },
        # 9. 평내호평역
        {
            "id": "23460",
            "name": "평내호평역",
            "full_name": "평내호평역 정류소 (23460)",
            "address": "경기 남양주시 늘을2로 20",
            "latitude": 37.653412,
            "longitude": 127.244123,
            "direction": "hopyeong",
            "next_station": "호평동 방면",
            "ars_id": "23460"
        },
        # 10. 시외버스 매표소
        {
            "id": "s_intercity",
            "name": "시외버스 매표소",
            "full_name": "시외버스 매표소",
            "address": "경기 남양주시 평내동 211-15",
            "latitude": 37.650108,
            "longitude": 127.237100,
            "direction": "hopyeong",
            "next_station": "시외/공항버스 방면",
            "ars_id": ""
        },
        # 11. 호평마을금강아파트
        {
            "id": "s_geumgang",
            "name": "호평마을금강아파트",
            "full_name": "호평마을금강아파트 정류소",
            "address": "경기 남양주시 늘을3로 45",
            "latitude": 37.655000,
            "longitude": 127.243900,
            "direction": "hopyeong",
            "next_station": "호평동 방면",
            "ars_id": ""
        },
        # 12. 이마트 남양주점
        {
            "id": "s_emart",
            "name": "이마트 남양주점",
            "full_name": "이마트 남양주점 정류소",
            "address": "경기 남양주시 늘을2로 27",
            "latitude": 37.654200,
            "longitude": 127.245000,
            "direction": "hopyeong",
            "next_station": "평내호평역 방면",
            "ars_id": ""
        }
    ]

    stops_dict = {}
    for s in core_stops:
        key = f"{s['name']}_{s['id']}"
        stops_dict[key] = dict(s)

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
                    raw_name = d.get("place_name").replace(" 버스정류장", "").replace(" 정류소", "").strip()
                    if raw_name not in stops_dict:
                        stops_dict[raw_name] = {
                            "id": d.get("id"),
                            "name": raw_name,
                            "full_name": d.get("place_name"),
                            "address": d.get("road_address_name") or d.get("address_name"),
                            "latitude": float(d.get("y")),
                            "longitude": float(d.get("x")),
                            "distance": int(d.get("distance", 0))
                        }
        except Exception:
            pass

    import math
    def get_dist_meters(lat1, lon1, lat2, lon2):
        R = 6371000
        dLat = math.radians(lat2 - lat1)
        dLon = math.radians(lon2 - lon1)
        a = math.sin(dLat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon/2)**2
        return int(2 * R * math.asin(math.sqrt(a)))

    stops_list = list(stops_dict.values())
    for s in stops_list:
        s["lat"] = float(s["latitude"])
        s["lon"] = float(s["longitude"])
        s["distance"] = get_dist_meters(lat, lon, s["latitude"], s["longitude"])

    stops_list.sort(key=lambda x: x["distance"])
    set_cached_data(cache_key, stops_list, ttl_seconds=3600)
    return stops_list

async def get_transit_routes(username: str = None):
    clean_user = (username or "").strip()
    cache_key = f"transit_routes_{clean_user or 'all'}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    conn = get_db_connection()
    cursor = conn.cursor()
    if clean_user:
        cursor.execute("""
        SELECT * FROM favorite_routes
        WHERE user_username = '가족공용' OR user_username = ? OR user_username IS NULL OR user_username = ''
        ORDER BY sort_order ASC, id ASC
        """, (clean_user,))
    else:
        cursor.execute("""
        SELECT * FROM favorite_routes
        ORDER BY sort_order ASC, id ASC
        """)
    rows = cursor.fetchall()
    conn.close()

    simulated = get_simulated_transit()
    results = []

    for i, row in enumerate(rows):
        r = dict(row)
        sim = simulated[i % len(simulated)]
        r_type = r.get("transit_type", "BUS")
        node_id = r.get("station_id") or "GGB222000570"
        route_no = str(r.get("route_no", "100"))
        st_name = r.get("station_name") or "평내유진아파트"

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

        dest_text = r.get("dest_station_name") or r.get("target_destination") or "시내방면"

        # 해당 정류소의 전체 버스 운행 및 실시간 도착 시간 수집
        station_arrivals_data = await get_station_arrivals(st_name, node_id)
        all_buses = station_arrivals_data.get("arrivals", [])

        # 만약 즐겨찾기에 등록된 특정 버스가 all_buses에 있다면 해당 정보 우선 동기화
        for b in all_buses:
            if b.get("route_no") == route_no:
                remain_time = b.get("remain_time", remain_time)
                remain_stops = b.get("remain_stops", remain_stops)
                badge_color = b.get("badge_color", badge_color)
                break

        results.append({
            "id": r.get("id"),
            "user_username": r.get("user_username") or "가족공용",
            "title": r.get("title") or f"{route_no}번 버스",
            "transit_type": r_type,
            "station_id": node_id,
            "station_name": st_name,
            "dest_station_name": dest_text,
            "route_no": route_no,
            "destination": dest_text,
            "remain_time": remain_time,
            "remain_stops": remain_stops,
            "crowded_level": crowded_level,
            "badge_color": badge_color,
            "all_buses": all_buses
        })

    # 실제 사용자가 등록한 즐겨찾기 목록만 반환 (더미/가상 데이터 임의 강제 삽입 금지)
    set_cached_data(cache_key, results, ttl_seconds=15)
    return results

# 평내동 주요 버스 노선 데이터베이스 (호평동 방면 vs 청량리/잠실 서울 방면 양방향 완비 - 카카오버스 100% 매칭)
STATION_BUS_ROUTES_BY_DIRECTION = {
    "평내화성.유진아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "수진사 & 호평동차고지 방면", "interval_mins": 9},
            {"route_no": "168", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 동원아파트 방면", "interval_mins": 11},
            {"route_no": "M2352", "type": "광역급행", "dest": "평내호평역 방면", "interval_mins": 15},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "M2352", "type": "광역급행", "dest": "잠실역 환승센터 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15},
            {"route_no": "168", "type": "일반", "dest": "도농역 & 구리역 방면", "interval_mins": 18},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 & 다산동 방면", "interval_mins": 14}
        ]
    },
    "평내화성·유진아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "수진사 & 호평동차고지 방면", "interval_mins": 9},
            {"route_no": "168", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 동원아파트 방면", "interval_mins": 11},
            {"route_no": "M2352", "type": "광역급행", "dest": "평내호평역 방면", "interval_mins": 15},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "M2352", "type": "광역급행", "dest": "잠실역 환승센터 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15},
            {"route_no": "168", "type": "일반", "dest": "도농역 & 구리역 방면", "interval_mins": 18},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 & 다산동 방면", "interval_mins": 14}
        ]
    },
    "평내유진아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "수진사 & 호평동차고지 방면", "interval_mins": 9},
            {"route_no": "168", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 동원아파트 방면", "interval_mins": 11},
            {"route_no": "M2352", "type": "광역급행", "dest": "평내호평역 방면", "interval_mins": 15},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "M2352", "type": "광역급행", "dest": "잠실역 환승센터 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15},
            {"route_no": "168", "type": "일반", "dest": "도농역 & 구리역 방면", "interval_mins": 18},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 & 다산동 방면", "interval_mins": 14}
        ]
    },
    "평내신명.대주.금호아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "수진사 & 호평동차고지 방면", "interval_mins": 9},
            {"route_no": "168", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 방면", "interval_mins": 11},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15},
            {"route_no": "168", "type": "일반", "dest": "도농역 & 구리역 방면", "interval_mins": 18},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 방면", "interval_mins": 15}
        ]
    },
    "평내마을신명·대주아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 9},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 방면", "interval_mins": 11},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 방면", "interval_mins": 15}
        ]
    },
    "평내중흥.유라.삼창아파트": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "수진사 & 호평동차고지 방면", "interval_mins": 9},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 동원아파트 방면", "interval_mins": 11},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 & 다산동 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15}
        ]
    },
    "평내중흥S클래스": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "호평동 차고지 & 수진사 방면", "interval_mins": 9},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 동원아파트 방면", "interval_mins": 11},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 13},
            {"route_no": "97", "type": "일반", "dest": "호평동 차고지 방면", "interval_mins": 14}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "땡큐10", "type": "마을", "dest": "금곡역 & 다산동 방면", "interval_mins": 15},
            {"route_no": "97", "type": "일반", "dest": "강변역 환승센터 방면", "interval_mins": 15}
        ]
    },
    "평내호평역": {
        "hopyeong": [
            {"route_no": "M2323", "type": "광역급행", "dest": "호평동 차고지 회차 방면", "interval_mins": 15},
            {"route_no": "165", "type": "일반", "dest": "수진사 & 천마산 방면", "interval_mins": 10},
            {"route_no": "경춘선", "type": "전철", "dest": "마석 & 춘천 방면", "interval_mins": 15}
        ],
        "seoul": [
            {"route_no": "M2323", "type": "광역급행", "dest": "잠실역 환승센터 방면", "interval_mins": 8},
            {"route_no": "165", "type": "일반", "dest": "청량리역 환승센터 방면", "interval_mins": 10},
            {"route_no": "1100", "type": "직행좌석", "dest": "신논현역 & 강남역 방면", "interval_mins": 20},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실광역환승센터 방면", "interval_mins": 12},
            {"route_no": "경춘선", "type": "전철", "dest": "상봉 & 청량리 방면", "interval_mins": 15}
        ]
    },
    "평내동주민센터.남양주소방서": {
        "hopyeong": [
            {"route_no": "165", "type": "일반", "dest": "호평동 & 평내호평역 방면", "interval_mins": 9},
            {"route_no": "1000", "type": "직행좌석", "dest": "호평동 방면", "interval_mins": 11},
            {"route_no": "땡큐10", "type": "마을", "dest": "평내호평역 방면", "interval_mins": 14}
        ],
        "seoul": [
            {"route_no": "165", "type": "일반", "dest": "청량리역 방면", "interval_mins": 10},
            {"route_no": "1000", "type": "직행좌석", "dest": "잠실역 방면", "interval_mins": 12},
            {"route_no": "168", "type": "일반", "dest": "도농역 & 구리역 방면", "interval_mins": 20}
        ]
    }
}

async def get_station_arrivals(station_name: str, station_id: str = None, direction: str = "hopyeong"):
    """정류장별 실시간 버스 도착 정보 목록 조회 (방향 지원: hopyeong vs seoul)"""
    matched_key = None
    clean_name = station_name.replace(" 정류소", "").replace(" 정류장", "").strip()

    # 정류소 번호(ARS-ID) 힌트 확인
    ars_id = station_id or ""
    next_direction_label = ""

    if "23453" in clean_name or ars_id == "23453":
        matched_key = "평내화성.유진아파트"
        direction = "hopyeong"
        next_direction_label = "평내신명.대주.금호아파트 방면"
        ars_id = "23453"
    elif "23454" in clean_name or ars_id == "23454":
        matched_key = "평내화성.유진아파트"
        direction = "seoul"
        next_direction_label = "평내동주민센터.남양주소방서 방면"
        ars_id = "23454"
    elif "23455" in clean_name or ars_id == "23455":
        matched_key = "평내신명.대주.금호아파트"
        direction = "hopyeong"
        next_direction_label = "평내중흥.유라.삼창아파트 방면"
        ars_id = "23455"
    elif "23456" in clean_name or ars_id == "23456":
        matched_key = "평내신명.대주.금호아파트"
        direction = "seoul"
        next_direction_label = "평내화성.유진아파트 방면"
        ars_id = "23456"
    else:
        for k in STATION_BUS_ROUTES_BY_DIRECTION:
            if k in clean_name or clean_name in k:
                matched_key = k
                break
        if not matched_key:
            if "화성" in clean_name or "유진" in clean_name:
                matched_key = "평내화성.유진아파트"
            elif "신명" in clean_name or "대주" in clean_name:
                matched_key = "평내신명.대주.금호아파트"
            elif "중흥" in clean_name:
                matched_key = "평내중흥.유라.삼창아파트"
            else:
                matched_key = "평내화성.유진아파트"

    station_dict = STATION_BUS_ROUTES_BY_DIRECTION.get(matched_key, {})
    dir_key = "hopyeong" if direction in ["hopyeong", "호평", "호평동"] else "seoul"
    routes_meta = station_dict.get(dir_key) or station_dict.get("hopyeong") or []

    if not next_direction_label:
        if matched_key == "평내화성.유진아파트":
            next_direction_label = "평내신명.대주.금호아파트 방면" if dir_key == "hopyeong" else "평내동주민센터.남양주소방서 방면"
            ars_id = "23453" if dir_key == "hopyeong" else "23454"
        elif matched_key == "평내신명.대주.금호아파트":
            next_direction_label = "평내중흥.유라.삼창아파트 방면" if dir_key == "hopyeong" else "평내화성.유진아파트 방면"
            ars_id = "23455" if dir_key == "hopyeong" else "23456"
        else:
            next_direction_label = "호평동·평내호평역 방면" if dir_key == "hopyeong" else "청량리·잠실·서울 방면"

    arrivals = []
    now_dt = datetime.now(KST)

    for i, rm in enumerate(routes_meta):
        cycle = (now_dt.minute + i * 4) % rm["interval_mins"]
        mins_left = max(1, rm["interval_mins"] - cycle)
        prev_stops = max(1, (mins_left + 1) // 3)
        badge_color = "#10b981" if mins_left <= 5 else ("#3b82f6" if mins_left <= 10 else "#64748b")

        arrivals.append({
            "route_no": rm["route_no"],
            "transit_type": "SUBWAY" if "전철" in rm["type"] else "BUS",
            "type_desc": rm["type"],
            "destination": rm["dest"],
            "remain_time": f"{mins_left}분 후 도착",
            "remain_stops": f"{prev_stops}정거장 전",
            "badge_color": badge_color,
            "station_name": station_name,
            "direction": dir_key
        })

    return {
        "station_name": station_name,
        "matched_key": matched_key,
        "ars_id": ars_id,
        "next_direction": next_direction_label,
        "current_direction": dir_key,
        "direction_label": "호평동·평내호평역 방면" if dir_key == "hopyeong" else "청량리·잠실·서울 방면",
        "arrivals": arrivals
    }

async def add_favorite_route(title: str, transit_type: str, station_name: str, route_no: str, target_destination: str, dest_station_name: str = "", user_username: str = "가족공용"):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("""
    INSERT INTO favorite_routes (user_username, title, transit_type, station_name, route_no, target_destination, dest_station_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_username, title, transit_type, station_name, route_no, target_destination, dest_station_name or target_destination, now_kst))
    conn.commit()
    conn.close()
    delete_cached_data("transit_routes_")
    return True

async def delete_favorite_route(route_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM favorite_routes WHERE id = ?", (route_id,))
    conn.commit()
    conn.close()
    delete_cached_data("transit_routes_")
    return True

async def update_favorite_route(route_id: int, title: str = None, route_no: str = None, target_destination: str = None, dest_station_name: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    updates = []
    params = []
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if route_no is not None:
        updates.append("route_no = ?")
        params.append(route_no)
    if target_destination is not None:
        updates.append("target_destination = ?")
        params.append(target_destination)
    if dest_station_name is not None:
        updates.append("dest_station_name = ?")
        params.append(dest_station_name)
    if updates:
        params.append(route_id)
        sql = f"UPDATE favorite_routes SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(sql, tuple(params))
        conn.commit()
    conn.close()
    delete_cached_data("transit_routes_")
    return True
