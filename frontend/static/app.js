/**
 * 우리가족챙기기 (Family Care) - 메인 프론트엔드 엔진
 * 기능: 날씨 상세 타임라인, 카카오 지도 연동, 4인 가족 인증(하루퀴즈 연동), 실시간 아이 안심위치, 가족 전용 채팅방
 */

// 전역 상태
const AppState = {
  currentUser: null,       // 현재 로그인 유저 { username, name, role_title, role_type, avatar }
  token: null,
  familyMembers: [],       // 4인 공식 가족 회원
  location: {
    lat: 37.6434558,
    lon: 127.2311716,
    address: "남양주시 평내동 평내유진마젤란"
  },
  weatherData: null,
  weatherTab: "hourly",
  currentCategory: null,
  detailViewMode: "list",  // 'list' or 'map'
  kakaoCategoryMap: null,
  categoryMarkers: [],
  kakaoSafetyMap: null,
  safetyMarkers: [],
  currentChatRoom: "family_all",
  chatPollingTimer: null,
  selectedLoginUser: "미니미니"
};

// ==========================================
// 1. 초기화 및 세션 관리
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initClock();
  setupMobileLifecycle();
  await loadStoredSession();
  await initApp();

  // 자녀 계정일 경우 자동 GPS 위치 추적 리포트 가동
  if (AppState.currentUser && AppState.currentUser.role_type === "CHILD") {
    startChildLocationTracker();
  }
});

// 시계 가동
function initClock() {
  const clockEl = document.getElementById("kstClock");
  function update() {
    const now = new Date();
    const kstTime = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul"
    }).format(now);
    if (clockEl) clockEl.textContent = `${kstTime} KST`;
  }
  update();
  setInterval(update, 10000);
}

// 모바일 BFCache 및 백그라운드 복귀 대응 (Rule 5)
function setupMobileLifecycle() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshData();
    }
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      refreshData();
    }
  });
}

// 저장된 세션 로드 (하루퀴즈 토큰 호환 / Rule 9)
async function loadStoredSession() {
  const storedToken = localStorage.getItem("fc_token");
  const storedUser = localStorage.getItem("fc_user");

  if (storedToken && storedUser) {
    try {
      AppState.token = storedToken;
      AppState.currentUser = JSON.parse(storedUser);
      updateHeaderUserUI();
      return;
    } catch (e) {}
  }

  // 기본 기본값: 미니미니(아빠) 자동 세션
  AppState.currentUser = {
    username: "미니미니",
    name: "미니미니",
    role_title: "아빠",
    role_type: "PARENT",
    avatar: "🐶",
    avatar_color: "#3b82f6"
  };
  localStorage.setItem("fc_user", JSON.stringify(AppState.currentUser));
  updateHeaderUserUI();
}

function updateHeaderUserUI() {
  const u = AppState.currentUser;
  if (!u) return;
  const avatarEl = document.getElementById("headerUserAvatar");
  const nameEl = document.getElementById("headerUserName");
  if (avatarEl) avatarEl.textContent = u.avatar || "👤";
  if (nameEl) nameEl.textContent = `${u.name} (${u.role_title})`;

  // 부모 여부에 따라 안심위치 버튼 및 배너 표시 제어
  const safetyBtn = document.getElementById("btnOpenSafetyMap");
  const safetyBanner = document.getElementById("childSafetyBanner");
  if (u.role_type === "PARENT") {
    if (safetyBtn) safetyBtn.style.display = "inline-flex";
    if (safetyBanner) safetyBanner.style.display = "flex";
  } else {
    if (safetyBtn) safetyBtn.style.display = "none";
    if (safetyBanner) safetyBanner.style.display = "none";
  }
}

// 메인 앱 초기화
async function initApp() {
  try {
    const headers = AppState.token ? { Authorization: `Bearer ${AppState.token}` } : {};
    const res = await fetch("/api/init", { headers });
    const data = await res.json();

    AppState.familyMembers = data.family_members || [];
    if (data.default_location) {
      AppState.location = data.default_location;
    }

    // 4인 가족 정보 렌더링
    renderFamilyLoginGrid();

    // 초기 데이터 로딩
    await Promise.all([
      loadWeather(),
      loadFavorites(),
      checkChildSafetySummary()
    ]);
  } catch (e) {
    console.error("App init error:", e);
  }
}

async function refreshData() {
  await Promise.all([
    loadWeather(),
    loadFavorites(),
    checkChildSafetySummary()
  ]);
}

