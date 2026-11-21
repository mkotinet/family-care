/**
 * 우리가족챙기기 (Family Care) - Frontend App Engine v2
 * 카테고리 허브 & 즐겨찾기 퀵뷰 & 바텀 시트 상세 뷰어
 */

// 전역 상태
const state = {
  currentLat: 37.6434558,
  currentLon: 127.2311716,
  address: "경기도 남양주시 평내동 평내유진마젤란",
  activeMember: 0, // 0: 전체, 1: 아빠, 2: 엄마, 3: 아이
  lastDateStr: "",
  isWeekend: false,
  cachedData: {
    weather: null,
    transit: [],
    hospital: null,
    restaurant: [],
    health: null,
    culture: null
  }
};

// KST 날짜/시간 포맷터
function getKSTDateString(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getKSTTimeString(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

// 실시간 시계
function startKSTClock() {
  const clockEl = document.getElementById("kstClock");
  setInterval(() => {
    if (clockEl) {
      clockEl.innerText = `${getKSTTimeString()} KST`;
    }
  }, 1000);
}

// BFCache 및 모바일 백그라운드 복귀 대응
function setupMobileLifecycle() {
  state.lastDateStr = getKSTDateString();

  const handleResume = () => {
    const currentDateStr = getKSTDateString();
    if (currentDateStr !== state.lastDateStr) {
      console.log(`[Lifecycle] 자정 롤오버 감지. 전체 데이터 갱신.`);
      state.lastDateStr = currentDateStr;
      refreshAllData();
    } else {
      console.log("[Lifecycle] 모바일 화면 복귀. 날씨/즐겨찾기 퀵 갱신.");
      loadWeatherSummary();
      loadFavoritesQuickView();
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") handleResume();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) handleResume();
  });
  window.addEventListener("focus", handleResume);
}

// 초기화
async function initApp() {
  startKSTClock();
  setupMobileLifecycle();

  try {
    const res = await fetch("/api/init");
    if (res.ok) {
      const data = await res.json();
      state.currentLat = data.default_location.lat;
      state.currentLon = data.default_location.lon;
      state.address = data.default_location.address;
      state.isWeekend = data.is_weekend;

      document.getElementById("currentLocText").innerText = data.default_location.address;
      document.getElementById("headerSubtitle").innerText = `${data.kst_date_string} (${data.kst_day_name}) 즐거운 하루 시작!`;
    }
  } catch (e) {
    console.warn("Init API 에러, 기본 위치 유지:", e);
  }

  setupGlobalEvents();
  refreshAllData();
}

// 전체 데이터 비동기 갱신
async function refreshAllData() {
  await Promise.allSettled([
    loadWeatherSummary(),
    loadFavoritesQuickView(),
    preloadCategoryData()
  ]);
}

// 1. 초기화면: 날씨 & 옷차림 요약 카드
async function loadWeatherSummary() {
  try {
    const res = await fetch(`/api/weather?lat=${state.currentLat}&lon=${state.currentLon}`);
    if (!res.ok) throw new Error("Weather API error");
    const data = await res.json();
    state.cachedData.weather = data;

    document.getElementById("currentTemp").innerText = `${data.temp}℃`;
    document.getElementById("tempRange").innerText = `최저 ${data.temp_min}℃ / 최고 ${data.temp_max}℃ (체감 ${data.feels_like}℃)`;
    document.getElementById("weatherIcon").innerText = data.weather_icon;
    document.getElementById("badgeRain").innerText = `강수확률 ${data.rain_prob}%`;

    const umbrellaBadge = document.getElementById("badgeUmbrella");
    if (data.umbrella_needed) {
      umbrellaBadge.className = "badge badge-umbrella-yes";
      umbrellaBadge.innerText = "☂️ 우산 꼭 챙기세요!";
    } else {
      umbrellaBadge.className = "badge badge-umbrella-no";
      umbrellaBadge.innerText = "☂️ 우산 불필요";
    }

    const airBadge = document.getElementById("badgeAir");
    airBadge.innerText = `미세먼지 ${data.air_quality.pm10_grade} (${data.air_quality.pm10}㎍/㎥)`;
    airBadge.style.color = data.air_quality.pm10_color;

    document.getElementById("outfitIcon").innerText = data.outfit_icon;
    document.getElementById("outfitText").innerText = data.outfit_recommendation;
  } catch (e) {
    console.error("Weather load fail:", e);
  }
}

// 2. 초기화면: 내가 등록한 즐겨찾기 퀵뷰 (교통 + 단골식당 통합 렌더링)
async function loadFavoritesQuickView() {
  const container = document.getElementById("favoritesQuickList");
  try {
    const [transitRes, restRes] = await Promise.all([
      fetch("/api/transit"),
      fetch("/api/restaurant")
    ]);

    const transitItems = transitRes.ok ? await transitRes.json() : [];
    const restItems = restRes.ok ? await restRes.json() : [];

    state.cachedData.transit = transitItems;
    state.cachedData.restaurant = restItems;

    // 카테고리 카드 미리보기 텍스트 업데이트
    if (transitItems.length > 0) {
      document.getElementById("catPreviewTransit").innerText = `${transitItems[0].route_no} 외 ${transitItems.length}개 노선 실시간 도착`;
    }
    if (restItems.length > 0) {
      document.getElementById("catPreviewRestaurant").innerText = `단골 ${restItems.length}곳 등록 (주말 영업시간 확인)`;
    }

    let cardsHtml = "";

    // 교통 즐겨찾기 미니 카드들
    transitItems.forEach(item => {
      cardsHtml += `
        <div class="fav-card" onclick="openCategoryDetail('transit')">
          <div>
            <div class="fav-top">
              <span class="fav-badge" style="background: ${item.badge_color || '#3b82f6'};">${item.route_no}</span>
              <span style="font-size: 11px; color: #64748b; font-weight: 700;">${item.member_name}</span>
            </div>
            <div class="fav-title">${item.title}</div>
            <div class="fav-sub">${item.station_name}</div>
          </div>
          <div class="fav-highlight">⏱️ ${item.remain_time}</div>
        </div>
      `;
    });

    // 식당 즐겨찾기 미니 카드들
    restItems.forEach(item => {
      cardsHtml += `
        <div class="fav-card" onclick="openCategoryDetail('restaurant')">
          <div>
            <div class="fav-top">
              <span class="fav-badge" style="background: #f97316;">${item.category}</span>
              <span style="font-size: 11px; color: #10b981; font-weight: 700;">영업중</span>
            </div>
            <div class="fav-title">${item.name}</div>
            <div class="fav-sub">${item.closed_days}</div>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #d97706; margin-top: 6px;">
            ⏰ ${item.business_hours}
          </div>
        </div>
      `;
    });

    if (!cardsHtml) {
      cardsHtml = `<div style="padding: 14px; font-size: 12px; color: #94a3b8;">등록된 즐겨찾기가 없습니다. 우측 상단 [+ 새 루트 등록]을 눌러보세요.</div>`;
    }

    container.innerHTML = cardsHtml;
  } catch (e) {
    console.error("Favorites load fail:", e);
  }
}

// 카테고리 프리로드 (병원, 건강, 문화)
async function preloadCategoryData() {
  try {
    const [hospRes, healthRes, cultureRes] = await Promise.all([
      fetch(`/api/hospital?lat=${state.currentLat}&lon=${state.currentLon}&filter_type=ALL`),
      fetch(`/api/health?lat=${state.currentLat}&lon=${state.currentLon}`),
      fetch(`/api/culture?lat=${state.currentLat}&lon=${state.currentLon}`)
    ]);

    if (hospRes.ok) {
      const hData = await hospRes.json();
      state.cachedData.hospital = hData;
      const count = (hData.items || []).length;
      document.getElementById("catPreviewHospital").innerText = `지금 문 연 약국·소아과 ${count}곳 확인`;
    }
    if (healthRes.ok) {
      const hlData = await healthRes.json();
      state.cachedData.health = hlData;
      document.getElementById("catPreviewHealth").innerText = `꽃가루 및 감기 위험도 예보`;
    }
    if (cultureRes.ok) {
      const cData = await cultureRes.json();
      state.cachedData.culture = cData;
      const fCount = (cData.festivals || []).length;
      document.getElementById("catPreviewCulture").innerText = `이번 주말 행사 ${fCount}건 & 붐빔 신호등`;
    }
  } catch (e) {
    console.warn("Preload error:", e);
  }
}

// =========================================================
// 카테고리 상세 바텀 시트 열기 & 상세 렌더링
// =========================================================
async function openCategoryDetail(catKey) {
  const backdrop = document.getElementById("sheetBackdrop");
  const titleEl = document.getElementById("sheetTitle");
  const contentEl = document.getElementById("sheetContent");

  backdrop.style.display = "flex";

  if (catKey === "transit") {
    titleEl.innerHTML = `<span>🚌</span> 실시간 교통 도착 정보`;
    renderTransitDetail(contentEl);
  } else if (catKey === "hospital") {
    titleEl.innerHTML = `<span>🏥</span> 우리동네 병원 & 당번약국`;
    renderHospitalDetail(contentEl, "ALL");
  } else if (catKey === "restaurant") {
    titleEl.innerHTML = `<span>🍽️</span> 우리 가족 단골 식당 & 외식`;
    renderRestaurantDetail(contentEl);
  } else if (catKey === "health") {
    titleEl.innerHTML = `<span>🩺</span> 질병 & 꽃가루 알레르기 예보`;
    renderHealthDetail(contentEl);
  } else if (catKey === "culture") {
    titleEl.innerHTML = `<span>🎪</span> 주말 나들이 & 축제 / 붐빔 신호등`;
    renderCultureDetail(contentEl);
  } else if (catKey === "manage") {
    titleEl.innerHTML = `<span>⚙️</span> 나만의 즐겨찾기 간편 관리`;
    renderManageDetail(contentEl);
  }
}

function closeCategoryDetail() {
  document.getElementById("sheetBackdrop").style.display = "none";
}

// 1) 교통 상세 렌더링
function renderTransitDetail(container) {
  const items = state.cachedData.transit || [];
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <span style="font-size: 13px; font-weight: 700; color: #475569;">실시간 도착 카운트다운 (30초 자동갱신)</span>
      <button onclick="document.getElementById('modalAddRoute').style.display='flex'" style="padding: 6px 12px; background: #0ea5e9; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">+ 루트 추가</button>
    </div>
  `;

  if (items.length === 0) {
    html += `<div style="text-align: center; color: #94a3b8; padding: 30px;">등록된 교통 루트가 없습니다.</div>`;
  } else {
    items.forEach(item => {
      html += `
        <div class="detail-item-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${item.badge_color || '#3b82f6'}; color: white; font-weight: 800; font-size: 13px; padding: 2px 8px; border-radius: 6px;">${item.route_no}</span>
              <span style="font-weight: 800; color: #1e293b; font-size: 14px;">${item.title}</span>
            </div>
            <span style="font-size: 16px; font-weight: 800; color: #e11d48;">${item.remain_time}</span>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
            📍 <b>탑승 정류장:</b> ${item.station_name} ➔ ${item.destination || '행선지'}
          </div>
          <div style="font-size: 11px; color: #0284c7; margin-top: 2px; font-weight: 600;">
            ${item.remain_stops} (${item.crowded_level || '여유'})
          </div>
        </div>
      `;
    });
  }
  container.innerHTML = html;
}

// 2) 병원 & 당번약국 상세 렌더링
function renderHospitalDetail(container, filterType = "ALL") {
  const data = state.cachedData.hospital || { items: [] };
  let items = data.items || [];

  if (filterType === "PHARMACY") items = items.filter(x => x.type === "약국");
  else if (filterType === "CHILDREN") items = items.filter(x => x.type.includes("소아") || x.badge === "달빛어린이병원");
  else if (filterType === "OPEN_NOW") items = items.filter(x => x.is_open_now);

  let html = `
    <div class="filter-chips">
      <button class="chip ${filterType === 'ALL' ? 'active' : ''}" onclick="renderHospitalDetail(document.getElementById('sheetContent'), 'ALL')">전체</button>
      <button class="chip ${filterType === 'PHARMACY' ? 'active' : ''}" onclick="renderHospitalDetail(document.getElementById('sheetContent'), 'PHARMACY')">💊 당번약국</button>
      <button class="chip ${filterType === 'CHILDREN' ? 'active' : ''}" onclick="renderHospitalDetail(document.getElementById('sheetContent'), 'CHILDREN')">👶 소아과/달빛병원</button>
      <button class="chip ${filterType === 'OPEN_NOW' ? 'active' : ''}" onclick="renderHospitalDetail(document.getElementById('sheetContent'), 'OPEN_NOW')">🟢 지금 문 연 곳</button>
    </div>
  `;

  if (items.length === 0) {
    html += `<div style="text-align: center; color: #94a3b8; padding: 30px;">조건에 맞는 의료기관이 없습니다.</div>`;
  } else {
    items.forEach(item => {
      html += `
        <div class="detail-item-card" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; font-size: 14px; color: #1e293b; display: flex; align-items: center; gap: 6px;">
              <span>${item.type === '약국' ? '💊' : '🏥'}</span>
              <span>${item.name}</span>
              <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">${item.badge || item.type}</span>
            </div>
            <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 4px;">
              ⏰ ${item.today_hours}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${item.distance} | ${item.address}
            </div>
          </div>
          <a href="tel:${item.phone}" style="background: #e0f2fe; color: #0284c7; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; text-decoration: none;">
            📞
          </a>
        </div>
      `;
    });
  }
  container.innerHTML = html;
}

// 3) 단골 식당 상세 렌더링
function renderRestaurantDetail(container) {
  const items = state.cachedData.restaurant || [];
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <span style="font-size: 13px; font-weight: 700; color: #475569;">우리 가족이 자주 가는 단골 식당</span>
      <button onclick="document.getElementById('modalAddRestaurant').style.display='flex'" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">+ 단골 등록</button>
    </div>
  `;

  if (items.length === 0) {
    html += `<div style="text-align: center; color: #94a3b8; padding: 30px;">등록된 단골 식당이 없습니다.</div>`;
  } else {
    items.forEach(item => {
      html += `
        <div class="detail-item-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 15px; color: #1e293b;">🍴 ${item.name} <span style="font-size: 12px; color: #64748b; font-weight: normal;">(${item.category})</span></span>
            <span style="font-size: 12px; font-weight: 700; color: #10b981;">${item.status_badge || '영업중'}</span>
          </div>
          <div style="font-size: 12px; color: #334155; margin-top: 5px;">
            ⏰ <b>영업시간:</b> ${item.business_hours}
          </div>
          <div style="font-size: 12px; color: #dc2626; margin-top: 2px;">
            🛑 <b>휴무일:</b> ${item.closed_days}
          </div>
          ${item.family_note ? `<div style="font-size: 12px; color: #d97706; background: #fffbeb; padding: 6px 10px; border-radius: 8px; margin-top: 6px; font-weight: 600;">📝 <b>가족메모:</b> ${item.family_note}</div>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <span style="font-size: 11px; color: #94a3b8;">${item.address}</span>
            <a href="tel:${item.phone}" style="font-size: 12px; color: #0ea5e9; text-decoration: none; font-weight: 700;">전화문의 📞</a>
          </div>
        </div>
      `;
    });
  }
  container.innerHTML = html;
}

// 4) 질병/알레르기 상세 렌더링
function renderHealthDetail(container) {
  const data = state.cachedData.health || { alerts: [] };
  let html = `<div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px;">기상청 및 국민건강보험공단 질병 위험 지수</div>`;

  (data.alerts || []).forEach(a => {
    html += `
      <div class="detail-item-card" style="border-left: 4px solid ${a.color};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 14px; color: #1e293b;">${a.disease}</span>
          <span style="background: ${a.color}; color: white; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 999px;">${a.level}</span>
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 6px; line-height: 1.4;">
          💡 <b>예방 수칙:</b> ${a.tip}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 5) 축제/나들이 상세 렌더링
function renderCultureDetail(container) {
  const data = state.cachedData.culture || { festivals: [] };
  let html = `<div style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 10px;">남양주 및 인근 주말 행사 & 실시간 혼잡도 신호등</div>`;

  (data.festivals || []).forEach(f => {
    html += `
      <div class="detail-item-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 14px; color: #1e293b;">🎪 ${f.title}</span>
          <span style="background: #fef3c7; color: #b45309; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px;">
            혼잡도: ${f.crowd_status}
          </span>
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          📍 ${f.location} (${f.distance}) | 📅 ${f.period}
        </div>
        <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 6px;">
          👉 ${f.recommendation}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 6) 관리 메뉴
function renderManageDetail(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div class="detail-item-card" onclick="document.getElementById('modalAddRoute').style.display='flex'" style="cursor: pointer;">
        <div style="font-weight: 800; font-size: 15px; color: #0ea5e9;">🚌 새 출퇴근/등교 교통 루트 추가</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">집 앞 버스 정류장과 자주 타는 노선을 등록하여 초기화면에서 바로 확인하세요.</div>
      </div>
      <div class="detail-item-card" onclick="document.getElementById('modalAddRestaurant').style.display='flex'" style="cursor: pointer;">
        <div style="font-weight: 800; font-size: 15px; color: #10b981;">🍽️ 우리 가족 단골 식당 등록</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">주말 영업시간과 마감시간, 가족 메모를 기록해두고 외식 전에 바로 확인하세요.</div>
      </div>
    </div>
  `;
}

// 이벤트 리스너 바인딩
function setupGlobalEvents() {
  // GPS 새로고침
  document.getElementById("btnRefreshLoc").addEventListener("click", () => {
    if ("geolocation" in navigator) {
      document.getElementById("currentLocText").innerText = "현재 GPS 위치 확인 중...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.currentLat = pos.coords.latitude;
          state.currentLon = pos.coords.longitude;
          document.getElementById("currentLocText").innerText = `내 위치 (${state.currentLat.toFixed(3)}, ${state.currentLon.toFixed(3)})`;
          refreshAllData();
        },
        (err) => {
          alert("GPS 위치 확인 권한이 없거나 꺼져 있어 기본 위치(남양주시 평내유진마젤란)를 유지합니다.");
          document.getElementById("currentLocText").innerText = state.address;
        },
        { timeout: 5000 }
      );
    }
  });

  // 가족 멤버 선택 탭
  const tabs = document.querySelectorAll(".member-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeMember = parseInt(tab.dataset.member);
      loadFavoritesQuickView();
    });
  });

  // 퀵 루트 등록 버튼
  document.getElementById("btnQuickAddRoute").addEventListener("click", () => {
    document.getElementById("modalAddRoute").style.display = "flex";
  });

  // 모달 제어 (루트 추가)
  const modalRoute = document.getElementById("modalAddRoute");
  document.getElementById("btnCloseRouteModal").addEventListener("click", () => modalRoute.style.display = "none");
  document.getElementById("btnSaveRoute").addEventListener("click", async () => {
    const title = document.getElementById("inputRouteTitle").value.trim();
    const station = document.getElementById("inputStationName").value.trim();
    const routeNo = document.getElementById("inputRouteNo").value.trim();
    const dest = document.getElementById("inputDestination").value.trim();

    if (!title || !station || !routeNo) {
      alert("루트 이름, 정류장, 노선번호를 모두 입력해주세요.");
      return;
    }

    await fetch("/api/transit/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        station_name: station,
        route_no: routeNo,
        target_destination: dest,
        transit_type: "BUS",
        member_id: state.activeMember || 1
      })
    });

    modalRoute.style.display = "none";
    loadFavoritesQuickView();
  });

  // 모달 제어 (단골 식당 등록)
  const modalRest = document.getElementById("modalAddRestaurant");
  document.getElementById("btnCloseRestModal").addEventListener("click", () => modalRest.style.display = "none");
  document.getElementById("btnSaveRest").addEventListener("click", async () => {
    const name = document.getElementById("inputRestName").value.trim();
    const category = document.getElementById("inputRestCategory").value.trim() || "식당";
    const hours = document.getElementById("inputRestHours").value.trim() || "11:00 ~ 21:00";
    const closed = document.getElementById("inputRestClosed").value.trim() || "연중무휴";
    const note = document.getElementById("inputRestNote").value.trim();

    if (!name) {
      alert("식당 이름을 입력해주세요.");
      return;
    }

    await fetch("/api/restaurant/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        business_hours: hours,
        closed_days: closed,
        family_note: note
      })
    });

    modalRest.style.display = "none";
    loadFavoritesQuickView();
  });
}

// 돔 로드 완료 시 앱 구동
document.addEventListener("DOMContentLoaded", initApp);
