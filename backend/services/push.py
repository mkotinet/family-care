import asyncio
import base64
import json
import logging
from datetime import datetime
from pathlib import Path
import zoneinfo

from backend.config import DB_PATH, TIMEZONE
from backend.database import get_db_connection

KST = zoneinfo.ZoneInfo(TIMEZONE)
logger = logging.getLogger("family_care.push")

try:
    from pywebpush import webpush, WebPushException
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization
    WEBPUSH_AVAILABLE = True
except Exception:
    webpush = None
    WebPushException = Exception
    ec = None
    serialization = None
    WEBPUSH_AVAILABLE = False

_VAPID_CACHE = None

def _vapid_key_file() -> Path:
    return Path(DB_PATH).parent / "vapid_keys.json"

def get_or_create_vapid_keys() -> dict:
    """
    영구 볼륨(/app/data/vapid_keys.json)에 VAPID 키쌍을 1회 생성·보관하여
    컨테이너 재시작 후에도 기존 iOS/Android Web Push 구독이 유지되도록 보장.
    """
    global _VAPID_CACHE
    if _VAPID_CACHE:
        return _VAPID_CACHE

    key_file = _vapid_key_file()
    key_file.parent.mkdir(parents=True, exist_ok=True)

    if key_file.exists():
        try:
            data = json.loads(key_file.read_text(encoding="utf-8"))
            if data.get("private_pem") and data.get("public_key"):
                _VAPID_CACHE = data
                return _VAPID_CACHE
        except Exception:
            pass

    if not WEBPUSH_AVAILABLE or ec is None or serialization is None:
        return {"private_pem": "", "public_key": "", "subject": "mailto:minkim@danminlove.com"}

    private_key = ec.generate_private_key(ec.SECP256R1())
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    pub_bytes = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )
    public_b64url = base64.urlsafe_b64encode(pub_bytes).rstrip(b"=").decode("ascii")

    data = {
        "private_pem": private_pem,
        "public_key": public_b64url,
        "subject": "mailto:minkim@danminlove.com",
        "created_at": datetime.now(KST).isoformat(),
    }
    try:
        key_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as ex:
        logger.warning("Failed to persist VAPID keys: %s", ex)

    _VAPID_CACHE = data
    return data

def get_vapid_public_key() -> str:
    return get_or_create_vapid_keys().get("public_key", "")

def save_push_subscription(username: str, endpoint: str, p256dh: str, auth: str, user_agent: str = "") -> bool:
    if not username or not endpoint or not p256dh or not auth:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    now_kst = datetime.now(KST).isoformat()
    cursor.execute(
        """
        INSERT INTO push_subscriptions (username, endpoint, p256dh, auth, user_agent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
            username = excluded.username,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_agent = excluded.user_agent,
            updated_at = excluded.updated_at
        """,
        (username, endpoint, p256dh, auth, (user_agent or "")[:250], now_kst, now_kst),
    )
    conn.commit()
    conn.close()
    return True

def remove_push_subscription(endpoint: str) -> bool:
    if not endpoint:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_push_subscription_count(username: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM push_subscriptions WHERE username = ?", (username,))
    cnt = cursor.fetchone()[0]
    conn.close()
    return int(cnt)

def _send_single_push_sync(sub_row: dict, payload_str: str, vapid_keys: dict) -> str:
    """동기 pywebpush 실행 (asyncio.to_thread 내부에서 호출). 반환값: 'ok' | 'expired' | 'error'"""
    if not WEBPUSH_AVAILABLE or not webpush or not vapid_keys.get("private_pem"):
        return "error"
    subscription_info = {
        "endpoint": sub_row["endpoint"],
        "keys": {
            "p256dh": sub_row["p256dh"],
            "auth": sub_row["auth"],
        },
    }
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload_str,
            vapid_private_key=vapid_keys["private_pem"],
            vapid_claims={"sub": vapid_keys.get("subject", "mailto:minkim@danminlove.com")},
            ttl=300,
            timeout=6,
        )
        return "ok"
    except WebPushException as ex:
        status_code = getattr(getattr(ex, "response", None), "status_code", None)
        if status_code in (404, 410):
            return "expired"
        logger.warning("WebPushException (status=%s): %s", status_code, ex)
        return "error"
    except Exception as ex:
        logger.warning("WebPush unexpected error: %s", ex)
        return "error"

async def send_web_push_to_user(
    username: str,
    title: str,
    body: str,
    url: str = "/?pwa=1",
    tag: str = "family-care",
    urgency: str = "high",
) -> dict:
    """특정 가족 구성원의 모든 구독 기기(iPhone PWA / Galaxy Chrome)로 Web Push 발송"""
    if not WEBPUSH_AVAILABLE:
        return {"sent": 0, "failed": 0, "total": 0, "available": False}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE username = ?",
        (username,),
    )
    subs = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if not subs:
        return {"sent": 0, "failed": 0, "total": 0, "available": True}

    vapid_keys = get_or_create_vapid_keys()
    payload_str = json.dumps(
        {
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
            "urgency": urgency,
            "ts": datetime.now(KST).isoformat(),
        },
        ensure_ascii=False,
    )

    results = await asyncio.gather(
        *(asyncio.to_thread(_send_single_push_sync, sub, payload_str, vapid_keys) for sub in subs),
        return_exceptions=True,
    )

    sent = 0
    failed = 0
    expired_endpoints = []
    for sub, res in zip(subs, results):
        if res == "ok":
            sent += 1
        elif res == "expired":
            failed += 1
            expired_endpoints.append(sub["endpoint"])
        else:
            failed += 1

    if expired_endpoints:
        for ep in expired_endpoints:
            remove_push_subscription(ep)

    return {"sent": sent, "failed": failed, "total": len(subs), "available": True}

async def send_web_push_to_users(
    usernames: list,
    title: str,
    body: str,
    url: str = "/?pwa=1",
    tag: str = "family-care",
) -> dict:
    if not usernames or not WEBPUSH_AVAILABLE:
        return {"sent": 0, "failed": 0, "total": 0}
    res_list = await asyncio.gather(
        *(send_web_push_to_user(u, title, body, url=url, tag=tag) for u in usernames),
        return_exceptions=True,
    )
    sent = sum(r.get("sent", 0) for r in res_list if isinstance(r, dict))
    failed = sum(r.get("failed", 0) for r in res_list if isinstance(r, dict))
    total = sum(r.get("total", 0) for r in res_list if isinstance(r, dict))
    return {"sent": sent, "failed": failed, "total": total}