// ==========================================
// 2. 날씨 상세 타임라인 (1시간 / 3시간 / 이번 주)
// ==========================================
async function loadWeather() {
  try {
    const res = await fetch(`/api/weather?lat=${AppState.location.lat}&lon=${AppState.location.lon}`);
    const data = await res.json();
    AppState.weatherData = data;

    // 헤더/요약 카드
    document.getElementById("currentTemp").textContent = `${data.temp}℃`;
    document.getElementById("tempRange").textContent = `최저 ${data.temp_min}℃ / 최고 ${data.temp_max}℃ (체감 ${data.feels_like}℃)`;
    document.getElementById("weatherIcon").textContent = data.weather_icon || "🌤️";
    document.getElementById("badgeRain").textContent = `강수확률 ${data.rain_prob}%`;
    document.getElementById("badgeAir").textContent = `미세먼지 ${data.dust_status || "보통"}`;

    const umbrellaEl = document.getElementById("badgeUmbrella");
    if (data.umbrella_needed) {
      umbrellaEl.textContent = "☂️ 우산 챙기세요!";
      umbrellaEl.className = "badge badge-umbrella-yes";
    } else {
      umbrellaEl.textContent = "☂️ 우산 불필요";
      umbrellaEl.className = "badge badge-umbrella-no";
    }

    document.getElementById("outfitIcon").textContent = data.outfit_icon || "🧥";
    document.getElementById("outfitText").textContent = data.outfit_recommendation || "외출하기 좋은 포근한 날씨입니다.";

    // 3단 탭 타임라인 렌더링
    renderWeatherTimelines(data);
  } catch (e) {
    console.error("Weather load error:", e);
  }
}

function renderWeatherTimelines(data) {
  // 1) 1시간별 예보
  const hourlyEl = document.getElementById("hourlyList");
  if (hourlyEl && data.hourly) {
    hourlyEl.innerHTML = data.hourly.map(h => `
      <div class="hour-card">
        <span class="hour-time">${h.time}</span>
        <span class="hour-icon">${h.icon}</span>
        <span class="hour-temp">${h.temp}℃</span>
        <span class="hour-pop">${h.pop > 0 ? h.pop + '%' : '-'}</span>
      </div>
    `).join("");
  }

  // 2) 3시간별 예보
  const threeHourlyEl = document.getElementById("threeHourlyList");
  if (threeHourlyEl && data.three_hourly) {
    threeHourlyEl.innerHTML = data.three_hourly.map(th => `
      <div class="hour-card" style="flex: 0 0 72px;">
        <span class="hour-time">${th.day} ${th.time}</span>
        <span class="hour-icon">${th.icon}</span>
        <span class="hour-temp">${th.temp}℃</span>
        <span class="hour-pop">💧${th.pop}%</span>
      </div>
    `).join("");
  }

  // 3) 이번 주 요일별 예보
  const weeklyEl = document.getElementById("weeklyList");
  if (weeklyEl && data.weekly) {
    weeklyEl.innerHTML = data.weekly.map(w => `
      <div class="weekly-row">
        <span class="weekly-day ${w.is_today ? 'today' : (w.is_weekend ? 'weekend' : '')}">
          ${w.is_today ? '오늘' : w.day_name + '요일'} (${w.date})
        </span>
        <div class="weekly-weather">
          <span>${w.icon}</span>
          <span>${w.desc}</span>
          ${w.rain_prob >= 30 ? `<span style="font-size: 10px; color: #0284c7;">💧${w.rain_prob}%</span>` : ''}
        </div>
        <div class="weekly-temps">
          <span class="t-min">${w.temp_min}℃</span> / <span class="t-max">${w.temp_max}℃</span>
        </div>
      </div>
    `).join("");
  }
}

function switchWeatherTab(tab) {
  AppState.weatherTab = tab;
  document.getElementById("tabHourly").className = `w-tab-btn ${tab === 'hourly' ? 'active' : ''}`;
  document.getElementById("tabThreeHourly").className = `w-tab-btn ${tab === 'three_hourly' ? 'active' : ''}`;
  document.getElementById("tabWeekly").className = `w-tab-btn ${tab === 'weekly' ? 'active' : ''}`;

  document.getElementById("viewHourly").className = `weather-scroll-view ${tab === 'hourly' ? 'active' : ''}`;
  document.getElementById("viewThreeHourly").className = `weather-scroll-view ${tab === 'three_hourly' ? 'active' : ''}`;
  document.getElementById("viewWeekly").className = `weather-scroll-view ${tab === 'weekly' ? 'active' : ''}`;
}

