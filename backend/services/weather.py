import urllib.request
import urllib.parse
import json
from datetime import datetime, timedelta
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, TIMEZONE
from backend.coords import wgs84_to_kma_grid
from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_weather

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def get_weather_data(lat: float, lon: float):
    # 캐시 확인 (15분 TTL)
    cache_key = f"weather_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    # API 키가 없으면 스마트 시뮬레이션 데이터 반환
    if not DATA_GO_KR_API_KEY:
        data = get_simulated_weather(lat, lon)
        set_cached_data(cache_key, data, ttl_seconds=900)
        return data

    try:
        grid_x, grid_y = wgs84_to_kma_grid(lat, lon)
        now = datetime.now(KST)

        # 기상청 단기예보 기준 발표시간 계산 (02, 05, 08, 11, 14, 17, 20, 23시)
        base_date = now.strftime("%Y%m%d")
        base_time = "0500"
        for t in ["2300", "2000", "1700", "1400", "1100", "0800", "0500", "0200"]:
            t_hour = int(t[:2])
            if now.hour >= t_hour:
                base_time = t
                break
        else:
            # 02시 이전이면 전날 23시 기준
            yesterday = now - timedelta(days=1)
            base_date = yesterday.strftime("%Y%m%d")
            base_time = "2300"

        url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
        params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "pageNo": "1",
            "numOfRows": "60",
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": str(grid_x),
            "ny": str(grid_y)
        }
        query_str = urllib.parse.urlencode(params)
        req = urllib.request.Request(f"{url}?{query_str}", headers={"User-Agent": "FamilyCareApp/1.0"})

        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            items = res_data.get("response", {}).get("body", {}).get("items", {}).get("item", [])

            # 기상청 결과 파싱
            weather_data = get_simulated_weather(lat, lon) # 기본 틀
            for item in items:
                category = item.get("category")
                fcst_val = item.get("fcstValue")
                if category == "TMP" and fcst_val: # 1시간 기온
                    weather_data["temp"] = float(fcst_val)
                    weather_data["feels_like"] = round(float(fcst_val) - 1.0, 1)
                elif category == "POP" and fcst_val: # 강수확률
                    weather_data["rain_prob"] = int(fcst_val)
                    if int(fcst_val) >= 40:
                        weather_data["umbrella_needed"] = True
                        weather_data["umbrella_msg"] = f"비 예보(강수확률 {fcst_val}%)! 우산을 꼭 챙기세요 ☂️"

            set_cached_data(cache_key, weather_data, ttl_seconds=900)
            return weather_data
    except Exception as e:
        # 에러 발생 시 부드럽게 시뮬레이션 폴백
        data = get_simulated_weather(lat, lon)
        set_cached_data(cache_key, data, ttl_seconds=300)
        return data
