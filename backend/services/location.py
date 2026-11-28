import asyncio
import secrets
from datetime import datetime
import zoneinfo
from backend.config import KAKAO_REST_API_KEY, TIMEZONE, DEFAULT_LOCATION
from backend.database import get_db_connection, get_cached_data, set_cached_data
from backend.coords import haversine_distance
from backend.http_client import async_http_get_json
from backend.services.push import send_web_push_to_user

KST = zoneinfo.ZoneInfo(TIMEZONE)

SIDO_TO_AIRKOREA = {
    "서울특별시": "서울", "서울": "서울",
    "부산광역시": "부산", "부산": "부산",
    "대구광역시": "대구", "대구": "대구",
    "인천광역시": "인천", "인천": "인천",
    "광주광역시": "광주", "광주": "광주",
    "대전광역시": "대전", "대전": "대전",
    "울산광역시": "울산", "울산": "울산",
    "세종특별자치시": "세종", "세종": "세종",
    "경기도": "경기", "경기": "경기",
    "강원특별자치도": "강원", "강원도": "강원", "강원": "강원",
    "충청북도": "충북", "충북": "충북",
    "충청남도": "충남", "충남": "충남",
    "전북특별자치도": "전북", "전라북도": "전북", "전북": "전북",
    "전라남도": "전남", "전남": "전남",
    "경상북도": "경북", "경북": "경북",
    "경상남도": "경남", "경남": "경남",
    "제주특별자치도": "제주", "제주": "제주",
}

def _normalize_sido_short(sido: str) -> str:
    if not sido:
        return "경기"
    if sido in SIDO_TO_AIRKOREA:
        return SIDO_TO_AIRKOREA[sido]
    for k, v in SIDO_TO_AIRKOREA.items():
        if k.startswith(sido[:2]) or sido.startswith(v):
            return v
    return "경기"

async def reverse_geocode(lat: float, lon: float) -> dict:
    """
    WGS84 좌표를 카카오 REST API로 행정구역/도로명 주소로 변환 (전국 지원, 30분 캐시)
    """
    home_dist = int(haversine_distance(lat, lon, DEFAULT_LOCATION["lat"], DEFAULT_LOCATION["lon"]))
    is_near_home = home_dist <= 250

    cache_key = f"rev_geo_v1_{round(lat, 3)}_{round(lon, 3)}"
    cached = get_cached_data(cache_key)
    if cached:
        res = dict(cached)
        res["lat"] = lat
        res["lon"] = lon
        res["is_near_home"] = is_near_home
        res["home_distance_m"] = home_dist
        return res

    sido = "경기도" if is_near_home else ""
    sigungu = "남양주시" if is_near_home else ""
    dong = "평내동" if is_near_home else ""
    building_name = "평내마젤란21" if is_near_home else ""
    full_address = DEFAULT_LOCATION.get("address") or DEFAULT_LOCATION.get("name") or "경기도 남양주시 평내로 89" if is_near_home else f"위도 {round(lat, 4)}, 경도 {round(lon, 4)}"

    if KAKAO_REST_API_KEY:
        headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
        region_url = f"https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x={lon}&y={lat}"
        addr_url = f"https://dapi.kakao.com/v2/local/geo/coord2address.json?x={lon}&y={lat}"
        region_res, addr_res = await asyncio.gather(
            async_http_get_json(region_url, headers=headers, timeout=3.5),
            async_http_get_json(addr_url, headers=headers, timeout=3.5),
            return_exceptions=True,
        )

        if isinstance(region_res, dict):
            docs = region_res.get("documents") or []
            # 행정동(H) 우선, 없으면 법정동(B)
            picked = next((d for d in docs if d.get("region_type") == "H"), None) or (docs[0] if docs else None)
            if picked:
                sido = picked.get("region_1depth_name") or sido
                sigungu = picked.get("region_2depth_name") or sigungu
                dong = picked.get("region_3depth_name") or dong
                if picked.get("address_name"):
                    full_address = picked.get("address_name")

        if isinstance(addr_res, dict):
            a_docs = addr_res.get("documents") or []
            if a_docs:
                road = a_docs[0].get("road_address")
                jibun = a_docs[0].get("address")
                if road:
                    full_address = road.get("address_name") or full_address
                    if road.get("building_name"):
                        building_name = road.get("building_name")
                    if not sido:
                        sido = road.get("region_1depth_name") or sido
                    if not sigungu:
                        sigungu = road.get("region_2depth_name") or sigungu
                    if not dong:
                        dong = road.get("region_3depth_name") or dong
                elif jibun:
                    full_address = jibun.get("address_name") or full_address
                    if not sido:
                        sido = jibun.get("region_1depth_name") or sido
                    if not sigungu:
                        sigungu = jibun.get("region_2depth_name") or sigungu
                    if not dong:
                        dong = jibun.get("region_3depth_name") or dong

    sido_short = _normalize_sido_short(sido)
    short_parts = [p for p in [sigungu, dong] if p]
    if not short_parts and sido:
        short_parts = [sido]
    short_label = " ".join(short_parts) if short_parts else "현재 위치"

    if is_near_home:
        display_name = "남양주시 평내동 (우리 집)"
    elif sido_short in ("서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"):
        display_name = f"{sido_short} {short_label}".strip()
        if building_name and len(building_name) <= 14:
            display_name = f"{display_name} · {building_name}"
    else:
        display_name = short_label
        if building_name and len(building_name) <= 14:
            display_name = f"{display_name} · {building_name}"

    result = {
        "lat": lat,
        "lon": lon,
        "sido": sido or "경기도",
        "sido_short": sido_short,
        "sigungu": sigungu,
        "dong": dong,
        "building_name": building_name,
        "full_address": full_address,
        "short_label": short_label,
        "display_name": display_name,
        "is_near_home": is_near_home,
        "home_distance_m": home_dist,
    }
    set_cached_data(cache_key, result, ttl_seconds=1800)
    return result

