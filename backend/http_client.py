"""
비블로킹 비동기 HTTP 클라이언트 유틸리티 (표준 라이브러리 기반, 외부 의존성 없음).
FastAPI async def 이벤트 루프 블로킹을 방지하기 위해 urllib.request 호출을 asyncio.to_thread로 오프로딩합니다.
"""
import asyncio
import json
import urllib.request
from typing import Optional


def _sync_get_bytes(url: str, headers: Optional[dict] = None, timeout: float = 5.0) -> bytes:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _sync_post_json(url: str, payload: dict, headers: Optional[dict] = None, timeout: float = 5.0) -> dict:
    merged_headers = {"Content-Type": "application/json"}
    if headers:
        merged_headers.update(headers)
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=merged_headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


async def async_http_get_bytes(url: str, headers: Optional[dict] = None, timeout: float = 5.0) -> bytes:
    return await asyncio.to_thread(_sync_get_bytes, url, headers, timeout)


async def async_http_get_json(url: str, headers: Optional[dict] = None, timeout: float = 5.0) -> dict:
    raw = await asyncio.to_thread(_sync_get_bytes, url, headers, timeout)
    return json.loads(raw.decode("utf-8"))


async def async_http_post_json(url: str, payload: dict, headers: Optional[dict] = None, timeout: float = 5.0) -> dict:
    return await asyncio.to_thread(_sync_post_json, url, payload, headers, timeout)