// ==========================================
// 3. 우리 가족 즐겨찾기 퀵뷰
// ==========================================
async function loadFavorites() {
  const container = document.getElementById("favoritesQuickList");
  if (!container) return;

  try {
    const [transitRes, restRes, placesRes] = await Promise.all([
      fetch("/api/transit"),
      fetch("/api/restaurant"),
      fetch("/api/places/favorites")
    ]);

    const transit = await transitRes.json();
    const restaurants = await restRes.json();
    const places = await placesRes.json();

    const items = [];

    // 교통 즐겨찾기
    transit.forEach(t => {
      items.push(`
        <div class="fav-card" onclick="openCategoryDetail('transit')">
          <div class="fav-card-top">
            <span class="fav-card-tag" style="background: #e0f2fe; color: #0369a1;">🚌 ${t.route_no}</span>
            <span style="font-size: 10px; color: #64748b;">${t.station_name}</span>
          </div>
          <div>
            <div class="fav-card-title">${t.title}</div>
            <div class="fav-card-sub">${t.destination} 방면</div>
          </div>
          <div class="fav-card-highlight" style="color: ${t.badge_color};">
            ${t.remain_time}
          </div>
        </div>
      `);
    });

    // 단골 식당
    restaurants.forEach(r => {
      items.push(`
        <div class="fav-card" onclick="openCategoryDetail('restaurant')">
          <div class="fav-card-top">
            <span class="fav-card-tag" style="background: #ffedd5; color: #c2410c;">🍽️ ${r.category}</span>
            <span style="font-size: 10px; color: #64748b;">${r.distance_meters}m</span>
          </div>
          <div>
            <div class="fav-card-title">${r.name}</div>
            <div class="fav-card-sub">${r.family_note || r.address}</div>
          </div>
          <div class="fav-card-highlight" style="font-size: 11px; color: #16a34a;">
            ${r.status_badge}
          </div>
        </div>
      `);
    });

    // 지도에서 추가한 장소
    places.forEach(p => {
      items.push(`
        <div class="fav-card" onclick="openCategoryDetail('${p.category === '약국' || p.category === '병원' ? 'hospital' : (p.category === '식당' ? 'restaurant' : 'culture')}')">
          <div class="fav-card-top">
            <span class="fav-card-tag" style="background: #f1f5f9; color: #334155;">⭐ ${p.category}</span>
          </div>
          <div>
            <div class="fav-card-title">${p.name}</div>
            <div class="fav-card-sub">${p.address || ''}</div>
          </div>
          <div class="fav-card-highlight" style="font-size: 11px; color: #0284c7;">
            ${p.status_info || '즐겨찾기 저장됨'}
          </div>
        </div>
      `);
    });

    container.innerHTML = items.length > 0 ? items.join("") : `
      <div style="padding: 16px; color: #94a3b8; font-size: 13px;">
        등록된 즐겨찾기가 없습니다. 아래 카테고리에서 즐겨찾기를 추가해 보세요! ⭐
      </div>
    `;
  } catch (e) {
    console.error("Favorites load error:", e);
  }
}

// ==========================================
// 4. 카테고리 상세 바텀 시트 & 카카오맵 연동
// ==========================================
async function openCategoryDetail(cat) {
  AppState.currentCategory = cat;
  AppState.detailViewMode = "list";

  const backdrop = document.getElementById("sheetBackdrop");
  const titleEl = document.getElementById("sheetTitle");
  const subEl = document.getElementById("sheetSubtitle");
  const contentEl = document.getElementById("sheetContent");
  const togglePills = document.getElementById("viewTogglePills");
  const mapWrapper = document.getElementById("sheetMapWrapper");

  backdrop.className = "detail-sheet-backdrop active";
  mapWrapper.style.display = "none";
  contentEl.innerHTML = '<div style="padding: 24px; text-align: center; color: #64748b;">정보를 불러오는 중입니다... 🌿</div>';

  // 위치 기반 카드(교통, 식당, 병원, 축제)일 경우 목록/지도 토글 스위치 활성화
  if (["transit", "restaurant", "hospital", "culture"].includes(cat)) {
    togglePills.style.display = "flex";
    document.getElementById("btnViewList").className = "toggle-btn active";
    document.getElementById("btnViewMap").className = "toggle-btn";
  } else {
    togglePills.style.display = "none";
  }

  if (cat === "weather") {
    titleEl.textContent = "🌤️ 상세 날씨 & 7일간 예보";
    subEl.textContent = "기상청 단기예보 & 초단기실황 실시간 연동";
    renderWeatherDetail(contentEl);
  } else if (cat === "transit") {
    titleEl.textContent = "🚌 실시간 교통 & 노선 도착 알림";
    subEl.textContent = "국토교통부 TAGO 버스 도착 정보 & 정류소 지도 검색";
    await renderTransitDetail(contentEl);
  } else if (cat === "hospital") {
    titleEl.textContent = "🏥 병원 & 당번약국 실시간 현황";
    subEl.textContent = "국립중앙의료원(E-Gen) 연동: 평내·호평 주말/야간 진료";
    await renderHospitalDetail(contentEl);
  } else if (cat === "restaurant") {
    titleEl.textContent = "🍽️ 식당 & 주말외식 / 단골맛집";
    subEl.textContent = "카카오 로컬 API 평내유진마젤란 인근 맛집 실시간 검색";
    await renderRestaurantDetail(contentEl);
  } else if (cat === "culture") {
    titleEl.textContent = "🎪 축제 · 주말나들이 & 붐빔예측";
    subEl.textContent = "한국관광공사 TourAPI 4.0 연동 행사 및 상권 혼잡도";
    await renderCultureDetail(contentEl);
  } else if (cat === "health") {
    titleEl.textContent = "🌸 알레르기 & 감염병 통합 예보";
    subEl.textContent = "기상청 꽃가루 지수 & 대기질 연계 건강 알람";
    await renderHealthDetail(contentEl);
  }
}

