import urllib.parse
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, TIMEZONE
from backend.database import get_cached_data, set_cached_data
from backend.http_client import async_http_get_json
from backend.mock_data import get_simulated_culture

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def get_culture_and_crowd(lat: float = 37.643421, lon: float = 127.236018, scope: str = "local"):
    cache_key = f"culture_crowd_{scope}_v3"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    now = datetime.now(KST)
    start_date = now.strftime("%Y%m01")

    # 시뮬레이션 기본 데이터 준비
    simulated = get_simulated_culture()
    local_sim_festivals = [
        {
            "title": "남양주 물골안 계곡 단풍 & 겨울빛 축제",
            "location": "남양주시 수동면 물골안유원지 일대",
            "period": "2026.11.01 ~ 2026.12.15",
            "category": "자연/빛축제",
            "image": "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&q=80",
            "expected_crowd": "보통 (가족 힐링 추천) 👨‍👩‍👧",
            "crowd_badge": "🟢 여유",
            "is_local": True
        },
        {
            "title": "가평 아침고요수목원 오색별빛정원전",
            "location": "가평군 상면 수목원로 432",
            "period": "2026.11.15 ~ 2027.01.31",
            "category": "빛축제",
            "image": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80",
            "expected_crowd": "약간 붐빔 (주말 저녁) ✨",
            "crowd_badge": "🟠 보통",
            "is_local": True
        },
        {
            "title": "양평 용문산 산나물 & 은행나무 숲길 나들이",
            "location": "양평군 용문면 용문산로 656",
            "period": "2026.11.01 ~ 2026.11.30",
            "category": "자연/생태",
            "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80",
            "expected_crowd": "여유로움 (산책 적합) 🍂",
            "crowd_badge": "🟢 여유",
            "is_local": True
        },
        {
            "title": "서울 롯데월드타워 & 석촌호수 루미나리에",
            "location": "서울 송파구 잠실로 148",
            "period": "2026.11.10 ~ 2026.12.31",
            "category": "도심/빛축제",
            "image": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
            "expected_crowd": "매우 붐빔 (대중교통 권장) 🚇",
            "crowd_badge": "🔴 붐빔",
            "is_local": True
        }
    ]

    all_sim_festivals = local_sim_festivals + (simulated.get("festivals") or [])

    festivals = []

    if DATA_GO_KR_API_KEY:
        try:
            url = "https://apis.data.go.kr/B551011/KorService2/searchFestival2"
            params = {
                "serviceKey": DATA_GO_KR_API_KEY,
                "numOfRows": "20",
                "pageNo": "1",
                "MobileOS": "ETC",
                "MobileApp": "FamilyCare",
                "_type": "json",
                "eventStartDate": start_date
            }
            if scope == "local":
                params["areaCode"] = "31"  # 경기도

            data = await async_http_get_json(f"{url}?{urllib.parse.urlencode(params)}", timeout=5.0)
            items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
            if isinstance(items, dict):
                items = [items]

            for it in items:
                title = it.get("title", "")
                addr = it.get("addr1", "")
                img = it.get("firstimage") or it.get("firstimage2")
                s_date = it.get("eventstartdate", "")
                e_date = it.get("eventenddate", "")
                period = f"{s_date[:4]}.{s_date[4:6]}.{s_date[6:]} ~ {e_date[:4]}.{e_date[4:6]}.{e_date[6:]}" if len(s_date) == 8 and len(e_date) == 8 else "상시 진행"

                festivals.append({
                    "title": title,
                    "location": addr or ("경기/수도권 일대" if scope == "local" else "전국"),
                    "period": period,
                    "category": "축제/전시",
                    "image": img or "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&q=80",
                    "expected_crowd": "보통 (나들이 적합) 👨‍👩‍👧",
                    "crowd_badge": "🟡 보통",
                    "is_local": scope == "local"
                })
        except Exception:
            pass

    if not festivals:
        festivals = local_sim_festivals if scope == "local" else all_sim_festivals

    weekday = now.weekday()
    is_weekend = weekday >= 5
    crowd_spots = [
        {
            "spot_name": "평내호평역 중앙광장 & 상업지구",
            "current_level": "약간 붐빔" if is_weekend else "여유로움",
            "level_badge": "🟠 약간 붐빔" if is_weekend else "🟢 여유",
            "peak_time": "주말 14:00 ~ 18:00",
            "tip": "도보 이동 추천, 공영주차장 혼잡"
        },
        {
            "spot_name": "호평 이마트 & 메가박스",
            "current_level": "매우 붐빔" if is_weekend else "보통",
            "level_badge": "🔴 붐빔" if is_weekend else "🟡 보통",
            "peak_time": "주말 13:00 ~ 17:00",
            "tip": "지하주차장 대기 발생 가능, 오전 방문 권장"
        },
        {
            "spot_name": "물골안유원지 / 수동계곡 산책로",
            "current_level": "여유로움",
            "level_badge": "🟢 여유",
            "peak_time": "오후 12:00 ~ 15:00",
            "tip": "가족 힐링 산책 추천, 공기 쾌적"
        }
    ]

    result = {
        "scope": scope,
        "scope_desc": "내 주변 (경기/수도권) 축제 & 나들이" if scope == "local" else "전국 축제 & 행사 전체",
        "festivals": festivals,
        "crowd_spots": crowd_spots
    }
    set_cached_data(cache_key, result, ttl_seconds=1800)
    return result
