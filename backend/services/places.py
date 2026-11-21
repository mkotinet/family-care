from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE
from backend.database import get_db_connection

KST = zoneinfo.ZoneInfo(TIMEZONE)

async def add_favorite_place(user_username: str, category: str, name: str, address: str = "", lat: float = None, lon: float = None, phone: str = "", status_info: str = "", memo: str = ""):
    """즐겨찾기 토글: 이미 있으면 삭제(해제), 없으면 추가"""
    user_username = (user_username or "가족공용").strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")

    # 이미 즐겨찾기 되어있는지 확인
    cursor.execute("""
    SELECT id FROM favorite_places
    WHERE name = ?
    """, (name,))
    row = cursor.fetchone()

    if row:
        # 토글: 이미 존재하므로 삭제(해제)
        cursor.execute("DELETE FROM favorite_places WHERE id = ?", (row["id"],))
        conn.commit()
        conn.close()
        return {"success": True, "action": "removed", "is_favorite": False, "id": row["id"]}

    cursor.execute("""
    INSERT INTO favorite_places (user_username, category, name, address, latitude, longitude, phone, status_info, memo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_username, category, name, address, lat, lon, phone, status_info, memo, now_kst))

    place_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"success": True, "action": "added", "is_favorite": True, "id": place_id}

async def toggle_favorite_place(user_username: str, category: str, name: str, address: str = "", lat: float = None, lon: float = None, phone: str = "", status_info: str = "", memo: str = ""):
    return await add_favorite_place(user_username, category, name, address, lat, lon, phone, status_info, memo)

async def get_favorite_places(user_username: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_user = (user_username or "").strip()
    if clean_user:
        cursor.execute("""
        SELECT * FROM favorite_places
        WHERE user_username = '가족공용' OR user_username = ? OR user_username IS NULL OR user_username = ''
        ORDER BY id DESC
        """, (clean_user,))
    else:
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

async def update_favorite_place(place_id: int, name: str = None, memo: str = None, phone: str = None, status_info: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    params = []
    if name is not None:
        updates.append("name = ?")
        params.append(name)
    if memo is not None:
        updates.append("memo = ?")
        params.append(memo)
    if phone is not None:
        updates.append("phone = ?")
        params.append(phone)
    if status_info is not None:
        updates.append("status_info = ?")
        params.append(status_info)
        
    if not updates:
        conn.close()
        return {"success": True}
        
    params.append(place_id)
    sql = f"UPDATE favorite_places SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(sql, tuple(params))
    conn.commit()
    conn.close()
    return {"success": True}
