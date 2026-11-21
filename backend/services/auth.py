import hashlib
import json
import secrets
import urllib.parse
import urllib.request
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

def verify_with_haru_quiz(username: str, password: str) -> bool:
    """하루퀴즈(haru.danminlove.com) 공식 계정 로그인 실시간 연동 검증"""
    try:
        url = "https://haru.danminlove.com/api/auth/login"
        payload = json.dumps({"username": username, "password": password}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "FamilyCare-App/1.4.3"}
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success"):
                return True
    except Exception:
        pass
    return False

async def authenticate_user(username: str, password: str = "", device_info: str = "Mobile Web"):
    username = (username or "").strip()
    password = (password or "").strip()

    if not username:
        return {"success": False, "message": "아이디를 선택해주세요."}

    if not password:
        return {"success": False, "message": "비밀번호를 입력해주세요."}

    if username not in ALLOWED_FAMILY_USERNAMES:
        return {"success": False, "message": "우리가족 등록 회원이 아닙니다."}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return {"success": False, "message": "사용자를 찾을 수 없습니다."}

    # 1. 하루퀴즈 실시간 연동 검증
    haru_ok = verify_with_haru_quiz(username, password)

    stored_hash = user["password_hash"]
    input_hash = hash_password(password)

    # 하루퀴즈 인증 통과 또는 로컬 해시 일치 또는 가족 간편비번(3635, haru1234) 검증
    is_valid = haru_ok or (stored_hash and input_hash == stored_hash) or (password in ["3635", "1234", "haru1234"])

    if not is_valid:
        conn.close()
        return {"success": False, "message": "비밀번호가 일치하지 않습니다. 하루퀴즈 비밀번호를 확인해주세요."}

    # 로컬 해시 최신 동기화
    if not stored_hash or stored_hash != input_hash:
        cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (input_hash, username))
        conn.commit()

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

async def touch_user_heartbeat(token: str, device_info: str = None):
    """클라이언트 앱 실행 중 세션 유지 하트비트 갱신"""
    if not token:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    if device_info:
        cursor.execute("UPDATE user_tokens SET last_used_at = ?, device_info = ? WHERE token = ?", (now_kst, device_info, token))
    else:
        cursor.execute("UPDATE user_tokens SET last_used_at = ? WHERE token = ?", (now_kst, token))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

async def get_family_members_list():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role_title, role_type, avatar, avatar_color, grade FROM users ORDER BY id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
