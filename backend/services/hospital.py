import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, TIMEZONE
from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_hospitals

KST = zoneinfo.ZoneInfo(TIMEZONE)

# 평내·호평 주요 병의원 및 약국 실측 좌표 데이터베이스
HOSPITAL_COORDINATES = {
    "평내약국": (37.643750, 127.234100),
    "평내유진온누리약국": (37.642550, 127.235100),
    "유진온누리약국": (37.642550, 127.235100),
    "평내메디칼약국": (37.641600, 127.231200),
    "평내사랑약국": (37.641300, 127.229500),
    "바른약국": (37.644100, 127.231500),
    "평내바른약국": (37.644100, 127.231500),
    "메디팜평내약국": (37.642100, 127.232500),
    "호평이마트약국": (37.653800, 127.244200),
    "호평종로약국": (37.653500, 127.243000),
    "온누리늘푸른약국": (37.654500, 127.242800),
    "호평 아산소아청소년과의원": (37.654200, 127.243500),
    "아산소아청소년과의원": (37.654200, 127.243500),
    "남양주백병원": (37.712500, 127.189500),
    "남양주백병원 응급실": (37.712500, 127.189500),
    "평내 바른정형외과의원": (37.644100, 127.231500),
    "바른정형외과의원": (37.644100, 127.231500),
    "평내연세소아청소년과의원": (37.643900, 127.233500),
    "연세소아청소년과의원": (37.643900, 127.233500),
    "평내서울이비인후과": (37.643800, 127.233900)
}

def resolve_hospital_coords(name: str, addr: str = "", xml_lat: str = None, xml_lon: str = None, item_index: int = 0):
    try:
        if xml_lat and xml_lon:
            x_lat = float(xml_lat)
            x_lon = float(xml_lon)
            if 37.0 < x_lat < 38.5 and 126.5 < x_lon < 127.8:
                return x_lat, x_lon
    except Exception:
        pass

    clean_name = (name or "").replace(" ", "")
    for k, coords in HOSPITAL_COORDINATES.items():
        if k.replace(" ", "") in clean_name or clean_name in k.replace(" ", ""):
            return coords[0], coords[1]

    # 기본 평내동 중심부 주변 고유 분산 오프셋
    base_lat = 37.643750
    base_lon = 127.234100
    offsets = [
        (0.0000, 0.0000), (0.0008, 0.0012), (-0.0009, -0.0015), (0.0014, -0.0010),
        (-0.0012, 0.0018), (0.0020, 0.0005), (-0.0018, -0.0008), (0.0005, -0.0022)
    ]
    off = offsets[item_index % len(offsets)]
    return round(base_lat + off[0], 6), round(base_lon + off[1], 6)

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

                p_lat, p_lon = resolve_hospital_coords(name, addr, it.findtext("wgs84Lat"), it.findtext("wgs84Lon"), len(items))

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
                    "is_weekend_open": bool(sat_s or sun_s),
                    "lat": p_lat,
                    "lon": p_lon,
                    "latitude": p_lat,
                    "longitude": p_lon
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

                h_lat, h_lon = resolve_hospital_coords(name, addr, it.findtext("wgs84Lat"), it.findtext("wgs84Lon"), len(items))

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
                    "is_weekend_open": bool(sat_s or sun_s),
                    "lat": h_lat,
                    "lon": h_lon,
                    "latitude": h_lat,
                    "longitude": h_lon
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
        b_items = base_data.get("items", [])
        if filter_type == "PHARMACY":
            b_items = [x for x in b_items if x.get("type") == "약국"]
        elif filter_type == "CHILDREN":
            b_items = [x for x in b_items if "소아" in x.get("type", "") or x.get("badge") == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            b_items = [x for x in b_items if x.get("is_open_now")]
        return {
            "summary": base_data["summary"],
            "is_weekend": is_weekend,
            "filter": filter_type,
            "items": b_items
        }