function closeCategoryDetail(e) {
  if (e && e.target && e.target.id !== "sheetBackdrop" && !e.target.classList.contains("sheet-close-btn")) {
    return;
  }
  document.getElementById("sheetBackdrop").className = "detail-sheet-backdrop";
}

// 목록 ↔ 지도 토글 스위칭
function switchDetailView(mode) {
  AppState.detailViewMode = mode;
  const mapWrapper = document.getElementById("sheetMapWrapper");
  const contentEl = document.getElementById("sheetContent");

  document.getElementById("btnViewList").className = `toggle-btn ${mode === 'list' ? 'active' : ''}`;
  document.getElementById("btnViewMap").className = `toggle-btn ${mode === 'map' ? 'active' : ''}`;

  if (mode === "map") {
    mapWrapper.style.display = "block";
    contentEl.style.display = "flex";
    initCategoryKakaoMap();
  } else {
    mapWrapper.style.display = "none";
    contentEl.style.display = "flex";
  }
}

// 카카오 지도 렌더러
function initCategoryKakaoMap() {
  if (typeof kakao === "undefined" || !kakao.maps) {
    document.getElementById("kakaoCategoryMap").innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b;">카카오맵 SDK를 로딩 중입니다...</div>';
    return;
  }

  const container = document.getElementById("kakaoCategoryMap");
  const options = {
    center: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    level: 4
  };

  AppState.kakaoCategoryMap = new kakao.maps.Map(container, options);

  // 내 거점 (평내유진마젤란) 중심 마커
  const homeMarker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    map: AppState.kakaoCategoryMap
  });

  const homeOverlay = new kakao.maps.CustomOverlay({
    position: homeMarker.getPosition(),
    content: '<div style="padding: 4px 8px; background: #0f172a; color: white; font-size: 11px; font-weight: 800; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">🏡 우리 집</div>',
    yAnchor: 2.2
  });
  homeOverlay.setMap(AppState.kakaoCategoryMap);

  // 카테고리별 마커 렌더링
  renderCategoryMarkersOnMap();

  setTimeout(() => {
    AppState.kakaoCategoryMap.relayout();
    AppState.kakaoCategoryMap.setCenter(new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon));
  }, 100);
}

function renderCategoryMarkersOnMap() {
  if (!AppState.kakaoCategoryMap) return;

  // 기존 마커 제거
  AppState.categoryMarkers.forEach(m => m.setMap(null));
  AppState.categoryMarkers = [];

  const cat = AppState.currentCategory;

  if (cat === "restaurant" && AppState.cachedPlaces) {
    AppState.cachedPlaces.forEach(p => {
      if (p.distance_meters) {
        // 좌표가 없는 경우 약간의 오프셋으로 매핑 또는 로컬 지오코딩
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(AppState.location.lat + (Math.random() - 0.5) * 0.008, AppState.location.lon + (Math.random() - 0.5) * 0.008),
          map: AppState.kakaoCategoryMap
        });
        AppState.categoryMarkers.push(marker);

        kakao.maps.event.addListener(marker, "click", () => {
          quickAddFavoritePlace("식당", p.name, p.address, p.phone, p.status_badge);
        });
      }
    });
  } else if (cat === "hospital" && AppState.cachedHospitals) {
    AppState.cachedHospitals.forEach(h => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(AppState.location.lat + (Math.random() - 0.5) * 0.006, AppState.location.lon + (Math.random() - 0.5) * 0.006),
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      kakao.maps.event.addListener(marker, "click", () => {
        quickAddFavoritePlace(h.type, h.name, h.address, h.phone, h.status_badge);
      });
    });
  }
}

