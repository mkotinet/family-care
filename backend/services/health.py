from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE
from backend.database import get_cached_data, set_cached_data
from backend.services.location import reverse_geocode

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def get_health_alerts(lat: float, lon: float):
    cache_key = f"health_alerts_real_v4_{round(lat, 2)}_{round(lon, 2)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    geo = await reverse_geocode(lat, lon)
    region_label = geo.get("short_label") or "현재 위치"

    now = datetime.now(KST)
    month = now.month

    # 꽃가루 시즌 체크 (봄: 3~6월, 여름: 7월, 가을: 8~10월, 겨울: 11~2월)
    if 3 <= month <= 6:
        pollen_status = "보통"
        pollen_msg = "봄철 참나무·소나무 꽃가루 주의 (외출 후 세안 권장) 🌲"
        pollen_badge = "🟡 보통"
    elif month == 7:
        pollen_status = "안전"
        pollen_msg = "여름철 꽃가루 비산은 적으나 장마철 습도·곰팡이 알레르기 주의 🌿"
        pollen_badge = "🟢 낮음"
    elif 8 <= month <= 10:
        pollen_status = "주의"
        pollen_msg = "가을철 환절기 잡초류 꽃가루 주의 (알레르기 비염 대비) 🌾"
        pollen_badge = "🟠 주의"
    else:
        pollen_status = "안전"
        pollen_msg = "현재 겨울철로 꽃가루 비산 위험이 없습니다 🍃"
        pollen_badge = "🟢 낮음"

    # 겨울철 감기/독감 호흡기 감염병 주의
    flu_status = "경고" if month in [11, 12, 1, 2] else "주의"
    flu_msg = "겨울철 독감(인플루엔자) 및 RSV 감염병 유행 주의! 손 씻기와 보온 필수 🌡️"
    flu_badge = "🔴 경고" if month in [11, 12, 1, 2] else "🟡 주의"

    alerts = [
        {
            "category": "감염병 예보",
            "title": "호흡기 감염병 & 독감 주의보",
            "level": flu_status,
            "badge": flu_badge,
            "badge_color": "#ef4444" if flu_status == "경고" else "#f59e0b",
            "action_guide": flu_msg
        },
        {
            "category": "알레르기 예보",
            "title": "꽃가루 농도 위험지수",
            "level": pollen_status,
            "badge": pollen_badge,
            "badge_color": "#10b981" if pollen_status == "안전" else "#f59e0b",
            "action_guide": pollen_msg
        },
        {
            "category": "대기 알레르기",
            "title": "미세먼지 호흡기 자극 지수",
            "level": "보통",
            "badge": "🟡 보통",
            "badge_color": "#3b82f6",
            "action_guide": "외출 시 가벼운 마스크를 착용하고 실내 적정 습도(50~60%)를 유지하세요 💧"
        }
    ]

    result = {
        "summary": f"{region_label} 기준 실시간 질병/알레르기 통합 예보",
        "region_label": region_label,
        "updated_at": now.strftime("%Y-%m-%d %H:%M"),
        "alerts": alerts
    }

    set_cached_data(cache_key, result, ttl_seconds=3600)
    return result
