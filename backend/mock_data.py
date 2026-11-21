from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE

KST = zoneinfo.ZoneInfo(TIMEZONE)

def get_simulated_weather(lat: float, lon: float):
    now = datetime.now(KST)
    hour = now.hour
    month = now.month

    # 계절/시간대 기반 자연스러운 기온 시뮬레이션
    if month in [11, 12, 1, 2]:
        base_temp = 8.5
        min_temp = 1.0
        max_temp = 13.5
    elif month in [3, 4, 5]:
        base_temp = 16.0
        min_temp = 9.0
        max_temp = 22.0
    elif month in [6, 7, 8]:
        base_temp = 27.0
        min_temp = 22.0
        max_temp = 32.0
    else:
        base_temp = 20.0
        min_temp = 14.0
        max_temp = 25.0

    # 낮 시간(12~15시) 최고, 새벽(04~06시) 최저
    temp_offset = (math_sin_hour(hour) * 4.0)
    current_temp = round(base_temp + temp_offset, 1)

    # 강수 확률 및 날씨 상태
    pop = 20 # 20%
    weather_state = "맑음"
    weather_icon = "☀️"
    umbrella_needed = False
    umbrella_msg = "우산 불필요 (비 올 확률 낮음)"

    if pop >= 40:
        umbrella_needed = True
        umbrella_msg = "우산을 꼭 챙기세요! (비 예보)"

    # 옷차림 추천 알고리즘
    if current_temp >= 28:
        outfit = "민소매, 반팔, 반바지, 린넨 소재의 시원한 옷이 좋아요."
        outfit_icon = "🩳"
    elif 23 <= current_temp < 28:
        outfit = "반팔 티셔츠, 얇은 셔츠, 면바지가 적당해요."
        outfit_icon = "👕"
    elif 20 <= current_temp < 23:
        outfit = "긴팔 티, 가벼운 가디건, 얇은 후드티를 입기 좋아요."
        outfit_icon = "🧥"
    elif 17 <= current_temp < 20:
        outfit = "니트, 가디건, 맨투맨, 청바지를 챙기세요."
        outfit_icon = "🧣"
    elif 12 <= current_temp < 17:
        outfit = "자켓, 야상, 도톰한 가디건, 니트로 보온에 신경 쓰세요."
        outfit_icon = "🧥"
    elif 9 <= current_temp < 12:
        outfit = "트렌치코트, 야상, 레이어드 옷차림이 필요해요."
        outfit_icon = "🧥"
    else:
        outfit = "패딩, 도톰한 코트, 목도리 등 따뜻하게 무장하세요."
        outfit_icon = "🧤"

    return {
        "location": "남양주시 평내동 (평내유진마젤란)",
        "temp": current_temp,
        "temp_min": min_temp,
        "temp_max": max_temp,
        "feels_like": round(current_temp - 0.8, 1),
        "humidity": 55,
        "rain_prob": pop,
        "weather_state": weather_state,
        "weather_icon": weather_icon,
        "umbrella_needed": umbrella_needed,
        "umbrella_msg": umbrella_msg,
        "outfit_recommendation": outfit,
        "outfit_icon": outfit_icon,
        "air_quality": {
            "pm10": 28,
            "pm10_grade": "좋음",
            "pm10_color": "#10b981",
            "pm25": 14,
            "pm25_grade": "좋음",
            "pm25_color": "#10b981",
            "station_name": "평내동 측정소"
        },
        "updated_at": now.strftime("%H:%M KST")
    }

def math_sin_hour(hour):
    import math
    return math.sin((hour - 8) * math.pi / 12)