// ==========================================
// 카테고리별 상세 렌더러 함수들
// ==========================================
function renderWeatherDetail(el) {
  const d = AppState.weatherData;
  if (!d) return;

  el.innerHTML = `
    <div style="background: #f0f9ff; padding: 14px; border-radius: 14px; border: 1px solid #bae6fd; margin-bottom: 12px;">
      <div style="font-size: 13px; font-weight: 800; color: #0369a1; margin-bottom: 4px;">👔 오늘 외출 옷차림 추천</div>
      <div style="font-size: 12px; color: #334155; line-height: 1.5;">${d.outfit_recommendation}</div>
    </div>

    <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">⏱️ 향후 16시간 상세 예보</div>
    <div class="weather-hourly-list" style="margin-bottom: 16px;">
      ${(d.hourly || []).map(h => `
        <div class="hour-card">
          <span class="hour-time">${h.time}</span>
          <span class="hour-icon">${h.icon}</span>
          <span class="hour-temp">${h.temp}℃</span>
          <span class="hour-pop">${h.pop > 0 ? h.pop + '%' : '-'}</span>
        </div>
      `).join("")}
    </div>

    <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">📅 이번 주 요일별 예보</div>
    <div class="weather-weekly-list">
      ${(d.weekly || []).map(w => `
        <div class="weekly-row">
          <span class="weekly-day ${w.is_today ? 'today' : (w.is_weekend ? 'weekend' : '')}">
            ${w.is_today ? '오늘' : w.day_name + '요일'} (${w.date})
          </span>
          <div class="weekly-weather">
            <span>${w.icon}</span>
            <span>${w.desc}</span>
            ${w.rain_prob >= 30 ? `<span style="font-size: 10px; color: #0284c7;">💧${w.rain_prob}%</span>` : ''}
          </div>
          <div class="weekly-temps">
            <span class="t-min">${w.temp_min}℃</span> / <span class="t-max">${w.temp_max}℃</span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderTransitDetail(el) {
  const [res, stopsRes] = await Promise.all([
    fetch("/api/transit"),
    fetch("/api/transit/nearby-stops")
  ]);
  const routes = await res.json();
  const stops = await stopsRes.json();

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 13px; font-weight: 800;">📍 내 주변 버스 정류소 (출발지 선택)</span>
      <button class="btn-mini btn-fav" onclick="openRouteModal()">+ 새 루트 등록</button>
    </div>

    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 14px;">
      ${stops.map(s => `
        <div style="flex: 0 0 auto; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 6px 10px; font-size: 11px; cursor: pointer;" onclick="selectStartStation('${s.name}')">
          🚏 <strong>${s.name}</strong> (${s.distance}m)
        </div>
      `).join("")}
    </div>

    <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">🚌 실시간 등록 루트 도착 현황</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${routes.map(r => `
        <div class="item-card">
          <div class="item-card-top">
            <span class="item-name">${r.title} (${r.route_no})</span>
            <span class="item-badge" style="background: ${r.badge_color}; color: white;">${r.remain_time}</span>
          </div>
          <div class="item-desc">📍 ${r.station_name} ➔ ${r.destination}</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 700;">${r.remain_stops}</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderHospitalDetail(el) {
  const res = await fetch("/api/hospital");
  const data = await res.json();
  AppState.cachedHospitals = data.items || [];

  el.innerHTML = `
    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <button class="btn-mini" style="background: #e2e8f0;" onclick="filterHospitalList('ALL')">전체</button>
      <button class="btn-mini" style="background: #ecfdf5; color: #059669;" onclick="filterHospitalList('PHARMACY')">약국만</button>
      <button class="btn-mini" style="background: #fdf2f8; color: #db2777;" onclick="filterHospitalList('CHILDREN')">소아과/달빛</button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${(data.items || []).map(h => `
        <div class="item-card">
          <div class="item-card-top">
            <span class="item-name">${h.name}</span>
            <span class="item-badge" style="background: ${h.badge_color}; color: white;">${h.badge}</span>
          </div>
          <div class="item-desc">주말: ${h.weekend_info}</div>
          <div class="item-desc" style="color: #64748b; font-size: 11px;">📍 ${h.address}</div>
          <div class="item-action-row">
            <span style="font-size: 11px; font-weight: 800; color: #16a34a; align-self: center;">${h.status_badge}</span>
            <button class="btn-mini btn-fav" onclick="quickAddFavoritePlace('${h.type}', '${h.name}', '${h.address}', '${h.phone}', '${h.status_badge}')">⭐ 즐겨찾기</button>
            <a href="tel:${h.phone}" class="btn-mini btn-call">📞 전화</a>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderRestaurantDetail(el) {
  const res = await fetch("/api/restaurant/search?query=맛집");
  const places = await res.json();
  AppState.cachedPlaces = places;

  el.innerHTML = `
    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <input type="text" id="inputSearchRestQuery" placeholder="식당 또는 음식 검색 (예: 갈비, 파스타, 카페)" style="flex: 1; padding: 8px 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 12px;">
      <button onclick="executeRestSearch()" class="btn-mini" style="background: #0ea5e9; color: white;">검색</button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${places.map(p => `
        <div class="item-card">
          <div class="item-card-top">
            <span class="item-name">${p.name}</span>
            <span class="item-badge" style="background: #ffedd5; color: #c2410c;">${p.category}</span>
          </div>
          <div class="item-desc">📍 ${p.address} (${p.distance})</div>
          <div class="item-action-row">
            <span style="font-size: 11px; font-weight: 800; color: #16a34a; align-self: center;">${p.status_badge}</span>
            <button class="btn-mini btn-fav" onclick="quickAddFavoritePlace('식당', '${p.name}', '${p.address}', '${p.phone}', '${p.status_badge}')">⭐ 단골 등록</button>
            ${p.phone ? `<a href="tel:${p.phone}" class="btn-mini btn-call">📞 전화</a>` : ''}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderCultureDetail(el) {
  const res = await fetch("/api/culture");
  const data = await res.json();

  el.innerHTML = `
    <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">🚦 주말 핫스팟 붐빔 예측 신호등</div>
    <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
      ${(data.crowd_spots || []).map(s => `
        <div class="weekly-row">
          <span style="font-size: 12px; font-weight: 800;">${s.spot_name}</span>
          <span style="font-size: 11px; font-weight: 700;">${s.level_badge}</span>
        </div>
      `).join("")}
    </div>

    <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">🎪 당월 지역 축제 & 나들이</div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${(data.festivals || []).map(f => `
        <div class="item-card">
          <div class="item-card-top">
            <span class="item-name">${f.title}</span>
            <span class="item-badge" style="background: #fef3c7; color: #b45309;">${f.expected_crowd}</span>
          </div>
          <div class="item-desc">기간: ${f.period}</div>
          <div class="item-desc" style="color: #64748b; font-size: 11px;">📍 ${f.location}</div>
          <div class="item-action-row">
            <button class="btn-mini btn-fav" onclick="quickAddFavoritePlace('축제', '${f.title}', '${f.location}', '', '${f.period}')">⭐ 축제 찜하기</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderHealthDetail(el) {
  const res = await fetch("/api/health");
  const data = await res.json();

  el.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${(data.alerts || []).map(a => `
        <div class="item-card" style="border-left: 4px solid ${a.badge_color};">
          <div class="item-card-top">
            <span class="item-name">${a.title}</span>
            <span class="item-badge" style="background: ${a.badge_color}; color: white;">${a.badge}</span>
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.5; margin-top: 4px;">
            ${a.action_guide}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// 즐겨찾기 즉시 저장 헬퍼
async function quickAddFavoritePlace(category, name, address, phone, status_info) {
  try {
    const res = await fetch("/api/places/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_username: AppState.currentUser ? AppState.currentUser.username : "미니미니",
        category,
        name,
        address,
        phone,
        status_info,
        latitude: AppState.location.lat,
        longitude: AppState.location.lon
      })
    });
    const d = await res.json();
    alert(`⭐ '${name}' 항목이 우리 가족 즐겨찾기에 등록되었습니다!`);
    loadFavorites();
  } catch (e) {
    alert("즐겨찾기 저장 중 오류가 발생했습니다.");
  }
}

// ==========================================
// 5. 아이들 실시간 안심 위치 추적 모달 (부모 전용)
// ==========================================
async function checkChildSafetySummary() {
  if (!AppState.currentUser || AppState.currentUser.role_type !== "PARENT") return;
  try {
    const res = await fetch("/api/location/family");
    const data = await res.json();
    const children = data.children || [];

    const titleEl = document.getElementById("safetyBannerTitle");
    const subEl = document.getElementById("safetyBannerSub");

    if (children.length > 0) {
      const summaryTexts = children.map(c => `${c.role_title}(${c.name}): ${c.landmark || '위치 확인됨'}`);
      if (titleEl) titleEl.textContent = `우리 아이 안심 위치 (${children.length}명)`;
      if (subEl) subEl.textContent = summaryTexts.join(" | ");
    }
  } catch (e) {}
}

async function openSafetyModal() {
  const modal = document.getElementById("modalSafetyMap");
  modal.className = "modal-overlay active";

  try {
    const res = await fetch("/api/location/family");
    const data = await res.json();
    const children = data.children || [];

    // 아이들 위치 카드 렌더링
    const listEl = document.getElementById("safetyChildrenList");
    listEl.innerHTML = children.map(c => `
      <div class="item-card" style="margin-top: 8px; border: 1.5px solid #bbf7d0; background: #f0fdf4;">
        <div class="item-card-top">
          <span class="item-name" style="color: #166534;">${c.avatar} ${c.role_title} (${c.name})</span>
          <span class="item-badge" style="background: #10b981; color: white;">${c.status_badge}</span>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #1e293b; margin: 4px 0;">📍 ${c.landmark || c.address}</div>
        <div style="font-size: 11px; color: #64748b;">
          갱신: ${c.updated_at} | 🔋 배터리: ${c.battery_level}% | ${c.is_moving ? '🏃 이동 중' : '🛑 정지'}
        </div>
      </div>
    `).join("");

    // 지도 렌더링
    setTimeout(() => {
      initSafetyKakaoMap(children);
    }, 150);
  } catch (e) {
    console.error("Safety map load error:", e);
  }
}

function closeSafetyModal(e) {
  if (e && e.target && e.target.id !== "modalSafetyMap" && !e.target.classList.contains("sheet-close-btn") && !e.target.classList.contains("btn-secondary")) {
    return;
  }
  document.getElementById("modalSafetyMap").className = "modal-overlay";
}

function initSafetyKakaoMap(children) {
  if (typeof kakao === "undefined" || !kakao.maps) return;

  const container = document.getElementById("kakaoSafetyMap");
  const options = {
    center: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    level: 4
  };

  AppState.kakaoSafetyMap = new kakao.maps.Map(container, options);

  // 집 마커
  const homeMarker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    map: AppState.kakaoSafetyMap
  });
  new kakao.maps.CustomOverlay({
    position: homeMarker.getPosition(),
    content: '<div style="padding: 4px 8px; background: #0f172a; color: white; font-size: 11px; font-weight: 800; border-radius: 8px;">🏡 집</div>',
    yAnchor: 2.2,
    map: AppState.kakaoSafetyMap
  });

  // 아이들 마커
  children.forEach(c => {
    const cMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(c.latitude, c.longitude),
      map: AppState.kakaoSafetyMap
    });
    new kakao.maps.CustomOverlay({
      position: cMarker.getPosition(),
      content: `<div style="padding: 4px 8px; background: #ec4899; color: white; font-size: 11px; font-weight: 800; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${c.avatar} ${c.name}</div>`,
      yAnchor: 2.2,
      map: AppState.kakaoSafetyMap
    });
  });

  AppState.kakaoSafetyMap.relayout();
}

// 자녀 스마트폰에서 백그라운드 GPS 위치 자동 전송
function startChildLocationTracker() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      try {
        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: AppState.currentUser.username,
            latitude: lat,
            longitude: lon,
            accuracy: acc,
            battery_level: 85,
            is_moving: false
          })
        });
      } catch (e) {}
    },
    (err) => console.warn("GPS error:", err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
}

