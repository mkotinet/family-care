from backend.database import get_cached_data, set_cached_data
from backend.mock_data import get_simulated_health_alerts

async def get_health_alerts(lat: float, lon: float):
    cache_key = f"health_alerts_{round(lat, 2)}_{round(lon, 2)}"
    cached = get_cached_data(cache_key)
    if cached:
        return cached

    data = get_simulated_health_alerts()
    set_cached_data(cache_key, data, ttl_seconds=3600)
    return data