def get_simulated_transit():
    now = datetime.now(KST)
    minute_seed = now.minute

    # 남양주 평내동 실제 노선 (M2323, 165, 93) 실시간 도착 시뮬레이션
    bus1_remain = (minute_seed % 7) + 2
    bus2_remain = ((minute_seed + 3) % 9) + 1
    bus3_remain = ((minute_seed + 5) % 12) + 4

    return [
        {
            "id": 1,
            "title": "출근길 (잠실 직행)",
            "route_no": "M2323",
            "station_name": "평내유진아파트 (정류장)",
            "destination": "잠실광역환승센터",
            "transit_type": "BUS",
            "remain_time": f"{bus1_remain}분 {now.second % 40 + 10}초",
            "remain_stops": f"{max(1, bus1_remain // 2)}정거장 전",
            "crowded_level": "보통 (빈자리 18석)",
            "badge_color": "#3b82f6"
        },
        {
            "id": 2,
            "title": "평내호평역 환승",
            "route_no": "165",
            "station_name": "평내유진아파트 (정류장)",
            "destination": "평내호평역·청량리",
            "transit_type": "BUS",
            "remain_time": f"{bus2_remain}분 뒤 도착",
            "remain_stops": f"{max(1, bus2_remain // 2)}정거장 전",
            "crowded_level": "여유",
            "badge_color": "#10b981"
        },
        {
            "id": 3,
            "title": "등교/학원 루트",
            "route_no": "93",
            "station_name": "평내유진아파트 (정류장)",
            "destination": "호평동·평내중학교",
            "transit_type": "BUS",
            "remain_time": f"{bus3_remain}분 뒤 도착",
            "remain_stops": f"{max(1, bus3_remain // 2)}정거장 전",
            "crowded_level": "여유",
            "badge_color": "#8b5cf6"
        },
        {
            "id": 4,
            "title": "경춘선 전철",
            "route_no": "경춘선",
            "station_name": "평내호평역 (상행)",
            "destination": "상봉·청량리 방면",
            "transit_type": "SUBWAY",
            "remain_time": "6분 뒤 도착 (금곡역 진입)",
            "remain_stops": "1역 전",
            "crowded_level": "보통",
            "badge_color": "#06b6d4"
        }
    ]

def get_simulated_hospitals():
    now = datetime.now(KST)
    weekday = now.weekday() # 0:월, ... 5:토, 6:일
    is_weekend = weekday >= 5

    return {
        "summary": "남양주시 평내·호평 지역 실시간 의료기관",
        "is_weekend": is_weekend,
        "items": [
            {
                "id": "h_p_01",
                "name": "평내약국",
                "type": "약국",
                "phone": "031-594-3002",
                "address": "경기도 남양주시 평내로29번길 49, 108호 (엠투프라자)",
                "distance": "우리 집에서 430m (도보 6분)",
                "status": "영업중",
                "today_hours": "09:00 ~ 22:00 (주말 정상영업)",
                "weekend_info": "토 09:00~22:00 / 일 10:00~21:00",
                "is_holiday_duty": True,
                "is_open_now": True,
                "badge": "일요·심야약국",
                "badge_color": "#10b981",
                "status_badge": "🟢 영업중 (22:00 마감)",
                "lat": 37.643750,
                "lon": 127.234100,
                "latitude": 37.643750,
                "longitude": 127.234100
            },
            {
                "id": "h_p_02",
                "name": "평내 유진온누리약국",
                "type": "약국",
                "phone": "031-592-7582",
                "address": "남양주시 평내로 89 상가 1층",
                "distance": "도보 2분 (120m)",
                "status": "영업중",
                "today_hours": "08:30 ~ 21:00 (토/일 주말 정상운영)",
                "weekend_info": "토 08:30~21:00 / 일 09:00~19:00",
                "is_holiday_duty": True,
                "is_open_now": True,
                "badge": "당번약국",
                "badge_color": "#10b981",
                "status_badge": "🟢 영업중 (21:00 마감)",
                "lat": 37.642550,
                "lon": 127.235100,
                "latitude": 37.642550,
                "longitude": 127.235100
            },
            {
                "id": "h_p_03",
                "name": "호평 아산소아청소년과의원",
                "type": "소아과/내과",
                "phone": "031-591-8275",
                "address": "남양주시 늘을2로 14 (호평동)",
                "distance": "차량 4분 (950m)",
                "status": "진료중",
                "today_hours": "09:00 ~ 20:00 (주말 16:00까지)",
                "weekend_info": "토 09:00~16:00 / 일 09:00~13:00",
                "is_holiday_duty": True,
                "is_open_now": True,
                "badge": "달빛어린이병원",
                "badge_color": "#06b6d4",
                "status_badge": "🟢 진료중 (20:00 마감)",
                "lat": 37.654200,
                "lon": 127.243500,
                "latitude": 37.654200,
                "longitude": 127.243500
            },
            {
                "id": "h_p_04",
                "name": "남양주백병원 응급실",
                "type": "종합병원 응급의료",
                "phone": "031-590-3000",
                "address": "남양주시 진접읍 금강로 1511",
                "distance": "차량 15분",
                "status": "24시간 운영",
                "today_hours": "365일 24시간 응급진료",
                "weekend_info": "365일 24시간 연중무휴",
                "is_holiday_duty": True,
                "is_open_now": True,
                "badge": "응급의료센터",
                "badge_color": "#ef4444",
                "status_badge": "🟢 24시간 진료",
                "lat": 37.712500,
                "lon": 127.189500,
                "latitude": 37.712500,
                "longitude": 127.189500
            },
            {
                "id": "h_p_05",
                "name": "평내 바른정형외과의원",
                "type": "정형외과/통증의학과",
                "phone": "031-595-3375",
                "address": "남양주시 경춘로 1256번길 6",
                "distance": "도보 8분 (600m)",
                "status": "진료중",
                "today_hours": "09:00 ~ 18:30 (토 13:30까지, 일 휴진)",
                "weekend_info": "토 09:00~13:30 / 일 휴진",
                "is_holiday_duty": False,
                "is_open_now": not is_weekend or weekday == 5,
                "badge": "일반의원",
                "badge_color": "#64748b",
                "status_badge": "🟢 진료중" if (not is_weekend or weekday == 5) else "⚪ 오늘 휴진",
                "lat": 37.644100,
                "lon": 127.231500,
                "latitude": 37.644100,
                "longitude": 127.231500
            }
        ]
    }

