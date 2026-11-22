import asyncio
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
import zoneinfo
from backend.config import DATA_GO_KR_API_KEY, KAKAO_REST_API_KEY, TIMEZONE
from backend.coords import haversine_distance
from backend.database import get_cached_data, set_cached_data
from backend.http_client import async_http_get_bytes, async_http_get_json
from backend.mock_data import get_simulated_hospitals
from backend.services.location import reverse_geocode

KST = zoneinfo.ZoneInfo(TIMEZONE)

def _is_open_between(now_hm: str, start_hm: str, end_hm: str) -> bool:
    """자정 넘김 심야 영업(예: 2200~0200, 0900~2500)을 포함한 정확한 영업시간 판정"""
    if not start_hm or not end_hm:
        return False
    try:
        n = int(now_hm)
        s = int(start_hm)
        e = int(end_hm)
        if e >= 2400:
            return n >= s or n <= (e - 2400)
        if e < s:
            return n >= s or n <= e
        return s <= n <= e
    except Exception:
        return start_hm <= now_hm <= end_hm

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

def _fmt_dist(dist_m: int) -> str:
    if dist_m < 1000:
        return f"{dist_m}m"
    return f"{round(dist_m / 1000, 1)}km"

def _norm_name(name: str) -> str:
    return (name or "").replace(" ", "").replace("(", "").replace(")", "").strip().lower()

def _parse_egen_xml(raw_bytes, day_idx: int, now_hm: str, is_pharmacy: bool) -> list:
    if not isinstance(raw_bytes, (bytes, bytearray)):
        return []
    parsed = []
    try:
        root = ET.fromstring(raw_bytes)
        for it in root.findall(".//item"):
            name = (it.findtext("dutyName") or "").strip()
            if not name:
                continue
            addr = (it.findtext("dutyAddr") or "").strip()
            tel = (it.findtext("dutyTel1") or "").strip()
            today_s = it.findtext(f"dutyTime{day_idx}s")
            today_c = it.findtext(f"dutyTime{day_idx}c")
            sat_s = it.findtext("dutyTime6s")
            sat_c = it.findtext("dutyTime6c")
            sun_s = it.findtext("dutyTime7s")
            sun_c = it.findtext("dutyTime7c")

            has_today = bool(today_s and today_c)
            is_open_now = _is_open_between(now_hm, today_s, today_c) if has_today else False

            weekend_txt = []
            if sat_s and sat_c:
                weekend_txt.append(f"토 {format_time_str(sat_s)}~{format_time_str(sat_c)}")
            if sun_s and sun_c:
                weekend_txt.append(f"일 {format_time_str(sun_s)}~{format_time_str(sun_c)}")
            weekend_info = " / ".join(weekend_txt) if weekend_txt else ("주말 휴무" if is_pharmacy else "주말 휴진")

            if is_pharmacy:
                badge = "일요·심야약국" if (sun_s and sun_c) else ("토요영업" if (sat_s and sat_c) else "평일영업")
                badge_color = "#10b981" if (sun_s and sun_c) else "#64748b"
                status_badge = f"🟢 영업중 ({format_time_str(today_c)} 마감)" if is_open_now else ("🔴 영업종료" if has_today else "⚪ 오늘 휴무")
                today_hours = f"{format_time_str(today_s)} ~ {format_time_str(today_c)}" if has_today else "오늘 휴무"
            else:
                badge = "달빛어린이병원" if ("달빛" in name or (sun_s and int(sun_c or 0) >= 1800)) else "소아청소년과"
                badge_color = "#ec4899" if badge == "달빛어린이병원" else "#3b82f6"
                status_badge = f"🟢 진료중 ({format_time_str(today_c)} 마감)" if is_open_now else ("🔴 진료종료" if has_today else "⚪ 오늘 휴진")
                today_hours = f"{format_time_str(today_s)} ~ {format_time_str(today_c)}" if has_today else "오늘 휴진"

            x_lat, x_lon = None, None
            try:
                lat_txt = it.findtext("wgs84Lat")
                lon_txt = it.findtext("wgs84Lon")
                if lat_txt and lon_txt:
                    fv_lat, fv_lon = float(lat_txt), float(lon_txt)
                    if 33.0 <= fv_lat <= 39.0 and 124.0 <= fv_lon <= 132.0:
                        x_lat, x_lon = fv_lat, fv_lon
            except Exception:
                pass

            parsed.append({
                "id": f"{'p' if is_pharmacy else 'h'}_{it.findtext('hpid') or name}",
                "name": name,
                "norm_name": _norm_name(name),
                "type": "약국" if is_pharmacy else "소아과/병원",
                "badge": badge,
                "badge_color": badge_color,
                "address": addr,
                "phone": tel,
                "today_hours": today_hours,
                "weekend_info": weekend_info,
                "is_open_now": is_open_now,
                "status_badge": status_badge,
                "is_weekend_open": bool(sat_s or sun_s),
                "lat": x_lat,
                "lon": x_lon,
            })
    except Exception:
        pass
    return parsed

