import os
from pathlib import Path
from datetime import datetime
import zoneinfo
from fastapi import FastAPI, Request, Query, Body
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import DEFAULT_LOCATION, APP_TITLE, APP_SUBTITLE, TIMEZONE, PORT
from backend.database import init_db, get_db_connection
from backend.services.weather import get_weather_data
from backend.services.transit import get_transit_routes, add_favorite_route
from backend.services.hospital import get_hospital_pharmacy_info
from backend.services.restaurant import get_favorite_restaurants, add_favorite_restaurant, search_places_kakao
from backend.services.health import get_health_alerts
from backend.services.culture import get_culture_and_crowd

KST = zoneinfo.ZoneInfo(TIMEZONE)

app = FastAPI(title=APP_TITLE, description=APP_SUBTITLE)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 초기화
init_db()

# 정적 파일 마운트
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h3>우리가족챙기기 웹앱 초기화 중입니다...</h3>")

@app.get("/api/healthz")
async def health_check():
    """도커 및 포테이너 헬스체크용 엔드포인트"""
    return {
        "status": "healthy",
        "app": APP_TITLE,
        "time": datetime.now(KST).isoformat(),
        "timezone": TIMEZONE
    }

@app.get("/api/init")
async def get_app_init():
    """앱 첫 로딩 시 가족 정보, 기본 위치, 현재 시간(KST) 전달"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM family_members ORDER BY id ASC")
    members = [dict(row) for row in cursor.fetchall()]
    conn.close()

    now_kst = datetime.now(KST)
    return {
        "app_title": APP_TITLE,
        "app_subtitle": APP_SUBTITLE,
        "default_location": DEFAULT_LOCATION,
        "family_members": members,
        "server_time": now_kst.isoformat(),
        "kst_date_string": now_kst.strftime("%Y년 %m월 %d일"),
        "kst_day_name": ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"][now_kst.weekday()],
        "is_weekend": now_kst.weekday() >= 5
    }

# 1. 날씨 & 미세먼지 & 옷차림
@app.get("/api/weather")
async def api_weather(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_weather_data(lat, lon)
    return data

# 2. 교통 & 실시간 루트
@app.get("/api/transit")
async def api_transit():
    data = await get_transit_routes()
    return data

@app.post("/api/transit/add")
async def api_transit_add(payload: dict = Body(...)):
    await add_favorite_route(
        title=payload.get("title", "새 루트"),
        transit_type=payload.get("transit_type", "BUS"),
        station_name=payload.get("station_name", "정류장"),
        route_no=payload.get("route_no", "100"),
        target_destination=payload.get("target_destination", "시내방면"),
        member_id=int(payload.get("member_id", 1))
    )
    return {"success": True}

# 3. 휴일/주말 문 연 병원 & 약국
@app.get("/api/hospital")
async def api_hospital(lat: float = Query(None), lon: float = Query(None), filter_type: str = Query("ALL")):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_hospital_pharmacy_info(lat, lon, filter_type)
    return data

# 4. 단골 식당 & 주말 영업
@app.get("/api/restaurant")
async def api_restaurant():
    data = await get_favorite_restaurants()
    return data

@app.post("/api/restaurant/add")
async def api_restaurant_add(payload: dict = Body(...)):
    await add_favorite_restaurant(
        name=payload.get("name"),
        category=payload.get("category", "한식"),
        phone=payload.get("phone", ""),
        address=payload.get("address", ""),
        business_hours=payload.get("business_hours", "11:00 ~ 21:00"),
        closed_days=payload.get("closed_days", "연중무휴"),
        family_note=payload.get("family_note", "")
    )
    return {"success": True}

@app.get("/api/restaurant/search")
async def api_restaurant_search(query: str = Query(...), lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    results = await search_places_kakao(query, lat, lon)
    return results

# 5. 건강 & 감염병 예보
@app.get("/api/health")
async def api_health(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_health_alerts(lat, lon)
    return data

# 6. 축제 & 붐빔(혼잡도)
@app.get("/api/culture")
async def api_culture(lat: float = Query(None), lon: float = Query(None)):
    lat = lat if lat is not None else DEFAULT_LOCATION["lat"]
    lon = lon if lon is not None else DEFAULT_LOCATION["lon"]
    data = await get_culture_and_crowd(lat, lon)
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=True)
