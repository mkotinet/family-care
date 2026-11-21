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

def get_outfit_advice(temp: float):
    if temp >= 28:
        return "민소매, 반팔, 린넨 바지 등 얇고 통풍이 잘되는 옷을 입으세요 🎽", "👕"
    elif temp >= 23:
        return "반팔, 얇은 셔츠, 반바지 또는 면바지가 적당해요 👕", "👕"
    elif temp >= 20:
        return "긴팔 티, 블라우스, 얇은 가디건, 슬랙스를 추천해요 👚", "👚"
    elif temp >= 17:
        return "가디건, 니트, 맨투맨, 청바지가 포근하고 좋아요 🧥", "🧥"
    elif temp >= 12:
        return "자켓, 셔츠 위에 가디건, 간절기 외투를 챙기세요 🧥", "🧥"
    elif temp >= 9:
        return "트렌치코트, 야상, 도톰한 점퍼로 따뜻하게 챙겨 입으세요 🧥", "🧥"
    elif temp >= 5:
        return "울 코트, 가죽 자켓, 히트텍, 기모 옷을 추천해요 🧤", "🧤"
    else:
        return "패딩, 두꺼운 코트, 목도리와 장갑 등 보온에 각별히 신경 쓰세요 🧣", "🧣"

async def get_weather_data(lat: float, lon: float):
    cache_key = f"weather_real_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    if not DATA_GO_KR_API_KEY:
        data = get_simulated_weather(lat, lon)
        set_cached_data(cache_key, data, ttl_seconds=900)
        return data

    now = datetime.now(KST)
    grid_x, grid_y = wgs84_to_kma_grid(lat, lon)

    # 기본 뼈대
    weather_data = get_simulated_weather(lat, lon)

    try:
        # 1. 기상청 초단기실황 (getUltraSrtNcst) - 현재 기온 및 강수형태
        # 매시각 30분 이후 발표, 40분 이후 안정적 수신
        ncst_date = now.strftime("%Y%m%d")
        if now.minute < 45:
            ncst_time_dt = now - timedelta(hours=1)
            ncst_date = ncst_time_dt.strftime("%Y%m%d")
            ncst_time = ncst_time_dt.strftime("%H00")
        else:
            ncst_time = now.strftime("%H00")

        ncst_url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst"
        ncst_params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "pageNo": "1",
            "numOfRows": "20",
            "dataType": "JSON",
            "base_date": ncst_date,
            "base_time": ncst_time,
            "nx": str(grid_x),
            "ny": str(grid_y)
        }
        ncst_req = urllib.request.Request(f"{ncst_url}?{urllib.parse.urlencode(ncst_params)}")
        with urllib.request.urlopen(ncst_req, timeout=4) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            items = res.get("response", {}).get("body", {}).get("items", {}).get("item", [])
            pty_val = 0
            for it in items:
                cat = it.get("category")
                val = it.get("obsrValue")
                if cat == "T1H" and val:
                    weather_data["temp"] = round(float(val), 1)
                    weather_data["feels_like"] = round(float(val) - 0.7, 1)
                elif cat == "REH" and val:
                    weather_data["humidity"] = int(float(val))
                elif cat == "PTY" and val:
                    pty_val = int(val)

            # 강수형태: 0:없음, 1:비, 2:비/눈, 3:눈, 5:빗방울, 6:빗방울눈날림, 7:눈날림
            if pty_val in [1, 5]:
                weather_data["weather_desc"] = "비"
                weather_data["weather_icon"] = "🌧️"
                weather_data["umbrella_needed"] = True
                weather_data["umbrella_msg"] = "현재 비가 내리고 있어요! 우산을 꼭 챙기세요 ☂️"
            elif pty_val in [2, 3, 6, 7]:
                weather_data["weather_desc"] = "눈"
                weather_data["weather_icon"] = "❄️"
                weather_data["umbrella_needed"] = True
                weather_data["umbrella_msg"] = "현재 눈이 내리고 있어요! 우산을 꼭 챙기세요 ☂️"

        # 2. 기상청 단기예보 (getVilageFcst) - 강수확률 및 최고/최저기온
        base_date = now.strftime("%Y%m%d")
        base_time = "0500"
        for t in ["2300", "2000", "1700", "1400", "1100", "0800", "0500", "0200"]:
            if now.hour >= int(t[:2]):
                base_time = t
                break
        else:
            base_date = (now - timedelta(days=1)).strftime("%Y%m%d")
            base_time = "2300"

        fcst_url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
        fcst_params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "pageNo": "1",
            "numOfRows": "60",
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": str(grid_x),
            "ny": str(grid_y)
        }
        fcst_req = urllib.request.Request(f"{fcst_url}?{urllib.parse.urlencode(fcst_params)}")
        with urllib.request.urlopen(fcst_req, timeout=4) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            items = res.get("response", {}).get("body", {}).get("items", {}).get("item", [])
            for it in items:
                cat = it.get("category")
                val = it.get("fcstValue")
                if cat == "POP" and val:
                    pop = int(val)
                    weather_data["rain_prob"] = max(weather_data.get("rain_prob", 0), pop)
                    if pop >= 40:
                        weather_data["umbrella_needed"] = True
                        weather_data["umbrella_msg"] = f"비 예보(강수확률 {pop}%)! 외출 시 우산을 챙기세요 ☂️"
                elif cat == "SKY" and val and weather_data.get("weather_desc") not in ["비", "눈"]:
                    sky = int(val)
                    if sky == 1:
                        weather_data["weather_desc"] = "맑음"
                        weather_data["weather_icon"] = "☀️"
                    elif sky == 3:
                        weather_data["weather_desc"] = "구름많음"
                        weather_data["weather_icon"] = "⛅"
                    elif sky == 4:
                        weather_data["weather_desc"] = "흐림"
                        weather_data["weather_icon"] = "☁️"
                elif cat == "TMN" and val:
                    weather_data["temp_min"] = round(float(val), 1)
                elif cat == "TMX" and val:
                    weather_data["temp_max"] = round(float(val), 1)

        # 3. 에어코리아 대기오염정보 (getCtprvnRltmMesureDnsty) - 경기 시도 미세먼지
        air_url = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty"
        air_params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "returnType": "json",
            "numOfRows": "40",
            "pageNo": "1",
            "sidoName": "경기",
            "ver": "1.0"
        }
        air_req = urllib.request.Request(f"{air_url}?{urllib.parse.urlencode(air_params)}")
        with urllib.request.urlopen(air_req, timeout=4) as resp:
            air_res = json.loads(resp.read().decode('utf-8'))
            air_items = air_res.get("response", {}).get("body", {}).get("items", [])
            # 남양주시 인근 측정소 우선 탐색 (평내, 호평, 남양주 등)
            target_station = None
            for item in air_items:
                st_name = item.get("stationName", "")
                if "남양주" in st_name or "평내" in st_name or "화도" in st_name or "진접" in st_name:
                    target_station = item
                    break
            if not target_station and air_items:
                target_station = air_items[0]

            if target_station:
                pm10 = target_station.get("pm10Value")
                pm25 = target_station.get("pm25Value")
                if pm10 and pm10 != "-":
                    weather_data["dust_pm10"] = int(pm10)
                if pm25 and pm25 != "-":
                    weather_data["dust_pm25"] = int(pm25)

                pm10_val = weather_data["dust_pm10"]
                if pm10_val <= 30:
                    weather_data["dust_status"] = "좋음"
                    weather_data["dust_badge"] = "🟢 좋음"
                elif pm10_val <= 80:
                    weather_data["dust_status"] = "보통"
                    weather_data["dust_badge"] = "🟡 보통"
                elif pm10_val <= 150:
                    weather_data["dust_status"] = "나쁨"
                    weather_data["dust_badge"] = "🟠 나쁨"
                else:
                    weather_data["dust_status"] = "매우나쁨"
                    weather_data["dust_badge"] = "🔴 매우나쁨"

        # 옷차림 조언 산출
        curr_temp = weather_data.get("temp", 18.0)
        advice, icon = get_outfit_advice(curr_temp)
        weather_data["outfit_recommendation"] = advice
        weather_data["outfit_icon"] = icon

        # 15분 캐싱
        set_cached_data(cache_key, weather_data, ttl_seconds=900)
        return weather_data

    except Exception as e:
        # 오류 시 안전하게 시뮬레이션 데이터 제공
        fallback = get_simulated_weather(lat, lon)
        set_cached_data(cache_key, fallback, ttl_seconds=300)
        return fallback
