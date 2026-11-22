import sqlite3
import json
import os
from datetime import datetime, timedelta
import zoneinfo
from pathlib import Path
from backend.config import DB_PATH, TIMEZONE

KST = zoneinfo.ZoneInfo(TIMEZONE)

_WAL_INITIALIZED = False

def get_db_connection():
    global _WAL_INITIALIZED
    db_file = Path(DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 15000")
    if not _WAL_INITIALIZED:
        try:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            _WAL_INITIALIZED = True
        except Exception:
            pass
    return conn

# 4대 공식 가족 회원 정보 (하루퀴즈 연동, 다른 아이디 제외)
FAMILY_ACCOUNTS = [
    {
        "username": "미니미니",
        "name": "미니미니",
        "role_title": "아빠",
        "role_type": "PARENT",
        "avatar": "🐶",
        "avatar_color": "#3b82f6",
        "grade": "가장 / 아빠",
        "password_hash": "99381a8d56024a3660dd4d0a6eb888b9b3ab8ae59d8582d4a707a62697d9bd7f"
    },
    {
        "username": "Ljh",
        "name": "Ljh",
        "role_title": "엄마",
        "role_type": "PARENT",
        "avatar": "🍀",
        "avatar_color": "#ec4899",
        "grade": "엄마",
        "password_hash": ""
    },
    {
        "username": "도비사랑녀",
        "name": "도비사랑녀",
        "role_title": "첫째딸",
        "role_type": "CHILD",
        "avatar": "🐥",
        "avatar_color": "#f59e0b",
        "grade": "첫째딸",
        "password_hash": ""
    },
    {
        "username": "미니미니채",
        "name": "미니미니채",
        "role_title": "둘째딸",
        "role_type": "CHILD",
        "avatar": "🌸",
        "avatar_color": "#10b981",
        "grade": "둘째딸",
        "password_hash": ""
    }
]

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. 가족 전용 회원 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role_title TEXT NOT NULL,      -- '아빠', '엄마', '첫째딸', '둘째딸'
        role_type TEXT NOT NULL,       -- 'PARENT' or 'CHILD'
        avatar TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        grade TEXT,
        password_hash TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 2. 모바일 영구 세션 토큰 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_tokens (
        token TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        device_info TEXT,
        created_at TEXT NOT NULL,
        last_used_at TEXT NOT NULL
    )
    """)

    # 3. 가족 실시간 GPS 안심 위치 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_locations (
        username TEXT PRIMARY KEY,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        address TEXT,
        landmark TEXT,
        battery_level INTEGER,
        is_moving INTEGER DEFAULT 0,
        is_manual INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
    )
    """)
    try:
        cursor.execute("ALTER TABLE user_locations ADD COLUMN is_manual INTEGER DEFAULT 0")
    except Exception:
        pass

    # 4. 가족 전용 실시간 채팅 메시지 테이블 (단체/1:1/다:1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,         -- 'family_all', 'minikim_ljh', 'parents_child' 등
        room_type TEXT NOT NULL,       -- 'FAMILY_ALL', 'DIRECT', 'GROUP'
        sender_username TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_avatar TEXT NOT NULL,
        text TEXT NOT NULL,
        msg_type TEXT DEFAULT 'TEXT',  -- 'TEXT', 'LOCATION', 'PHOTO'
        location_json TEXT,            -- 위치 공유 데이터
        photo_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    # 5. 지도 기반 즐겨찾기 장소 (식당, 약국, 병원 등)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorite_places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_username TEXT,            -- 등록자
        category TEXT NOT NULL,        -- '식당', '약국', '병원', '축제'
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        phone TEXT,
        status_info TEXT,
        memo TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 6. 자주 가는 교통 루트
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorite_routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        user_username TEXT,
        title TEXT NOT NULL,
        transit_type TEXT NOT NULL,
        station_id TEXT,
        station_name TEXT NOT NULL,
        dest_station_id TEXT,
        dest_station_name TEXT,
        route_no TEXT NOT NULL,
        target_destination TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)
    for col in ["user_username TEXT", "dest_station_name TEXT", "dest_station_id TEXT", "target_destination TEXT"]:
        try:
            cursor.execute(f"ALTER TABLE favorite_routes ADD COLUMN {col}")
        except Exception:
            pass

    # 7. 단골 식당 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorite_restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_username TEXT,
        name TEXT NOT NULL,
        category TEXT,
        phone TEXT,
        address TEXT,
        distance_meters INTEGER,
        business_hours TEXT,
        closed_days TEXT,
        family_note TEXT,
        is_favorite INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
    """)
    try:
        cursor.execute("ALTER TABLE favorite_restaurants ADD COLUMN user_username TEXT")
    except Exception:
        pass

    # 8. API 스마트 캐시
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_cache (
        cache_key TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    """)

    # 9. 보안 감사 로그 테이블 (기본지침 제7조: 로그인·중요 작업 KST 감사 로깅, 자동 로테이션)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        detail TEXT,
        client_ip TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # 4대 공식 가족 회원 시딩/업데이트
    now_kst = datetime.now(KST).isoformat()
    for acc in FAMILY_ACCOUNTS:
        cursor.execute("SELECT id FROM users WHERE username = ?", (acc["username"],))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
            INSERT INTO users (username, name, role_title, role_type, avatar, avatar_color, grade, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (acc["username"], acc["name"], acc["role_title"], acc["role_type"], acc["avatar"], acc["avatar_color"], acc["grade"], acc["password_hash"], now_kst))

    # 가족 4인 초기 안심 위치 시딩 (기본 거점 및 자녀별 미세 분리 오프셋으로 핀 겹침 방지)
    child_offsets = {
        "미니미니": (37.643421, 127.236018, "집 (평내마젤란21)"),
        "Ljh": (37.643421, 127.236018, "집 (평내마젤란21)"),
        "도비사랑녀": (37.643650, 127.236300, "집 안심구역 (첫째딸)"),
        "미니미니채": (37.643200, 127.235700, "집 안심구역 (둘째딸)")
    }
    for mem, (lat, lon, lm) in child_offsets.items():
        cursor.execute("SELECT username FROM user_locations WHERE username = ?", (mem,))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO user_locations (username, latitude, longitude, accuracy, address, landmark, battery_level, is_moving, is_manual, updated_at)
            VALUES (?, ?, ?, 10.0, '경기도 남양주시 평내로 89 (평내동, 평내마젤란21아파트)', ?, 95, 0, 0, ?)
            """, (mem, lat, lon, lm, now_kst))

    # 기존 DB의 이전 기준점 좌표가 남아있을 경우 최신 평내마젤란21 정밀 좌표로 보정
    cursor.execute("""
    UPDATE user_locations 
    SET latitude = 37.643421, longitude = 127.236018, address = '경기도 남양주시 평내로 89 (평내동, 평내마젤란21아파트)'
    WHERE latitude > 37.6434 AND latitude < 37.6435 AND longitude < 127.232
    """)

    # 초기 가족 전체 채팅 환영 메시지
    cursor.execute("SELECT COUNT(*) FROM chat_messages")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO chat_messages (room_id, room_type, sender_username, sender_name, sender_avatar, text, is_read, created_at)
        VALUES ('family_all', 'FAMILY_ALL', '미니미니', '아빠', '🐶', '우리가족챙기기 실시간 패밀리 톡방이 열렸어요! 모두 환영해요 🌿', 1, ?)
        """, (now_kst,))

    conn.commit()
    conn.close()

