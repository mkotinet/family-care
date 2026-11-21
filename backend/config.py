import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# 포트 및 환경 설정
PORT = int(os.getenv("PORT", 8000))
ENV = os.getenv("ENV", "development")

# 공공데이터포털 및 카카오 API 키 (미설정 시 스마트 시뮬레이션 모드 활성화)
DATA_GO_KR_API_KEY = os.getenv("DATA_GO_KR_API_KEY", "").strip()
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", "").strip()

# 데이터베이스 경로 (도커 볼륨 /app/data 대응)
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "data" / "family_care.db"))

# 기본 위치 설정 (남양주시 평내동 평내유진마젤란아파트)
DEFAULT_LOCATION = {
    "lat": float(os.getenv("DEFAULT_LAT", 37.6434558)),
    "lon": float(os.getenv("DEFAULT_LON", 127.2311716)),
    "address": os.getenv("DEFAULT_ADDRESS", "경기도 남양주시 평내동 평내유진마젤란"),
    "region_name": "남양주시 평내동",
    "grid_x": 64,
    "grid_y": 128
}

APP_TITLE = "우리가족챙기기"
APP_SUBTITLE = "우리 가족 데일리 라이프 & 건강·생활 비서"
TIMEZONE = "Asia/Seoul"
