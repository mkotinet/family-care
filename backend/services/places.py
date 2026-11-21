from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE
from backend.database import get_db_connection

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def add_favorite_place(user_username: str, category: str, name: str, address: str = "", lat: float = None, lon: float = None, phone: str = "", status_info: str = "", memo: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")

    # 이미 즐겨찾기 되어있는지 확인
    cursor.execute("""
    SELECT id FROM favorite_places
    WHERE name = ? AND category = ?
    """, (name, category))
    row = cursor.fetchone()

    if row:
        conn.close()
        return {"success": True, "action": "already_exists", "id": row["id"]}

    cursor.execute("""
    INSERT INTO favorite_places (user_username, category, name, address, latitude, longitude, phone, status_info, memo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_username, category, name, address, lat, lon, phone, status_info, memo, now_kst))

    place_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"success": True, "action": "added", "id": place_id}

async def get_favorite_places(user_username: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM favorite_places
    ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

async def remove_favorite_place(place_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM favorite_places WHERE id = ?", (place_id,))
    conn.commit()
    conn.close()
    return {"success": True}
