import math

# 기상청 Lambert Conformal Conic 투영법 변환 계수
RE = 6371.00877     # 지구 반경(km)
GRID = 5.0          # 격자 간격(km)
SLAT1 = 30.0        # 투영 위도1(degree)
SLAT2 = 60.0        # 투영 위도2(degree)
OLON = 126.0        # 기준점 경도(degree)
OLAT = 38.0         # 기준점 위도(degree)
XO = 43             # 기준점 X좌표(GRID)
YO = 136            # 기준점 Y좌표(GRID)

def wgs84_to_kma_grid(lat: float, lon: float):
    """
    WGS84 위도/경도를 기상청 단기예보 격자 X, Y 좌표로 변환
    """
    DEGRAD = math.pi / 180.0
    re = RE / GRID
    slat1 = SLAT1 * DEGRAD
    slat2 = SLAT2 * DEGRAD
    olon = OLON * DEGRAD
    olat = OLAT * DEGRAD

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)

    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = lon * DEGRAD - olon
    if theta > math.pi:
        theta -= 2.0 * math.pi
    if theta < -math.pi:
        theta += 2.0 * math.pi
    theta *= sn
    x = math.floor(ra * math.sin(theta) + XO + 0.5)
    y = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
    return int(x), int(y)

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    두 위경도 지점 사이의 대원 거리(km) 계산 (Haversine 공식)
    """
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    두 위경도 지점 사이의 거리(미터) 계산
    """
    return calculate_distance_km(lat1, lon1, lat2, lon2) * 1000.0
