import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, TIMEZONE
from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_hospitals

KST = zoneinfo.ZoneInfo(TIMEZONE)

def format_time_str(val):
    if not val or len(val) < 4:
        return ""
    return f"{val[:2]}:{val[2:]}"

async def get_hospital_pharmacy_info(lat: float, lon: float, filter_type: str = "ALL"):
    cache_key = f"hospitals_real_{filter_type}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    if not DATA_GO_KR_API_KEY:
        base_data = get_simulated_hospitals()
        items = base_data.get("items", [])
        if filter_type == "PHARMACY":
            items = [x for x in items if x["type"] == "약국"]
        elif filter_type == "CHILDREN":
            items = [x for x in items if "소아" in x["type"] or x.get("badge") == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            items = [x for x in items if x.get("is_open_now")]
        result = {"summary": base_data["summary"], "is_weekend": base_data["is_weekend"], "filter": filter_type, "items": items}
        set_cached_data(cache_key, result, ttl_seconds=900)
        return result

    now = datetime.now(KST)
    weekday = now.weekday()  # 0:월, 1:화, 2:수, 3:목, 4:금, 5:토, 6:일
    is_weekend = weekday >= 5
    now_hm = now.strftime("%H%M")
    day_idx = weekday + 1  # E-Gen 진료시간 인덱스: 1(월)~7(일)

    items = []

    try:
        # 1. 약국 조회 (평내동)
        pharm_url = "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire"
        p_params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "Q0": "경기도",
            "Q1": "남양주시",
            "QN": "평내",
            "pageNo": "1",
            "numOfRows": "10"
        }
        p_req = urllib.request.Request(f"{pharm_url}?{urllib.parse.urlencode(p_params)}")
        with urllib.request.urlopen(p_req, timeout=5) as resp:
            root = ET.fromstring(resp.read())
            for it in root.findall(".//item"):
                name = it.findtext("dutyName")
                addr = it.findtext("dutyAddr")
                tel = it.findtext("dutyTel1") or "전화번호 없음"

                today_s = it.findtext(f"dutyTime{day_idx}s")
                today_c = it.findtext(f"dutyTime{day_idx}c")
                sat_s = it.findtext("dutyTime6s")
                sat_c = it.findtext("dutyTime6c")
                sun_s = it.findtext("dutyTime7s")
                sun_c = it.findtext("dutyTime7c")

                has_today = bool(today_s and today_c)
                is_open_now = False
                if has_today:
                    is_open_now = (today_s <= now_hm <= today_c)

                # 주말 운영 안내 문구
                weekend_txt = []
                if sat_s and sat_c:
                    weekend_txt.append(f"토 {format_time_str(sat_s)}~{format_time_str(sat_c)}")
                if sun_s and sun_c:
                    weekend_txt.append(f"일 {format_time_str(sun_s)}~{format_time_str(sun_c)}")
                weekend_info = " / ".join(weekend_txt) if weekend_txt else "주말 휴무"

                badge = "일요·심야약국" if (sun_s and sun_c) else ("토요영업" if (sat_s and sat_c) else "평일영업")
                status_badge = f"🟢 영업중 ({format_time_str(today_c)} 마감)" if is_open_now else ("🔴 영업종료" if has_today else "⚪ 오늘 휴무")

                items.append({
                    "id": f"p_{it.findtext('hpid') or name}",
                    "name": name,
                    "type": "약국",
                    "badge": badge,
                    "badge_color": "#10b981" if (sun_s and sun_c) else "#64748b",
                    "address": addr,
                    "phone": tel,
                    "distance": "평내동 중심부 (도보 5~10분)",
                    "today_hours": f"{format_time_str(today_s)} ~ {format_time_str(today_c)}" if has_today else "오늘 휴무",
                    "weekend_info": weekend_info,
                    "is_open_now": is_open_now,
                    "status_badge": status_badge,
                    "is_weekend_open": bool(sat_s or sun_s)
                })

        # 2. 소아과 및 병의원 조회 (평내/호평 인근)
        hosp_url = "https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire"
        h_params = {
            "serviceKey": DATA_GO_KR_API_KEY,
            "Q0": "경기도",
            "Q1": "남양주시",
            "QN": "소아",
            "pageNo": "1",
            "numOfRows": "10"
        }
        h_req = urllib.request.Request(f"{hosp_url}?{urllib.parse.urlencode(h_params)}")
        with urllib.request.urlopen(h_req, timeout=5) as resp:
            root = ET.fromstring(resp.read())
            for it in root.findall(".//item"):
                name = it.findtext("dutyName")
                addr = it.findtext("dutyAddr")
                tel = it.findtext("dutyTel1") or "전화번호 없음"
                div = it.findtext("dutyDivNam") or "의원"

                today_s = it.findtext(f"dutyTime{day_idx}s")
                today_c = it.findtext(f"dutyTime{day_idx}c")
                sat_s = it.findtext("dutyTime6s")
                sat_c = it.findtext("dutyTime6c")
                sun_s = it.findtext("dutyTime7s")
                sun_c = it.findtext("dutyTime7c")

                has_today = bool(today_s and today_c)
                is_open_now = False
                if has_today:
                    is_open_now = (today_s <= now_hm <= today_c)

                weekend_txt = []
                if sat_s and sat_c:
                    weekend_txt.append(f"토 {format_time_str(sat_s)}~{format_time_str(sat_c)}")
                if sun_s and sun_c:
                    weekend_txt.append(f"일 {format_time_str(sun_s)}~{format_time_str(sun_c)}")
                weekend_info = " / ".join(weekend_txt) if weekend_txt else "주말 휴진"

                badge = "달빛어린이병원" if ("달빛" in name or (sun_s and int(sun_c or 0) >= 1800)) else "소아청소년과"
                status_badge = f"🟢 진료중 ({format_time_str(today_c)} 마감)" if is_open_now else ("🔴 진료종료" if has_today else "⚪ 오늘 휴진")

                items.append({
                    "id": f"h_{it.findtext('hpid') or name}",
                    "name": name,
                    "type": "소아과/병원",
                    "badge": badge,
                    "badge_color": "#ec4899" if badge == "달빛어린이병원" else "#3b82f6",
                    "address": addr,
                    "phone": tel,
                    "distance": "남양주시 관내 (차량 5~15분)",
                    "today_hours": f"{format_time_str(today_s)} ~ {format_time_str(today_c)}" if has_today else "오늘 휴진",
                    "weekend_info": weekend_info,
                    "is_open_now": is_open_now,
                    "status_badge": status_badge,
                    "is_weekend_open": bool(sat_s or sun_s)
                })

        # 필터링 적용
        filtered_items = items
        if filter_type == "PHARMACY":
            filtered_items = [x for x in items if x["type"] == "약국"]
        elif filter_type == "CHILDREN":
            filtered_items = [x for x in items if "소아" in x["type"] or x["badge"] == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            filtered_items = [x for x in items if x["is_open_now"]]

        result = {
            "summary": "평내유진마젤란 인근 실시간 병원·약국 현황 (국립중앙의료원 공공데이터 연동)",
            "is_weekend": is_weekend,
            "filter": filter_type,
            "items": filtered_items
        }

        set_cached_data(cache_key, result, ttl_seconds=1800)
        return result

    except Exception as e:
        base_data = get_simulated_hospitals()
        return {
            "summary": base_data["summary"],
            "is_weekend": is_weekend,
            "filter": filter_type,
            "items": base_data.get("items", [])
        }