// ==========================================
// 6. 가족 전용 실시간 채팅방
// ==========================================
function openChatDrawer() {
  document.getElementById("chatDrawerBackdrop").className = "chat-drawer-backdrop active";
  loadChatMessages(AppState.currentChatRoom);

  // 4초 간격 폴링
  clearInterval(AppState.chatPollingTimer);
  AppState.chatPollingTimer = setInterval(() => {
    loadChatMessages(AppState.currentChatRoom);
  }, 4000);
}

function closeChatDrawer(e) {
  if (e && e.target && e.target.id !== "chatDrawerBackdrop" && !e.target.classList.contains("sheet-close-btn")) {
    return;
  }
  document.getElementById("chatDrawerBackdrop").className = "chat-drawer-backdrop";
  clearInterval(AppState.chatPollingTimer);
}

function switchChatRoom(roomId) {
  AppState.currentChatRoom = roomId;

  // 탭 스타일 갱신
  const tabs = document.querySelectorAll(".chat-room-tab");
  tabs.forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");

  const titleMap = {
    "family_all": "👨‍👩‍👧‍👧 우리 가족 전체톡",
    "direct_parents": "💑 아빠 & 엄마 대화방",
    "direct_child1": "💬 아빠 & 첫째딸 (도비사랑녀)",
    "direct_child2": "💬 아빠 & 둘째딸 (미니미니채)",
    "group_pickup": "🚗 안심 귀가 & 픽업 알림방"
  };
  document.getElementById("chatRoomTitle").textContent = titleMap[roomId] || "가족 대화방";

  loadChatMessages(roomId);
}

