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

def sky_to_icon(sky_code: int, pty_code: int = 0, is_night: bool = False):
    if pty_code in [1, 5]:
        return "🌧️", "비"
    elif pty_code in [2, 6]:
        return "🌨️", "비/눈"
    elif pty_code in [3, 7]:
        return "❄️", "눈"
    elif sky_code == 1:
        return "🌙" if is_night else "☀️", "맑음"
    elif sky_code == 3:
        return "☁️" if is_night else "⛅", "구름많음"
    elif sky_code == 4:
        return "☁️", "흐림"
    return "☀️", "맑음"

async def get_weather_data(lat: float, lon: float):
    cache_key = f"weather_real_v3_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    now = datetime.now(KST)
    grid_x, grid_y = wgs84_to_kma_grid(lat, lon)

    weather_data = get_simulated_weather(lat, lon)

    # 1시간별, 3시간별, 주간 예보 기본 구조 준비
    hourly_forecast = []
    three_hourly_forecast = []
    weekly_forecast = []

    if not DATA_GO_KR_API_KEY:
        # 시뮬레이션 기반 타임라인 생성
        weather_data["hourly"] = [
            {"time": f"{(now.hour + i) % 24}시", "temp": round(weather_data["temp"] - (i * 0.3), 1), "icon": "☀️", "desc": "맑음", "pop": 10}
            for i in range(12)
        ]
        weather_data["three_hourly"] = [
            {"day": "오늘", "time": "18시", "temp": 2.5, "icon": "☀️", "desc": "맑음", "pop": 10},
            {"day": "오늘", "time": "21시", "temp": 1.0, "icon": "🌙", "desc": "맑음", "pop": 0},
            {"day": "내일", "time": "09시", "temp": 4.0, "icon": "⛅", "desc": "구름조금", "pop": 20},
            {"day": "내일", "time": "15시", "temp": 12.0, "icon": "☀️", "desc": "맑음", "pop": 10},
        ]
        set_cached_data(cache_key, weather_data, ttl_seconds=900)
        return weather_data

    try:
        # 1. 기상청 초단기실황 (getUltraSrtNcst)
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

        # 2. 기상청 단기예보 (getVilageFcst) -> 1시간별/3시간별/주간 예보 파싱
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
            "numOfRows": "250",
            "dataType": "JSON",
            "base_date": base_date,
            "base_time": base_time,
            "nx": str(grid_x),
            "ny": str(grid_y)
        }
        fcst_req = urllib.request.Request(f"{fcst_url}?{urllib.parse.urlencode(fcst_params)}")
        with urllib.request.urlopen(fcst_req, timeout=5) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            items = res.get("response", {}).get("body", {}).get("items", {}).get("item", [])

            # 날짜/시간별 그룹화
            slot_map = {}
            for it in items:
                dt_key = f"{it['fcstDate']}_{it['fcstTime']}"
                if dt_key not in slot_map:
                    slot_map[dt_key] = {"date": it['fcstDate'], "time": it['fcstTime']}
                cat = it.get("category")
                val = it.get("fcstValue")
                if cat in ["TMP", "POP", "SKY", "PTY", "TMX", "TMN"]:
                    slot_map[dt_key][cat] = val

            sorted_keys = sorted(slot_map.keys())

            # 1시간별 예보 (향후 16시간)
            current_prefix = now.strftime("%Y%m%d_%H00")
            for k in sorted_keys:
                if k >= current_prefix and len(hourly_forecast) < 16:
                    s = slot_map[k]
                    h_int = int(s["time"][:2])
                    is_night = (h_int >= 19 or h_int < 7)
                    sky_int = int(s.get("SKY", 1))
                    pty_int = int(s.get("PTY", 0))
                    icon, desc = sky_to_icon(sky_int, pty_int, is_night)
                    pop = int(s.get("POP", 0))

                    hourly_forecast.append({
                        "date_str": f"{s['date'][4:6]}.{s['date'][6:]}",
                        "time": f"{h_int}시",
                        "temp": round(float(s.get("TMP", weather_data["temp"])), 1),
                        "icon": icon,
                        "desc": desc,
                        "pop": pop
                    })

            # 3시간별 예보 (향후 3일간 3시간 단위)
            for k in sorted_keys:
                s = slot_map[k]
                h_int = int(s["time"][:2])
                if h_int in [3, 6, 9, 12, 15, 18, 21] and len(three_hourly_forecast) < 16:
                    fcst_dt = datetime.strptime(s["date"], "%Y%m%d")
                    day_diff = (fcst_dt.date() - now.date()).days
                    day_label = "오늘" if day_diff == 0 else ("내일" if day_diff == 1 else ("모레" if day_diff == 2 else f"{fcst_dt.month}월{fcst_dt.day}일"))
                    is_night = (h_int >= 19 or h_int < 7)
                    sky_int = int(s.get("SKY", 1))
                    pty_int = int(s.get("PTY", 0))
                    icon, desc = sky_to_icon(sky_int, pty_int, is_night)

                    three_hourly_forecast.append({
                        "day": day_label,
                        "time": f"{h_int:02d}:00",
                        "temp": round(float(s.get("TMP", weather_data["temp"])), 1),
                        "icon": icon,
                        "desc": desc,
                        "pop": int(s.get("POP", 0))
                    })

            # 주간 예보 (오늘부터 7일간)
            days_korean = ["월", "화", "수", "목", "금", "토", "일"]
            for d in range(7):
                target_d = now + timedelta(days=d)
                d_str = target_d.strftime("%Y%m%d")
                day_name = days_korean[target_d.weekday()]

                # 해당 일자의 최저/최고 기온 및 대표 날씨 산출
                temps = [float(slot_map[k]["TMP"]) for k in slot_map if k.startswith(d_str) and "TMP" in slot_map[k]]
                pops = [int(slot_map[k]["POP"]) for k in slot_map if k.startswith(d_str) and "POP" in slot_map[k]]

                t_min = min(temps) if temps else round(weather_data.get("temp_min", 2.0) + (d * 0.5) - 2.0, 1)
                t_max = max(temps) if temps else round(weather_data.get("temp_max", 12.0) - (d * 0.3) + 1.0, 1)
                max_pop = max(pops) if pops else (30 if d % 3 == 0 else 10)

                icon = "🌧️" if max_pop >= 60 else ("⛅" if max_pop >= 30 else "☀️")
                desc = "비" if max_pop >= 60 else ("구름많음" if max_pop >= 30 else "맑음")

                weekly_forecast.append({
                    "date": f"{target_d.month}.{target_d.day}",
                    "day_name": day_name,
                    "is_today": d == 0,
                    "is_weekend": target_d.weekday() >= 5,
                    "temp_min": round(t_min, 1),
                    "temp_max": round(t_max, 1),
                    "icon": icon,
                    "desc": desc,
                    "rain_prob": max_pop
                })

        # 3. 에어코리아 대기오염정보
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

        curr_temp = weather_data.get("temp", 18.0)
        advice, icon = get_outfit_advice(curr_temp)
        weather_data["outfit_recommendation"] = advice
        weather_data["outfit_icon"] = icon

        weather_data["hourly"] = hourly_forecast
        weather_data["three_hourly"] = three_hourly_forecast
        weather_data["weekly"] = weekly_forecast

        set_cached_data(cache_key, weather_data, ttl_seconds=900)
        return weather_data

    except Exception as e:
        fallback = get_simulated_weather(lat, lon)
        fallback["hourly"] = hourly_forecast or [
            {"time": f"{(now.hour + i) % 24}시", "temp": 2.5, "icon": "☀️", "desc": "맑음", "pop": 10} for i in range(8)
        ]
        fallback["three_hourly"] = three_hourly_forecast
        fallback["weekly"] = weekly_forecast
        set_cached_data(cache_key, fallback, ttl_seconds=300)
        return fallback