def get_simulated_health_alerts():
    return {
        "region": "경기도 남양주시",
        "alerts": [
            {
                "disease": "꽃가루 알레르기 지수",
                "level": "보통",
                "level_code": 2,
                "color": "#10b981",
                "tip": "외출 시 가벼운 마스크 착용, 외출 후 손 씻기와 세안을 철저히 하세요."
            },
            {
                "disease": "감기/독감 위험도",
                "level": "주의",
                "level_code": 3,
                "color": "#f59e0b",
                "tip": "일교차가 10도 이상 벌어지니 체온 유지에 유의하고 비타민C를 섭취하세요."
            },
            {
                "disease": "식중독 지수",
                "level": "관심 (안전)",
                "level_code": 1,
                "color": "#3b82f6",
                "tip": "조리 음식은 2시간 이내 섭취하고 상온 보관을 피하세요."
            }
        ]
    }

def get_simulated_culture():
    return {
        "region": "남양주시 및 인근 경기 동북부",
        "festivals": [
            {
                "title": "남양주 다산 정약용 문화제",
                "period": "이번 주말 진행 중",
                "location": "남양주시 조안면 다산유적지",
                "distance": "차량 20분",
                "category": "지역축제/역사체험",
                "crowd_status": "보통 🟡",
                "crowd_score": 52,
                "recommendation": "가족 단위 나들이 추천 (주차장 여유 있음)"
            },
            {
                "title": "물의정원 가을 꽃단지 피크닉",
                "period": "상시 개방",
                "location": "남양주시 조안면 북한강로",
                "distance": "차량 22분",
                "category": "자연/피크닉",
                "crowd_status": "붐빔 🔴",
                "crowd_score": 78,
                "recommendation": "오후 2시 이후 주차 혼잡 예상, 오전 방문 추천"
            },
            {
                "title": "호평 늘을중앙공원 플리마켓",
                "period": "토요일 11:00 ~ 17:00",
                "location": "남양주시 호평동 늘을공원",
                "distance": "도보 15분",
                "category": "동네마켓/체험",
                "crowd_status": "여유 🟢",
                "crowd_score": 35,
                "recommendation": "아이들과 가볍게 산책하기 좋아요"
            }
        ]
    }