async function loadChatMessages(roomId) {
  try {
    const res = await fetch(`/api/chat/messages?room_id=${roomId}`);
    const msgs = await res.json();
    const scrollEl = document.getElementById("chatMessagesScroll");

    const currentUname = AppState.currentUser ? AppState.currentUser.username : "미니미니";

    scrollEl.innerHTML = msgs.map(m => {
      const isMine = (m.sender_username === currentUname);
      return `
        <div class="chat-bubble-row ${isMine ? 'mine' : ''}">
          <span class="chat-bubble-avatar">${m.sender_avatar}</span>
          <div class="chat-bubble-content">
            <span class="chat-sender-name">${m.sender_name}</span>
            <div class="chat-bubble">
              ${m.text}
              ${m.msg_type === 'LOCATION' && m.location_data ? `
                <div class="chat-location-card">
                  📍 <strong>${m.location_data.landmark || m.location_data.address}</strong>
                </div>
              ` : ''}
            </div>
            <span class="chat-time">${m.time_str}</span>
          </div>
        </div>
      `;
    }).join("");

    scrollEl.scrollTop = scrollEl.scrollHeight;
  } catch (e) {
    console.error("Chat load error:", e);
  }
}

async function sendChatMessage() {
  const input = document.getElementById("chatInputText");
  const text = (input.value || "").trim();
  if (!text) return;

  try {
    await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_id: AppState.currentChatRoom,
        sender_username: AppState.currentUser ? AppState.currentUser.username : "미니미니",
        text: text,
        msg_type: "TEXT"
      })
    });
    input.value = "";
    loadChatMessages(AppState.currentChatRoom);
  } catch (e) {}
}

