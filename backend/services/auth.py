import hashlib
import hmac
import secrets
import time
from collections import defaultdict
from datetime import datetime
import zoneinfo
from backend.config import TIMEZONE
from backend.database import get_db_connection, write_audit_log
from backend.http_client import async_http_post_json

KST = zoneinfo.ZoneInfo(TIMEZONE)
SALT = "haru_salt_2026"
ALLOWED_FAMILY_USERNAMES = ["미니미니", "Ljh", "도비사랑녀", "미니미니채"]
ADMIN_USERNAMES = {"미니미니", "단민러브"}

# 로그인 브루트포스 방어 (15분당 최대 10회 실패 허용)
_LOGIN_FAIL_WINDOW_SEC = 900
_LOGIN_MAX_ATTEMPTS = 10
_login_fail_buckets = defaultdict(list)

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_hex(24)

def _check_rate_limit(key: str) -> bool:
    now = time.time()
    recent = [ts for ts in _login_fail_buckets[key] if now - ts < _LOGIN_FAIL_WINDOW_SEC]
    _login_fail_buckets[key] = recent
    return len(recent) >= _LOGIN_MAX_ATTEMPTS

def _record_login_failure(key: str):
    _login_fail_buckets[key].append(time.time())

def _clear_login_failures(key: str):
    _login_fail_buckets.pop(key, None)

async def verify_with_haru_quiz(username: str, password: str) -> bool:
    """하루퀴즈(haru.danminlove.com) 공식 계정 로그인 비블로킹 실시간 연동 검증"""
    try:
        url = "https://haru.danminlove.com/api/auth/login"
        data = await async_http_post_json(
            url,
            {"username": username, "password": password},
            headers={"User-Agent": "FamilyCare-App/1.7.0"},
            timeout=4.0,
        )
        if data.get("success"):
            return True
    except Exception:
        pass
    return False

async def authenticate_user(username: str, password: str = "", device_info: str = "Mobile Web", client_ip: str = "", user_agent: str = ""):
    username = (username or "").strip()
    password = (password or "").strip()

    if not username:
        return {"success": False, "message": "아이디를 선택해주세요."}

    if not password:
        return {"success": False, "message": "비밀번호를 입력해주세요."}

    rate_key = f"{client_ip or 'local'}:{username}"
    if _check_rate_limit(rate_key):
        write_audit_log(username, "LOGIN", "RATE_LIMITED", "15분 내 로그인 실패 한도 초과", client_ip, user_agent)
        return {"success": False, "rate_limited": True, "message": "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요."}

    if username not in ALLOWED_FAMILY_USERNAMES:
        _record_login_failure(rate_key)
        write_audit_log(username, "LOGIN", "FAIL", "미등록 회원 시도", client_ip, user_agent)
        return {"success": False, "message": "우리가족 등록 회원이 아닙니다."}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        _record_login_failure(rate_key)
        write_audit_log(username, "LOGIN", "FAIL", "DB 사용자 없음", client_ip, user_agent)
        return {"success": False, "message": "사용자를 찾을 수 없습니다."}

    # 1. 하루퀴즈 실시간 연동 검증 (비블로킹)
    haru_ok = await verify_with_haru_quiz(username, password)

    stored_hash = user["password_hash"] or ""
    input_hash = hash_password(password)

    # 하루퀴즈 인증 통과 또는 로컬 암호화 해시 상수시간(hmac.compare_digest) 일치 검증
    is_valid = haru_ok or (bool(stored_hash) and hmac.compare_digest(input_hash, stored_hash))

    if not is_valid:
        conn.close()
        _record_login_failure(rate_key)
        write_audit_log(username, "LOGIN", "FAIL", "비밀번호 불일치", client_ip, user_agent)
        return {"success": False, "message": "비밀번호가 일치하지 않습니다. 하루퀴즈 비밀번호를 확인해주세요."}

    _clear_login_failures(rate_key)

    # 로컬 해시 최신 동기화
    if not stored_hash or not hmac.compare_digest(stored_hash, input_hash):
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

    write_audit_log(username, "LOGIN", "SUCCESS", f"device={device_info}", client_ip, user_agent)

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

async def revoke_token(token: str, username: str = "", client_ip: str = "", user_agent: str = "") -> bool:
    """로그아웃 시 서버 DB에서 세션 토큰 즉시 폐기"""
    if not token:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_tokens WHERE token = ?", (token,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    write_audit_log(username or "unknown", "LOGOUT", "SUCCESS" if deleted else "NOOP", "세션 토큰 폐기", client_ip, user_agent)
    return deleted

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