# 캐시 헬퍼 함수
def get_cached_data(cache_key: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("SELECT data_json FROM api_cache WHERE cache_key = ? AND expires_at > ?", (cache_key, now_kst))
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row["data_json"])
        except Exception:
            return None
    return None

def set_cached_data(cache_key: str, data: dict, ttl_seconds: int = 300):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST)
    now_iso = now_kst.isoformat()
    expires_at = (now_kst + timedelta(seconds=ttl_seconds)).isoformat()
    data_json = json.dumps(data, ensure_ascii=False)
    cursor.execute("""
    INSERT INTO api_cache (cache_key, data_json, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET data_json = excluded.data_json, expires_at = excluded.expires_at
    """, (cache_key, data_json, expires_at))
    # 만료 캐시 자동 정리 (api_cache 무한 팽창 방지)
    cursor.execute("DELETE FROM api_cache WHERE expires_at <= ?", (now_iso,))

    conn.commit()
    conn.close()

def delete_cached_data(cache_key_prefix: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM api_cache WHERE cache_key LIKE ?", (f"{cache_key_prefix}%",))
    conn.commit()
    conn.close()

# 보안 감사 로그 기록 (최대 1,000건 자동 로테이션)
def write_audit_log(username: str, action: str, status: str, detail: str = "", client_ip: str = "", user_agent: str = ""):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S KST")
        cursor.execute("""
        INSERT INTO audit_logs (username, action, status, detail, client_ip, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            (username or "anonymous")[:64],
            (action or "UNKNOWN")[:64],
            (status or "INFO")[:32],
            (detail or "")[:300],
            (client_ip or "")[:64],
            (user_agent or "")[:200],
            now_kst
        ))
        cursor.execute("""
        DELETE FROM audit_logs
        WHERE id NOT IN (SELECT id FROM audit_logs ORDER BY id DESC LIMIT 1000)
        """)
        conn.commit()
        conn.close()
    except Exception:
        pass

def get_audit_logs(limit: int = 100):
    safe_limit = max(1, min(int(limit or 100), 500))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (safe_limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