function handleChatKeyDown(e) {
  if (e.key === "Enter") {
    sendChatMessage();
  }
}

// 채팅창에 내 현재 GPS 위치 말풍선 전송
async function sendLocationInChat() {
  if (!navigator.geolocation) {
    alert("위치 정보를 지원하지 않는 브라우저입니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: AppState.currentChatRoom,
          sender_username: AppState.currentUser ? AppState.currentUser.username : "미니미니",
          text: "📍 현재 내 위치를 공유합니다!",
          msg_type: "LOCATION",
          location_data: {
            latitude: lat,
            longitude: lon,
            landmark: "평내동 안심 위치",
            address: AppState.location.address
          }
        })
      });
      loadChatMessages(AppState.currentChatRoom);
    } catch (e) {}
  });
}

// ==========================================
// 7. 하루퀴즈 포맷 4인 가족 간편 로그인 모달
// ==========================================
function openLoginModal() {
  document.getElementById("modalAuthLogin").className = "modal-overlay active";
}

function closeLoginModal(e) {
  if (e && e.target && e.target.id !== "modalAuthLogin" && !e.target.classList.contains("sheet-close-btn") && !e.target.classList.contains("btn-secondary")) {
    return;
  }
  document.getElementById("modalAuthLogin").className = "modal-overlay";
}

function renderFamilyLoginGrid() {
  const grid = document.getElementById("familyAccountGrid");
  if (!grid || !AppState.familyMembers) return;

  grid.innerHTML = AppState.familyMembers.map(m => `
    <div class="family-account-card ${m.username === AppState.selectedLoginUser ? 'selected' : ''}" onclick="selectLoginAccount('${m.username}')">
      <div class="account-avatar">${m.avatar}</div>
      <div class="account-name">${m.name}</div>
      <div class="account-role">${m.role_title}</div>
    </div>
  `).join("");
}

function selectLoginAccount(username) {
  AppState.selectedLoginUser = username;
  renderFamilyLoginGrid();
}

async function submitFamilyLogin() {
  const pw = document.getElementById("inputAuthPassword").value;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: AppState.selectedLoginUser,
        password: pw
      })
    });
    const d = await res.json();
    if (d.success) {
      AppState.token = d.token;
      AppState.currentUser = d.user;
      localStorage.setItem("fc_token", d.token);
      localStorage.setItem("fc_user", JSON.stringify(d.user));

      updateHeaderUserUI();
      closeLoginModal();
      alert(`🎉 ${d.user.role_title} (${d.user.name}) 계정으로 전환되었습니다!`);
      refreshData();
    } else {
      alert(d.message || "로그인에 실패했습니다.");
    }
  } catch (e) {
    alert("로그인 통신 중 오류가 발생했습니다.");
  }
}

// ==========================================
// 8. 교통 루트 지도 추가 모달
// ==========================================
function openRouteModal() {
  document.getElementById("modalAddRoute").className = "modal-overlay active";
}

function closeRouteModal() {
  document.getElementById("modalAddRoute").className = "modal-overlay";
}

function selectStartStation(stationName) {
  openRouteModal();
  document.getElementById("inputStationName").value = stationName;
}

async function saveTransitRoute() {
  const title = document.getElementById("inputRouteTitle").value.trim();
  const station = document.getElementById("inputStationName").value.trim();
  const routeNo = document.getElementById("inputRouteNo").value.trim();
  const dest = document.getElementById("inputDestination").value.trim();

  if (!title || !station || !routeNo) {
    alert("루트 이름, 정류소명, 버스 번호를 입력해 주세요.");
    return;
  }

  try {
    await fetch("/api/transit/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        transit_type: "BUS",
        station_name: station,
        route_no: routeNo,
        target_destination: dest,
        user_username: AppState.currentUser ? AppState.currentUser.username : "미니미니"
      })
    });
    closeRouteModal();
    alert("🚌 새 교통 루트가 즐겨찾기에 등록되었습니다!");
    loadFavorites();
  } catch (e) {}
}

function refreshMyLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        AppState.location.lat = pos.coords.latitude;
        AppState.location.lon = pos.coords.longitude;
        refreshData();
        alert("📍 내 현재 위치로 동네 정보가 갱신되었습니다!");
      },
      () => alert("GPS 위치 권한을 확인해 주세요.")
    );
  }
}
