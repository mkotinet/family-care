from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_culture

async def get_culture_and_crowd(lat: float, lon: float):
    cache_key = f"culture_crowd_{round(lat, 2)}_{round(lon, 2)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    data = get_simulated_culture()
    set_cached_data(cache_key, data, ttl_seconds=1800)
    return data