async def get_hospital_pharmacy_info(lat: float, lon: float, filter_type: str = "ALL"):
    cache_key = f"hospitals_real_v3_{filter_type}_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    now = datetime.now(KST)
    weekday = now.weekday()  # 0:월 ~ 6:일
    is_weekend = weekday >= 5
    now_hm = now.strftime("%H%M")
    day_idx = weekday + 1  # E-Gen 진료시간 인덱스: 1(월)~7(일)

    geo = await reverse_geocode(lat, lon)
    sido = geo.get("sido") or "경기도"
    sigungu = geo.get("sigungu") or "남양주시"
    dong = geo.get("dong") or ""
    short_label = geo.get("short_label") or "현재 위치"
    dong_prefix = dong[:-1] if len(dong) >= 2 and dong.endswith(("동", "읍", "면")) else dong

    if not DATA_GO_KR_API_KEY and not KAKAO_REST_API_KEY:
        base_data = get_simulated_hospitals()
        items = base_data.get("items", [])
        if filter_type == "PHARMACY":
            items = [x for x in items if x["type"] == "약국"]
        elif filter_type == "CHILDREN":
            items = [x for x in items if "소아" in x["type"] or x.get("badge") == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            items = [x for x in items if x.get("is_open_now")]
        result = {"summary": f"{short_label} 인근 병원·약국 현황", "region_label": short_label, "is_weekend": is_weekend, "filter": filter_type, "items": items}
        set_cached_data(cache_key, result, ttl_seconds=600)
        return result

    try:
        headers_kakao = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"} if KAKAO_REST_API_KEY else {}

        async def _kakao_cat(cat_code: str, radius: int = 3000, size: int = 15):
            if not KAKAO_REST_API_KEY:
                return []
            url = "https://dapi.kakao.com/v2/local/search/category.json"
            params = {
                "category_group_code": cat_code,
                "x": str(lon),
                "y": str(lat),
                "radius": radius,
                "size": size,
                "sort": "distance",
            }
            data = await async_http_get_json(f"{url}?{urllib.parse.urlencode(params)}", headers=headers_kakao, timeout=4.0)
            return data.get("documents", [])

        async def _kakao_keyword(kw: str, radius: int = 4000, size: int = 12):
            if not KAKAO_REST_API_KEY:
                return []
            url = "https://dapi.kakao.com/v2/local/search/keyword.json"
            params = {
                "query": kw,
                "category_group_code": "HP8",
                "x": str(lon),
                "y": str(lat),
                "radius": radius,
                "size": size,
                "sort": "distance",
            }
            data = await async_http_get_json(f"{url}?{urllib.parse.urlencode(params)}", headers=headers_kakao, timeout=4.0)
            return data.get("documents", [])

        async def _egen_pharm():
            if not DATA_GO_KR_API_KEY:
                return None
            pharm_url = "https://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire"
            p_params = {
                "serviceKey": DATA_GO_KR_API_KEY,
                "Q0": sido,
                "Q1": sigungu,
                "pageNo": "1",
                "numOfRows": "25",
            }
            if dong_prefix:
                p_params["QN"] = dong_prefix
            return await async_http_get_bytes(f"{pharm_url}?{urllib.parse.urlencode(p_params)}", timeout=4.5)

        async def _egen_hosp():
            if not DATA_GO_KR_API_KEY:
                return None
            hosp_url = "https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire"
            h_params = {
                "serviceKey": DATA_GO_KR_API_KEY,
                "Q0": sido,
                "Q1": sigungu,
                "QN": "소아",
                "pageNo": "1",
                "numOfRows": "20",
            }
            return await async_http_get_bytes(f"{hosp_url}?{urllib.parse.urlencode(h_params)}", timeout=4.5)

        # 카카오 로컬(전국 실좌표/거리) + E-Gen(진료시간/당번) 5개 비블로킹 병렬 동시 호출
        k_pharm_docs, k_hosp_docs, k_pedia_docs, p_raw, h_raw = await asyncio.gather(
            _kakao_cat("PM9", 3000, 15),
            _kakao_cat("HP8", 3000, 15),
            _kakao_keyword("소아청소년과", 4500, 12),
            _egen_pharm(),
            _egen_hosp(),
            return_exceptions=True,
        )

        k_pharm_docs = k_pharm_docs if isinstance(k_pharm_docs, list) else []
        k_hosp_docs = k_hosp_docs if isinstance(k_hosp_docs, list) else []
        k_pedia_docs = k_pedia_docs if isinstance(k_pedia_docs, list) else []

        egen_pharms = _parse_egen_xml(p_raw, day_idx, now_hm, is_pharmacy=True)
        egen_hosps = _parse_egen_xml(h_raw, day_idx, now_hm, is_pharmacy=False)

        egen_map = {}
        for eg in (egen_pharms + egen_hosps):
            egen_map[eg["norm_name"]] = eg

        def _find_egen_match(name: str):
            nn = _norm_name(name)
            if nn in egen_map:
                return egen_map[nn]
            for k, v in egen_map.items():
                if len(k) >= 3 and (k in nn or nn in k):
                    return v
            return None

        # 일반 영업시간 추정 (E-Gen 미매칭 시 평일 주간 여부 표시)
        default_open_est = (not is_weekend and "0900" <= now_hm <= "1800") or (weekday == 5 and "0900" <= now_hm <= "1300")

        merged = {}

        def _add_kakao_doc(d: dict, is_pharm: bool, force_pedia: bool = False):
            name = (d.get("place_name") or "").strip()
            if not name:
                return
            nn = _norm_name(name)
            if nn in merged:
                return
            try:
                p_lat = float(d.get("y"))
                p_lon = float(d.get("x"))
            except Exception:
                return
            dist_m = int(d.get("distance")) if d.get("distance") else int(haversine_distance(lat, lon, p_lat, p_lon))
            cat_full = d.get("category_name") or ""
            cat_leaf = cat_full.split(">")[-1].strip() if ">" in cat_full else cat_full.strip()
            is_child_hosp = force_pedia or ("소아" in name) or ("소아" in cat_full) or ("달빛" in name) or ("어린이" in name)

            eg = _find_egen_match(name)
            if eg:
                badge = eg["badge"]
                badge_color = eg["badge_color"]
                today_hours = eg["today_hours"]
                weekend_info = eg["weekend_info"]
                is_open_now = eg["is_open_now"]
                status_badge = eg["status_badge"]
                is_weekend_open = eg["is_weekend_open"]
            else:
                if is_pharm:
                    badge = "인근 약국"
                    badge_color = "#10b981"
                    today_hours = "방문 전 전화 확인 권장"
                    weekend_info = "토·일 영업 여부 전화 확인"
                    is_open_now = default_open_est
                    status_badge = "🟢 영업시간대 (확인 권장)" if is_open_now else "⚪ 영업시간 전화 확인"
                    is_weekend_open = False
                else:
                    badge = "달빛어린이병원" if "달빛" in name else ("소아청소년과" if is_child_hosp else (cat_leaf or "병의원"))
                    badge_color = "#ec4899" if "달빛" in name else ("#3b82f6" if is_child_hosp else "#0ea5e9")
                    today_hours = "방문 전 전화 확인 권장"
                    weekend_info = "주말 진료 여부 전화 확인"
                    is_open_now = default_open_est
                    status_badge = "🟢 진료시간대 (확인 권장)" if is_open_now else "⚪ 진료시간 전화 확인"
                    is_weekend_open = False

            item_type = "약국" if is_pharm else ("소아과/병원" if is_child_hosp else (cat_leaf or "병원"))
            merged[nn] = {
                "id": f"k_{d.get('id') or nn}",
                "name": name,
                "type": item_type,
                "is_children": is_child_hosp,
                "badge": badge,
                "badge_color": badge_color,
                "address": d.get("road_address_name") or d.get("address_name") or "",
                "phone": d.get("phone") or (eg["phone"] if eg else ""),
                "distance": _fmt_dist(dist_m),
                "distance_meters": dist_m,
                "today_hours": today_hours,
                "weekend_info": weekend_info,
                "is_open_now": is_open_now,
                "status_badge": status_badge,
                "is_weekend_open": is_weekend_open,
                "place_url": d.get("place_url") or "",
                "lat": p_lat,
                "lon": p_lon,
                "latitude": p_lat,
                "longitude": p_lon,
            }

        for d in k_pharm_docs:
            _add_kakao_doc(d, is_pharm=True)
        for d in k_pedia_docs:
            _add_kakao_doc(d, is_pharm=False, force_pedia=True)
        for d in k_hosp_docs:
            _add_kakao_doc(d, is_pharm=False)

        # E-Gen 항목 중 카카오 Top N에 없지만 실제 좌표가 5km 이내인 당번약국/달빛어린이병원 보강
        for eg in (egen_pharms + egen_hosps):
            nn = eg["norm_name"]
            if nn in merged:
                continue
            if eg["lat"] is None or eg["lon"] is None:
                continue
            dist_m = int(haversine_distance(lat, lon, eg["lat"], eg["lon"]))
            if dist_m > 5000:
                continue
            merged[nn] = {
                "id": eg["id"],
                "name": eg["name"],
                "type": eg["type"],
                "is_children": ("소아" in eg["type"] or "소아" in eg["name"] or eg["badge"] == "달빛어린이병원"),
                "badge": eg["badge"],
                "badge_color": eg["badge_color"],
                "address": eg["address"],
                "phone": eg["phone"],
                "distance": _fmt_dist(dist_m),
                "distance_meters": dist_m,
                "today_hours": eg["today_hours"],
                "weekend_info": eg["weekend_info"],
                "is_open_now": eg["is_open_now"],
                "status_badge": eg["status_badge"],
                "is_weekend_open": eg["is_weekend_open"],
                "place_url": "",
                "lat": eg["lat"],
                "lon": eg["lon"],
                "latitude": eg["lat"],
                "longitude": eg["lon"],
            }

        items = sorted(merged.values(), key=lambda x: x["distance_meters"])

        # 필터링 적용
        filtered_items = items
        if filter_type == "PHARMACY":
            filtered_items = [x for x in items if x["type"] == "약국"]
        elif filter_type == "CHILDREN":
            filtered_items = [x for x in items if x.get("is_children") or "소아" in x["type"] or x["badge"] == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            filtered_items = [x for x in items if x["is_open_now"]]

        result = {
            "summary": f"{short_label} 인근 실시간 병원·약국 현황 (카카오 로컬 + 국립중앙의료원 연동)",
            "region_label": short_label,
            "is_weekend": is_weekend,
            "filter": filter_type,
            "items": filtered_items[:30]
        }

        set_cached_data(cache_key, result, ttl_seconds=600)
        return result

    except Exception:
        base_data = get_simulated_hospitals()
        b_items = base_data.get("items", [])
        if filter_type == "PHARMACY":
            b_items = [x for x in b_items if x.get("type") == "약국"]
        elif filter_type == "CHILDREN":
            b_items = [x for x in b_items if "소아" in x.get("type", "") or x.get("badge") == "달빛어린이병원"]
        elif filter_type == "OPEN_NOW":
            b_items = [x for x in b_items if x.get("is_open_now")]
        return {
            "summary": f"{short_label} 인근 병원·약국 현황",
            "region_label": short_label,
            "is_weekend": is_weekend,
            "filter": filter_type,
            "items": b_items
        }
