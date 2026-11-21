import sqlite3
import json
import os
from datetime import datetime, timedelta
import zoneinfo
from pathlib import Path
from backend.config import DB_PATH, TIMEZONE

KST = zoneinfo.ZoneInfo(TIMEZONE)

def get_db_connection():
    db_file = Path(DB_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. 가족 구성원 프로필
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS family_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,  -- '아빠', '엄마', '우리아이', '할머니' 등
        avatar_color TEXT DEFAULT '#38bdf8',
        is_default INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    # 2. 나만의 자주 가는 교통 루트
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorite_routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER,
        title TEXT NOT NULL,           -- 예: '출근길 (잠실역 방면)', '등교길'
        transit_type TEXT NOT NULL,    -- 'BUS' or 'SUBWAY'
        station_id TEXT,               -- 정류소 ID / 역 코드
        station_name TEXT NOT NULL,    -- 정류소/역 명칭 (예: '평내유진아파트', '평내호평역')
        route_no TEXT NOT NULL,        -- 노선번호 (예: 'M2323', '165', '경춘선')
        target_destination TEXT,       -- 방면 (예: '잠실광역환승센터', '청량리')
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    # 3. 단골 식당 즐겨찾기 (주말 영업시간/메모)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorite_restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,                 -- 한식, 중식, 양식, 카페 등
        phone TEXT,
        address TEXT,
        distance_meters INTEGER,
        business_hours TEXT,           -- 예: '평일 11:30~21:00 / 토·일 12:00~21:30'
        closed_days TEXT,              -- 예: '매주 월요일 휴무'
        family_note TEXT,              -- 예: '아이들이 돈까스 좋아함, 주말 웨이팅 있음'
        is_favorite INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
    """)

    # 4. API 응답 스마트 캐시 (공공데이터 트래픽 절약 및 번개 로딩)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS api_cache (
        cache_key TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        expires_at TEXT NOT NULL
    )
    """)

    # 기본 가족 구성원 및 초기 샘플 데이터 시딩 (비어있을 때만)
    cursor.execute("SELECT COUNT(*) FROM family_members")
    if cursor.fetchone()[0] == 0:
        now_kst = datetime.now(KST).isoformat()
        cursor.execute("INSERT INTO family_members (name, role, avatar_color, is_default, created_at) VALUES (?, ?, ?, ?, ?)",
                       ("아빠", "직장인", "#3b82f6", 1, now_kst))
        cursor.execute("INSERT INTO family_members (name, role, avatar_color, is_default, created_at) VALUES (?, ?, ?, ?, ?)",
                       ("엄마", "주부/프리랜서", "#ec4899", 0, now_kst))
        cursor.execute("INSERT INTO family_members (name, role, avatar_color, is_default, created_at) VALUES (?, ?, ?, ?, ?)",
                       ("우리 아이", "학생", "#10b981", 0, now_kst))

    # 기본 남양주 평내유진마젤란 단골 루트 시딩
    cursor.execute("SELECT COUNT(*) FROM favorite_routes")
    if cursor.fetchone()[0] == 0:
        now_kst = datetime.now(KST).isoformat()
        cursor.execute("""
        INSERT INTO favorite_routes (member_id, title, transit_type, station_id, station_name, route_no, target_destination, sort_order, created_at)
        VALUES (1, '출근길 (잠실 직행)', 'BUS', '222000495', '평내유진아파트', 'M2323', '잠실광역환승센터', 1, ?)
        """, (now_kst,))
        cursor.execute("""
        INSERT INTO favorite_routes (member_id, title, transit_type, station_id, station_name, route_no, target_destination, sort_order, created_at)
        VALUES (1, '평내호평역 환승버스', 'BUS', '222000495', '평내유진아파트', '165', '평내호평역·청량리', 2, ?)
        """, (now_kst,))
        cursor.execute("""
        INSERT INTO favorite_routes (member_id, title, transit_type, station_id, station_name, route_no, target_destination, sort_order, created_at)
        VALUES (3, '등교/학원 루트', 'BUS', '222000495', '평내유진아파트', '93', '호평동·평내중학교', 3, ?)
        """, (now_kst,))

    # 기본 평내동 단골 식당 시딩
    cursor.execute("SELECT COUNT(*) FROM favorite_restaurants")
    if cursor.fetchone()[0] == 0:
        now_kst = datetime.now(KST).isoformat()
        cursor.execute("""
        INSERT INTO favorite_restaurants (name, category, phone, address, distance_meters, business_hours, closed_days, family_note, created_at)
        VALUES ('마젤란 숯불갈비', '한식/고기', '031-591-1234', '경기도 남양주시 평내로 145 상가동', 120, '11:30 ~ 22:00', '연중무휴', '주말 가족 외식 단골, 갈비탕 포장 가능', ?)
        """, (now_kst,))
        cursor.execute("""
        INSERT INTO favorite_restaurants (name, category, phone, address, distance_meters, business_hours, closed_days, family_note, created_at)
        VALUES ('호평 손칼국수 & 보쌈', '한식', '031-592-5678', '경기도 남양주시 늘을2로 14', 850, '11:00 ~ 21:00 (주말 21:30 마감)', '매주 화요일 휴무', '비 오는 날 칼국수 최고, 아이들 만두 좋아함', ?)
        """, (now_kst,))
        cursor.execute("""
        INSERT INTO favorite_restaurants (name, category, phone, address, distance_meters, business_hours, closed_days, family_note, created_at)
        VALUES ('카페 마젤란 포레스트', '카페/디저트', '031-593-9012', '경기도 남양주시 평내로 137', 250, '09:00 ~ 22:00 (주말 10:00 오픈)', '연중무휴', '주말 오전 브런치 추천, 야외 테라스 있음', ?)
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
    expires_at = (now_kst + timedelta(seconds=ttl_seconds)).isoformat()
    data_json = json.dumps(data, ensure_ascii=False)
    cursor.execute("""
    INSERT INTO api_cache (cache_key, data_json, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET data_json = excluded.data_json, expires_at = excluded.expires_at
    """, (cache_key, data_json, expires_at))
    conn.commit()
    conn.close()
