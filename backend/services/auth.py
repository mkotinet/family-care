import hashlib
import secrets
from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE
from backend.database import get_db_connection

KST = zoneinfo.ZoneInfo(TIMEZONE)
SALT = "haru_salt_2026"

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(24)

ALLOWED_FAMILY_USERNAMES = ["미니미니", "Ljh", "도비사랑녀", "미니미니채"]

async def authenticate_user(username: str, password: str = "", device_info: str = "Mobile Web"):
    username = username.strip()
    if username not in ALLOWED_FAMILY_USERNAMES:
        return {"success": False, "message": "우리가족 등록 회원이 아닙니다."}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return {"success": False, "message": "사용자를 찾을 수 없습니다."}

    # 비밀번호 검증 (미니미니는 하루퀴즈 해시 또는 간편비번, 다른 가족은 설정된 비번 또는 간편입장)
    stored_hash = user["password_hash"]
    if stored_hash and password:
        input_hash = hash_password(password)
        # 비밀번호가 일치하거나 간편 가족 패스워드일 때 통과
        if input_hash != stored_hash and password not in ["1234", "haru1234"]:
            conn.close()
            return {"success": False, "message": "비밀번호가 일치하지 않습니다."}

    # 토큰 발급 및 저장
    token = generate_token()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute("""
    INSERT INTO user_tokens (token, username, device_info, created_at, last_used_at)
    VALUES (?, ?, ?, ?, ?)
    """, (token, username, device_info, now_kst, now_kst))
    conn.commit()
    conn.close()

    user_dict = {
        "id": user["id"],
        "username": user["username"],
        "name": user["name"],
        "role_title": user["role_title"],
        "role_type": user["role_type"],
        "avatar": user["avatar"],
        "avatar_color": user["avatar_color"],
        "grade": user["grade"]
    }

    return {
        "success": True,
        "token": token,
        "user": user_dict
    }

async def get_user_by_token(token: str):
    if not token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.* FROM user_tokens t
    JOIN users u ON t.username = u.username
    WHERE t.token = ?
    """, (token,))
    row = cursor.fetchone()
    if row:
        # 갱신
        now_kst = datetime.now(KST).isoformat()
        cursor.execute("UPDATE user_tokens SET last_used_at = ? WHERE token = ?", (now_kst, token))
        conn.commit()
        conn.close()
        return {
            "id": row["id"],
            "username": row["username"],
            "name": row["name"],
            "role_title": row["role_title"],
            "role_type": row["role_type"],
            "avatar": row["avatar"],
            "avatar_color": row["avatar_color"],
            "grade": row["grade"]
        }
    conn.close()
    return None

async def get_family_members_list():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role_title, role_type, avatar, avatar_color, grade FROM users ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
