from datetime import datetime
import zoneinfo
import json
from backend.config import TIMEZONE
from backend.database import get_db_connection

KST = zoneinfo.ZoneInfo(TIMEZONE)

# 기본 채팅방 정의
DEFAULT_ROOMS = [
    {
        "id": "family_all",
        "title": "👨‍👩‍👧‍👧 우리 가족 전체톡",
        "type": "FAMILY_ALL",
        "description": "아빠, 엄마, 첫째딸, 둘째딸 온 가족 방",
        "badge": "가족전체"
    },
    {
        "id": "direct_parents",
        "title": "💑 아빠 & 엄마 대화방",
        "type": "DIRECT",
        "description": "부모 전용 1:1 비밀톡",
        "badge": "1:1"
    },
    {
        "id": "direct_child1",
        "title": "💬 아빠 & 첫째딸 (도비사랑녀)",
        "type": "DIRECT",
        "description": "첫째딸과 1:1 대화",
        "badge": "1:1"
    },
    {
        "id": "direct_child2",
        "title": "💬 아빠 & 둘째딸 (미니미니채)",
        "type": "DIRECT",
        "description": "둘째딸과 1:1 대화",
        "badge": "1:1"
    },
    {
        "id": "group_pickup",
        "title": "🚗 안심 귀가 & 픽업 알림방",
        "type": "GROUP",
        "description": "학원/학교 마침 위치 공유 및 픽업 전용 방",
        "badge": "안심픽업"
    }
]

async def get_chat_rooms(current_username: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    rooms = []
    for r in DEFAULT_ROOMS:
        # 최근 메시지 1개 및 안읽은 개수 조회
        cursor.execute("""
        SELECT text, sender_name, created_at, msg_type FROM chat_messages
        WHERE room_id = ?
        ORDER BY id DESC LIMIT 1
        """, (r["id"],))
        last_msg = cursor.fetchone()

        last_text = "대화를 시작해 보세요!"
        last_time = ""
        if last_msg:
            if last_msg["msg_type"] == "LOCATION":
                last_text = f"📍 [{last_msg['sender_name']}] 위치를 공유했어요"
            else:
                last_text = f"[{last_msg['sender_name']}] {last_msg['text']}"
            last_time = last_msg["created_at"][11:16]

        rooms.append({
            "id": r["id"],
            "title": r["title"],
            "type": r["type"],
            "description": r["description"],
            "badge": r["badge"],
            "last_message": last_text,
            "last_time": last_time,
            "unread_count": 0
        })

    conn.close()
    return rooms

async def get_messages(room_id: str, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM chat_messages
    WHERE room_id = ?
    ORDER BY id ASC LIMIT ?
    """, (room_id, limit))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        loc_data = None
        if r["location_json"]:
            try:
                loc_data = json.loads(r["location_json"])
            except Exception:
                pass

        results.append({
            "id": r["id"],
            "room_id": r["room_id"],
            "sender_username": r["sender_username"],
            "sender_name": r["sender_name"],
            "sender_avatar": r["sender_avatar"],
            "text": r["text"],
            "msg_type": r["msg_type"],
            "location_data": loc_data,
            "photo_url": r["photo_url"],
            "is_read": bool(r["is_read"]),
            "time_str": r["created_at"][11:16],
            "created_at": r["created_at"]
        })
    return results

async def send_message(room_id: str, sender_username: str, text: str, msg_type: str = "TEXT", location_data: dict = None, photo_url: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    # 발신자 정보 확인
    cursor.execute("SELECT name, role_title, avatar FROM users WHERE username = ?", (sender_username,))
    u = cursor.fetchone()
    sender_name = f"{u['role_title']} ({u['name']})" if u else sender_username
    sender_avatar = u["avatar"] if u else "👤"

    now_kst = datetime.now(KST).strftime("%Y-%m-%d %H:%M:%S")
    loc_json_str = json.dumps(location_data, ensure_ascii=False) if location_data else None

    # room_type 판별
    room_type = "FAMILY_ALL"
    for r in DEFAULT_ROOMS:
        if r["id"] == room_id:
            room_type = r["type"]
            break

    cursor.execute("""
    INSERT INTO chat_messages (room_id, room_type, sender_username, sender_name, sender_avatar, text, msg_type, location_json, photo_url, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (room_id, room_type, sender_username, sender_name, sender_avatar, text, msg_type, loc_json_str, photo_url, now_kst))

    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": {
            "id": msg_id,
            "room_id": room_id,
            "sender_username": sender_username,
            "sender_name": sender_name,
            "sender_avatar": sender_avatar,
            "text": text,
            "msg_type": msg_type,
            "location_data": location_data,
            "time_str": now_kst[11:16],
            "created_at": now_kst
        }
    }