# 가족 주요 안심 거점 (지오펜스)
SAFE_ZONES = [
    {"name": "집 (평내마젤란21)", "lat": DEFAULT_LOCATION["lat"], "lon": DEFAULT_LOCATION["lon"], "radius": 250},
    {"name": "평내초등학교 & 병설유치원", "lat": 37.646123, "lon": 127.234512, "radius": 250},
    {"name": "평내호평역 & 학원가", "lat": 37.653412, "lon": 127.244123, "radius": 350},
    {"name": "평내도서관 & 주민센터", "lat": 37.641203, "lon": 127.228945, "radius": 200}
]

def determine_landmark(lat: float, lon: float):
    if lat is None or lon is None:
        return "위치 미확인"

    for zone in SAFE_ZONES:
        dist = haversine_distance(lat, lon, zone["lat"], zone["lon"])
        if dist <= zone["radius"]:
            return f"{zone['name']} 안심구역 (반경 {int(dist)}m)"

    home_dist = haversine_distance(lat, lon, DEFAULT_LOCATION["lat"], DEFAULT_LOCATION["lon"])
    if home_dist < 800:
        return f"집 인근 ({int(home_dist)}m)"
    else:
        return f"외출 중 (집에서 {round(home_dist/1000, 1)}km)"

def _parse_kst_dt(ts_str: str):
    if not ts_str:
        return None
    try:
        if "T" in ts_str:
            dt = datetime.fromisoformat(ts_str)
        else:
            dt = datetime.strptime(ts_str[:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=KST)
        return dt
    except Exception:
        return None

async def update_user_location(
    username: str,
    lat: float,
    lon: float,
    accuracy: float = 10.0,
    battery: int = 100,
    is_moving: bool = False,
    is_manual: bool = False,
    custom_landmark: str = None,
    source: str = "WEB_GPS",
    gps_permission: str = "GRANTED",
):
    """
    자녀 스마트폰 실제 GPS / iOS 단축어 무인 웹훅 / 긴급 핑 회신 / 부모 수동 설정 기록 및 이동 동선(location_history) 적재
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst_dt = datetime.now(KST)
    now_kst = now_kst_dt.strftime("%Y-%m-%d %H:%M:%S")
    eff_source = "MANUAL" if is_manual else (source or "WEB_GPS")
    eff_perm = "GRANTED" if not is_manual else "MANUAL"
    if gps_permission:
        eff_perm = gps_permission

    landmark = custom_landmark or determine_landmark(lat, lon)
    address = "위치 확인 중"

    # 카카오 좌표계 변환 및 상세 주소 조회 (공통 reverse_geocode 활용)
    if lat is not None and lon is not None:
        try:
            geo = await reverse_geocode(lat, lon)
            address = geo.get("full_address") or geo.get("display_name") or address
            # 외출 중일 때는 구체적 동네/건물명을 landmark에 함께 반영하여 부모 가독성 극대화
            if not custom_landmark and landmark.startswith("외출 중") and geo.get("display_name"):
                landmark = f"{geo['display_name']} ({landmark})"
        except Exception:
            pass

    cursor.execute("""
    INSERT INTO user_locations (username, latitude, longitude, accuracy, address, landmark, battery_level, is_moving, is_manual, source, gps_permission, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        address = excluded.address,
        landmark = excluded.landmark,
        battery_level = excluded.battery_level,
        is_moving = excluded.is_moving,
        is_manual = excluded.is_manual,
        source = excluded.source,
        gps_permission = excluded.gps_permission,
        updated_at = excluded.updated_at
    """, (username, lat, lon, accuracy, address, landmark, battery, 1 if is_moving else 0, 1 if is_manual else 0, eff_source, eff_perm, now_kst))

    # 이동 동선(location_history) 중복 억제 저장: 30m 이상 이동 또는 10분 경과 또는 단축어/핑회신/수동 이벤트
    should_record_history = eff_source in ("IOS_SHORTCUT", "PING_REPLY", "MANUAL")
    if not should_record_history:
        cursor.execute(
            "SELECT latitude, longitude, created_at FROM location_history WHERE username = ? ORDER BY id DESC LIMIT 1",
            (username,),
        )
        last_h = cursor.fetchone()
        if not last_h:
            should_record_history = True
        else:
            try:
                moved_m = haversine_distance(lat, lon, float(last_h["latitude"]), float(last_h["longitude"]))
            except Exception:
                moved_m = 999
            last_dt = _parse_kst_dt(last_h["created_at"])
            elapsed_s = (now_kst_dt - last_dt).total_seconds() if last_dt else 9999
            if moved_m >= 30 or elapsed_s >= 600:
                should_record_history = True

    if should_record_history and lat is not None and lon is not None:
        cursor.execute("""
        INSERT INTO location_history (username, latitude, longitude, accuracy, address, landmark, battery_level, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (username, lat, lon, accuracy, address, landmark, battery, eff_source, now_kst))
        # 계정당 최신 300건만 유지 (자동 GC)
        cursor.execute("""
        DELETE FROM location_history
        WHERE username = ? AND id NOT IN (
            SELECT id FROM location_history WHERE username = ? ORDER BY id DESC LIMIT 300
        )
        """, (username, username))

    conn.commit()
    conn.close()
    return {
        "success": True,
        "landmark": landmark,
        "address": address,
        "source": eff_source,
        "updated_at": now_kst,
        "is_manual": is_manual
    }

async def update_gps_permission_status(username: str, gps_permission: str) -> dict:
    """자녀 기기에서 위치 권한 거부(DENIED) 또는 실내 타임아웃(TIMEOUT) 발생 시 기존 좌표를 보존한 채 상태만 서버에 기록"""
    perm = (gps_permission or "UNKNOWN").upper()[:20]
    if perm not in ("GRANTED", "DENIED", "PROMPT", "TIMEOUT", "UNSUPPORTED", "UNKNOWN"):
        perm = "UNKNOWN"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE user_locations SET gps_permission = ? WHERE username = ?", (perm, username))
    conn.commit()
    conn.close()
    return {"success": True, "username": username, "gps_permission": perm}

async def get_location_history(username: str, limit: int = 50) -> list:
    """특정 가족 구성원의 최근 이동 동선 타임라인 조회 (최신순 -> 시간순 반환)"""
    safe_limit = max(1, min(int(limit or 50), 200))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, username, latitude, longitude, accuracy, address, landmark, battery_level, source, created_at
    FROM location_history
    WHERE username = ?
    ORDER BY id DESC LIMIT ?
    """, (username, safe_limit))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    rows.reverse()  # 시간순(과거 -> 현재) 정렬로 지도 폴리라인 연결 용이
    return rows

async def get_shortcut_configs(requester_user: dict) -> list:
    """아이폰 단축어 무인 백그라운드 자동화용 웹훅 키 목록 조회 (부모: 딸 2명 전체, 자녀: 본인)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    if requester_user.get("role_type") == "PARENT":
        cursor.execute("""
        SELECT u.username, u.name, u.role_title, u.avatar, s.api_key, s.created_at, s.last_used_at
        FROM users u
        LEFT JOIN shortcut_keys s ON u.username = s.username
        WHERE u.role_type = 'CHILD'
        ORDER BY u.id ASC
        """)
    else:
        cursor.execute("""
        SELECT u.username, u.name, u.role_title, u.avatar, s.api_key, s.created_at, s.last_used_at
        FROM users u
        LEFT JOIN shortcut_keys s ON u.username = s.username
        WHERE u.username = ?
        """, (requester_user["username"],))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    for r in rows:
        r["webhook_url"] = "https://family.danminlove.com/api/location/shortcut-webhook"
    return rows

async def rotate_shortcut_key(username: str) -> dict:
    new_key = secrets.token_urlsafe(24)
    now_kst = datetime.now(KST).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO shortcut_keys (username, api_key, created_at, last_used_at)
    VALUES (?, ?, ?, NULL)
    ON CONFLICT(username) DO UPDATE SET api_key = excluded.api_key, created_at = excluded.created_at
    """, (username, new_key, now_kst))
    conn.commit()
    conn.close()
    return {"success": True, "username": username, "api_key": new_key, "webhook_url": "https://family.danminlove.com/api/location/shortcut-webhook"}

def verify_shortcut_key(api_key: str):
    """단축어 API 키로 대상 username 검증 및 최근 사용 시각 갱신"""
    clean_key = (api_key or "").strip()
    if not clean_key:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM shortcut_keys WHERE api_key = ?", (clean_key,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    username = row["username"]
    now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("UPDATE shortcut_keys SET last_used_at = ? WHERE username = ?", (now_kst, username))
    conn.commit()
    conn.close()
    return username

async def get_family_locations():
    """
    가족 4인 전체 위치 및 실시간 로그인 접속·GPS 신선도·푸시 구독·권한 상태 통합 모니터링
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        u.username, u.name, u.role_title, u.role_type, u.avatar, u.avatar_color,
        l.latitude, l.longitude, l.accuracy, l.address, l.landmark, l.battery_level, 
        l.is_moving, l.is_manual, l.source, l.gps_permission, l.updated_at,
        t.token, t.device_info, t.last_used_at AS token_last_used_at,
        (SELECT COUNT(*) FROM push_subscriptions ps WHERE ps.username = u.username) AS push_sub_count,
        (SELECT last_used_at FROM shortcut_keys sk WHERE sk.username = u.username) AS shortcut_last_used_at,
        (SELECT COUNT(*) FROM location_history lh WHERE lh.username = u.username) AS history_count
    FROM users u
    LEFT JOIN user_locations l ON u.username = l.username
    LEFT JOIN (
        SELECT username, token, device_info, last_used_at,
               ROW_NUMBER() OVER(PARTITION BY username ORDER BY last_used_at DESC) as rn
        FROM user_tokens
    ) t ON u.username = t.username AND t.rn = 1
    ORDER BY u.id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    now_dt = datetime.now(KST)
    children = []
    parents = []

    for row_item in rows:
        r = dict(row_item)
        # 1. 로그인 및 세션 실시간 모니터링 판별
        token_last = r.get("token_last_used_at")
        is_online = False
        login_status = "NEVER_LOGGED_IN"
        login_badge = "⚪ 앱 미설치 / 미로그인"
        login_desc = "로그인 기록 없음"

        if token_last:
            tok_dt = _parse_kst_dt(token_last)
            if tok_dt:
                tok_diff = (now_dt - tok_dt).total_seconds()
                if tok_diff < 900:  # 15분 이내
                    is_online = True
                    login_status = "ONLINE"
                    login_badge = "🟢 실시간 접속 중"
                    login_desc = "실시간 활동 중"
                elif tok_diff < 3600:  # 1시간 이내
                    login_status = "BACKGROUND_STANDBY"
                    login_badge = "🟡 최근 활동"
                    login_desc = f"{int(tok_diff // 60)}분 전 접속"
                elif tok_diff < 86400:
                    login_status = "STANDBY"
                    login_badge = "🟠 대기 상태"
                    login_desc = f"{int(tok_diff // 3600)}시간 전 접속"
                else:
                    login_status = "OFFLINE"
                    login_badge = "⚪ 미접속"
                    login_desc = tok_dt.strftime("%m월 %d일 접속")

        # 2. 위치 및 GPS 신선도 정밀 판별 (오래된 과거 좌표를 '실시간 확인'으로 오표기하지 않음!)
        has_real_gps = bool(r["updated_at"] and r["latitude"] is not None and r["longitude"] is not None)
        gps_permission = (r.get("gps_permission") or "UNKNOWN").upper()
        loc_source = (r.get("source") or "WEB_GPS").upper()
        push_sub_count = int(r.get("push_sub_count") or 0)
        history_count = int(r.get("history_count") or 0)
        is_manual = bool(r["is_manual"]) if has_real_gps else False

        source_labels = {
            "WEB_GPS": "웹앱 GPS",
            "IOS_SHORTCUT": "⚡ 아이폰 자동단축어",
            "PING_REPLY": "📲 긴급요청 회신",
            "MANUAL": "📌 부모 수동지정",
        }
        source_label = source_labels.get(loc_source, "GPS")

        default_child_coords = {
            "도비사랑녀": {"lat": round(DEFAULT_LOCATION["lat"] + 0.00025, 6), "lon": round(DEFAULT_LOCATION["lon"] + 0.00030, 6)},
            "미니미니채": {"lat": round(DEFAULT_LOCATION["lat"] - 0.00025, 6), "lon": round(DEFAULT_LOCATION["lon"] - 0.00030, 6)}
        }

        freshness_status = "DISCONNECTED"
        diff_sec = 999999
        time_diff_desc = "미수신"
        is_fresh = False
        status_badge = "🔴 실시간 위치 미수신"

        if has_real_gps:
            target_lat = r["latitude"]
            target_lon = r["longitude"]
            target_address = r["address"] or "경기도 남양주시 평내로 89 (평내동, 평내마젤란21아파트)"
            target_landmark = r["landmark"] or "집 안심구역"
            up_dt = _parse_kst_dt(r["updated_at"])
            if up_dt:
                diff_sec = max(0, (now_dt - up_dt).total_seconds())
                if diff_sec < 60:
                    time_diff_desc = "방금 전"
                elif diff_sec < 3600:
                    time_diff_desc = f"{int(diff_sec // 60)}분 전"
                elif diff_sec < 86400:
                    time_diff_desc = f"{int(diff_sec // 3600)}시간 전"
                else:
                    days = int(diff_sec // 86400)
                    time_diff_desc = f"{days}일 전 ({up_dt.strftime('%m/%d %H:%M')})"

                if diff_sec <= 600:
                    freshness_status = "LIVE"
                    is_fresh = True
                elif diff_sec <= 1800:
                    freshness_status = "RECENT"
                    is_fresh = True
                elif diff_sec <= 7200:
                    freshness_status = "STALE"
                    is_fresh = False
                else:
                    freshness_status = "DISCONNECTED"
                    is_fresh = False
            else:
                time_diff_desc = r["updated_at"]

            if gps_permission == "DENIED":
                status_badge = "⚠️ 아이폰 위치 권한 꺼짐 (설정 필요)"
            elif is_manual:
                status_badge = f"📌 부모 수동지정 ({target_landmark})"
            elif freshness_status == "LIVE":
                if "안심구역" in target_landmark or "집" in target_landmark:
                    status_badge = f"🟢 안심 구역 ({source_label} 실시간)"
                else:
                    status_badge = f"🟢 외출 확인 ({source_label} 실시간)"
            elif freshness_status == "RECENT":
                status_badge = f"🟢 최근 확인 ({time_diff_desc})"
            elif freshness_status == "STALE":
                status_badge = f"🟡 위치 갱신 지연 ({time_diff_desc} 마지막 확인)"
            else:
                status_badge = f"🔴 실시간 연결 끊김 (마지막: {time_diff_desc})"
        else:
            target_coords = default_child_coords.get(r["username"], {"lat": DEFAULT_LOCATION["lat"], "lon": DEFAULT_LOCATION["lon"]})
            target_lat = target_coords["lat"]
            target_lon = target_coords["lon"]
            target_address = "위치 미수신 (기본 거점 표시)"
            target_landmark = "실시간 GPS 미수신"
            if gps_permission == "DENIED":
                status_badge = "⚠️ 아이폰 위치 권한 꺼짐 (설정 필요)"
            else:
                status_badge = "🔴 위치 미수신 (앱 실행/설정 필요)"

        item = {
            "username": r["username"],
            "name": r["name"],
            "role_title": r["role_title"],
            "role_type": r["role_type"],
            "avatar": r["avatar"],
            "avatar_color": r["avatar_color"],
            "is_online": is_online,
            "login_status": login_status,
            "login_badge": login_badge,
            "login_desc": login_desc,
            "device_info": r["device_info"] or "기기 정보 없음",
            "has_location": has_real_gps,
            "has_real_gps": has_real_gps,
            "has_fresh_location": is_fresh,
            "freshness_status": freshness_status,
            "gps_age_seconds": int(diff_sec) if has_real_gps else None,
            "gps_permission": gps_permission,
            "source": loc_source,
            "source_label": source_label,
            "has_push_subscription": push_sub_count > 0,
            "push_sub_count": push_sub_count,
            "shortcut_last_used_at": r.get("shortcut_last_used_at"),
            "history_count": history_count,
            "latitude": target_lat,
            "longitude": target_lon,
            "accuracy": r["accuracy"] if has_real_gps else None,
            "address": target_address,
            "landmark": target_landmark,
            "battery_level": r["battery_level"] if has_real_gps else None,
            "is_moving": bool(r["is_moving"]) if has_real_gps else False,
            "is_manual": is_manual,
            "updated_at": r["updated_at"] if has_real_gps else "미수신",
            "time_diff_desc": time_diff_desc,
            "status_badge": status_badge,
            "is_fresh": is_fresh
        }

        if r["role_type"] == "CHILD":
            children.append(item)
        else:
            parents.append(item)

    return {
        "children": children,
        "parents": parents,
        "safe_zones": SAFE_ZONES
    }

async def request_child_ping(child_username: str, requester_name: str = "아빠"):
    """
    자녀에게 긴급 실시간 위치 확인 요청 발송:
    1) 가족 채팅방 알림 메시지 기록
    2) 등록된 아이폰/안드로이드 Web Push(APNs/FCM)로 잠금화면 즉시 푸시 발송 (터치 1번으로 자동 위치 회신!)
    """
    from backend.services.chat import send_message
    sender_username = "Ljh" if "엄마" in (requester_name or "") or requester_name == "Ljh" else "미니미니"
    msg_text = f"🚨 [긴급 위치 확인 요청] {requester_name}님이 {child_username}의 현재 위치를 확인하고 싶어해요. 알림을 터치하거나 [📍 지금 내 위치 보내기]를 눌러 알려주세요!"
    await send_message(
        room_id="family_all",
        sender_username=sender_username,
        text=msg_text,
        msg_type="TEXT",
        skip_push=True,
    )

    push_res = await send_web_push_to_user(
        child_username,
        title=f"🚨 {requester_name}님의 긴급 위치 확인 요청",
        body="이 알림을 1번만 터치하면 현재 위치가 부모님께 자동 전송됩니다! 📍",
        url="/?pwa=1&auto_ping=1&from_push=1",
        tag=f"urgent-ping-{child_username}",
        urgency="high",
    )

    if push_res.get("sent", 0) > 0:
        feedback = f"🚨 {child_username}의 아이폰 잠금화면으로 긴급 푸시 알림({push_res['sent']}대) 및 채팅 요청을 즉시 발송했습니다!"
    elif push_res.get("total", 0) == 0:
        feedback = f"📲 {child_username}에게 채팅 요청을 보냈습니다. (※ 아직 자녀 폰에서 '🔔 긴급 호출 알림 켜기'가 미등록되어 잠금화면 푸시는 미발송됨)"
    else:
        feedback = f"📲 {child_username}에게 채팅 요청을 보냈으나 푸시 전송이 지연되었습니다."

    return {
        "success": True,
        "message": feedback,
        "push_sent": push_res.get("sent", 0),
        "push_total": push_res.get("total", 0),
    }
