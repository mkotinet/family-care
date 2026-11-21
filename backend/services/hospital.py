from backend.config import DATA_GO_KR_API_KEY
from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_hospitals

async def get_hospital_pharmacy_info(lat: float, lon: float, filter_type: str = "ALL"):
    cache_key = f"hospitals_{round(lat, 3)}_{round(lon, 3)}_{filter_type}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    # 실제 공공데이터 키 유무에 따른 분기 (현재 시뮬레이션 기반 스마트 데이터 반환)
    base_data = get_simulated_hospitals()
    items = base_data.get("items", [])

    if filter_type == "PHARMACY":
        items = [x for x in items if x["type"] == "약국"]
    elif filter_type == "CHILDREN":
        items = [x for x in items if "소아" in x["type"] or x.get("badge") == "달빛어린이병원"]
    elif filter_type == "OPEN_NOW":
        items = [x for x in items if x.get("is_open_now")]

    result = {
        "summary": base_data["summary"],
        "is_weekend": base_data["is_weekend"],
        "filter": filter_type,
        "items": items
    }

    set_cached_data(cache_key, result, ttl_seconds=1800)
    return result
