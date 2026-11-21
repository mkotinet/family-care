/**
 * 우리가족챙기기 (Family Care) - 메인 프론트엔드 엔진
 * 기능: 날씨 상세 타임라인, 카카오 지도 연동, 4인 가족 인증(하루퀴즈 연동), 실시간 아이 안심위치, 가족 전용 채팅방
 */

// PWA beforeinstallprompt 전역 최우선 캡처 (브라우저 최초 파이어링 누락 방지)
window.deferredPwaPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPwaPrompt = e;
  console.log("[PWA] beforeinstallprompt captured.");
  showPwaInstallBanner();
  const btn = document.getElementById("btnPwaInstall");
  if (btn) btn.style.display = "inline-flex";
});

window.addEventListener("appinstalled", () => {
  console.log("[PWA] App successfully installed!");
  window.deferredPwaPrompt = null;
  const banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.style.display = "none";
  const btn = document.getElementById("btnPwaInstall");
  if (btn) btn.style.display = "none";
});

// 전역 상태
const AppState = {
  APP_VERSION: document.querySelector('meta[name="app-version"]')?.getAttribute('content') || '1.3.1',
  versionMeta: null,
  isCheckingVersion: false,
  lastVersionCheckTime: 0,
  currentUser: null,       // 현재 로그인 유저 { username, name, role_title, role_type, avatar }
  token: null,
  familyMembers: [],       // 4인 공식 가족 회원
  kakao_js_key: "",
  mapEngine: "leaflet",    // 'kakao' or 'leaflet'
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
  leafletCategoryMap: null,
  categoryMarkers: [],
  kakaoSafetyMap: null,
  leafletSafetyMap: null,
  safetyMarkers: [],
  currentChatRoom: "family_all",
  chatPollingTimer: null,
  selectedLoginUser: "미니미니",
  cachedTransitStops: [],
  cachedTransitRoutes: [],
  favoritePlaces: [],
  selectedPlace: null,
  safetyPollingTimer: null
};

// ==========================================
// 1. 초기화 및 세션 관리
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  initClock();
  setupMobileLifecycle();
  initPwaServiceWorker();
  checkPwaDisplayMode();
  await loadStoredSession();
  await initApp();

  // 최신 버전 감지 및 업데이트 팝업 (하루퀴즈 메커니즘)
  await checkAppVersionUpdate(true);
  await checkWhatsNewPopup();

  // 주기적 버전 체크 (30초 주기)
  setInterval(() => {
    checkAppVersionUpdate(false);
  }, 30000);

  // 실시간 세션 유지 하트비트 전송 (30초 주기)
  sendUserHeartbeat();
  setInterval(() => {
    sendUserHeartbeat();
  }, 30000);

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
      checkAppVersionUpdate(false);
      sendUserHeartbeat();
      if (AppState.currentUser && AppState.currentUser.role_type === "CHILD") {
        startChildLocationTracker();
      }
    }
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      refreshData();
      checkAppVersionUpdate(false);
      sendUserHeartbeat();
    }
  });
  window.addEventListener("focus", () => {
    checkAppVersionUpdate(false);
    sendUserHeartbeat();
  });
}

// ==========================================
// PWA & Service Worker Engine (v1.3.1)
// ==========================================
function checkPwaDisplayMode() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    console.log("[PWA] Running in Standalone App Mode.");
    const banner = document.getElementById("pwaInstallBanner");
    if (banner) banner.style.display = "none";
    const btn = document.getElementById("btnPwaInstall");
    if (btn) btn.style.display = "none";
  } else {
    showPwaInstallBanner();
  }
}

function showPwaInstallBanner() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return;
  if (sessionStorage.getItem("pwa_banner_dismissed") === "true") return;

  const banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.style.display = "flex";
  const btn = document.getElementById("btnPwaInstall");
  if (btn) btn.style.display = "inline-flex";
}

function dismissPwaBanner() {
  const banner = document.getElementById("pwaInstallBanner");
  if (banner) banner.style.display = "none";
  sessionStorage.setItem("pwa_banner_dismissed", "true");
}

function initPwaServiceWorker() {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js?v=1.3.1", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service Worker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Service Worker registration failed:", err);
      });
  }
}

// PWA 원클릭 설치 트리거 (안드로이드 크롬 & 바로가기 가이드 지원)
async function triggerPwaInstall() {
  if (window.deferredPwaPrompt) {
    try {
      window.deferredPwaPrompt.prompt();
      const choiceResult = await window.deferredPwaPrompt.userChoice;
      console.log("[PWA] User response:", choiceResult.outcome);
      if (choiceResult.outcome === "accepted") {
        showToast("📲 홈 화면에 바로가기 앱이 추가되었습니다!", "success");
        dismissPwaBanner();
      }
      window.deferredPwaPrompt = null;
    } catch (err) {
      console.warn("PWA prompt error:", err);
      openPwaGuideModal();
    }
  } else {
    // deferredPrompt가 아직 활성화되지 않은 안드로이드 브라우저/사파리인 경우 안내 모달 표출
    openPwaGuideModal();
  }
}

function openPwaGuideModal() {
  const modal = document.getElementById("modalPwaGuide");
  if (modal) modal.className = "modal-overlay active";
}

function closePwaGuideModal(e) {
  if (e && e.target && e.target.id !== "modalPwaGuide" && !e.target.classList.contains("sheet-close-btn") && !e.target.classList.contains("btn-primary")) {
    return;
  }
  const modal = document.getElementById("modalPwaGuide");
  if (modal) modal.className = "modal-overlay";
}

// 실시간 세션 유지 하트비트 전송
async function sendUserHeartbeat() {
  if (!AppState.token && (!AppState.currentUser || !AppState.currentUser.username)) return;
  try {
    const ua = navigator.userAgent;
    const deviceInfo = /Android/i.test(ua) ? "Android Chrome" : (/iPhone|iPad/i.test(ua) ? "iOS Safari" : "Web Browser");
    await fetch("/api/auth/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AppState.token || ""}`
      },
      body: JSON.stringify({
        token: AppState.token,
        username: AppState.currentUser ? AppState.currentUser.username : "",
        device_info: deviceInfo
      })
    });
  } catch (e) {}
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
    if (data.kakao_js_key) {
      AppState.kakao_js_key = data.kakao_js_key;
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

// ============================================================
// 1-1. 앱 버전 감지 및 자동 업데이트 엔진 (하루퀴즈 메커니즘 연동)
// ============================================================
function isServerVersionNewer(serverVer, clientVer) {
  if (!serverVer || !clientVer) return false;
  const sClean = String(serverVer).replace(/^v/i, '').trim();
  const cClean = String(clientVer).replace(/^v/i, '').trim();
  if (sClean === cClean) return false;

  const sParts = sClean.split('.').map(n => parseInt(n, 10) || 0);
  const cParts = cClean.split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(sParts.length, cParts.length);

  for (let i = 0; i < maxLen; i++) {
    const s = sParts[i] || 0;
    const c = cParts[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}

async function checkAppVersionUpdate(force = false) {
  if (AppState.isCheckingVersion) return;
  const now = Date.now();
  if (!force && (now - AppState.lastVersionCheckTime < 15000)) return;

  AppState.isCheckingVersion = true;
  AppState.lastVersionCheckTime = now;

  try {
    const res = await fetch('/api/version?_t=' + now, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data || !data.version) return;

    AppState.versionMeta = data;
    const serverVersion = data.version;
    const clientVersion = AppState.APP_VERSION;

    if (isServerVersionNewer(serverVersion, clientVersion)) {
      console.log(`[Family Care] New version detected! Server: v${serverVersion}, Client: v${clientVersion}`);

      const guardKey = 'family_auto_reload_to_' + serverVersion;
      const lastReloadAttempt = parseInt(sessionStorage.getItem(guardKey) || '0', 10);
      if (now - lastReloadAttempt < 60000) {
        console.warn('[Family Care] Auto-reload already attempted recently for v' + serverVersion);
        return;
      }
      sessionStorage.setItem(guardKey, String(now));

      showToastNotice(`🚀 새 버전(v${serverVersion})으로 업데이트되었습니다. 최신 화면으로 새로고침합니다...`);

      setTimeout(() => {
        window.location.reload(true);
      }, 800);
    }
  } catch (err) {
    console.warn('[Family Care] Version check failed:', err);
  } finally {
    AppState.isCheckingVersion = false;
  }
}

// What's New 팝업
async function checkWhatsNewPopup() {
  let currentVer = AppState.APP_VERSION;
  try {
    if (!AppState.versionMeta) {
      const res = await fetch('/api/version?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        AppState.versionMeta = await res.json();
        if (AppState.versionMeta && AppState.versionMeta.version) {
          currentVer = AppState.versionMeta.version;
        }
      }
    }
  } catch (e) {}

  const dismissedVersion = localStorage.getItem('family_dismissed_update_version');
  if (dismissedVersion === currentVer) {
    return; // 이미 이번 버전을 확인하고 닫음
  }

  openWhatsNewModal();
}

function openWhatsNewModal() {
  const modal = document.getElementById('modalWhatsNew');
  if (!modal) return;

  const currentVer = (AppState.versionMeta && AppState.versionMeta.version) || AppState.APP_VERSION;
  const badge = document.getElementById('whatsNewVersionBadge');
  if (badge) badge.textContent = `v${currentVer}`;

  const descEl = document.getElementById('whatsNewReleaseDesc');
  if (descEl && AppState.versionMeta && AppState.versionMeta.releaseNotes) {
    descEl.innerText = AppState.versionMeta.releaseNotes;
  }

  const listEl = document.getElementById('whatsNewFeatureList');
  if (listEl && AppState.versionMeta && AppState.versionMeta.features) {
    listEl.innerHTML = AppState.versionMeta.features.map(f => `
      <div class="update-feature-card">
        <div class="update-card-icon">${f.icon}</div>
        <div class="update-card-content">
          <div class="update-card-title">${f.title}</div>
          <div class="update-card-desc">${f.desc}</div>
        </div>
      </div>
    `).join('');
  }

  modal.className = 'modal-overlay active';
}

function closeWhatsNewModal(e) {
  if (e && e.target && e.target.id !== "modalWhatsNew" && !e.target.classList.contains("sheet-close-btn") && !e.target.classList.contains("btn-primary")) {
    return;
  }
  const modal = document.getElementById('modalWhatsNew');
  if (modal) modal.className = 'modal-overlay';
}

function dismissWhatsNewForever() {
  const currentVer = (AppState.versionMeta && AppState.versionMeta.version) || AppState.APP_VERSION;
  try {
    localStorage.setItem('family_dismissed_update_version', currentVer);
  } catch (e) {}
  closeWhatsNewModal();
  showToastNotice(`📢 v${currentVer} 업데이트 알림을 더 이상 표시하지 않습니다.`);
}

// 간이 토스트 알림
function showToastNotice(msg) {
  let toast = document.getElementById('appToastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToastNotice';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.92);color:white;padding:12px 20px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 10px 25px rgba(0,0,0,0.25);transition:opacity 0.3s;pointer-events:none;text-align:center;max-width:90%;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    if (toast) toast.style.opacity = '0';
  }, 3500);
}

// 카카오 키 설정 모달
function openKakaoKeyModal() {
  const modal = document.getElementById("modalKakaoKeySetting");
  const input = document.getElementById("inputKakaoJsKey");
  if (modal) modal.className = "modal-overlay active";
  if (input) input.value = getKakaoJsKey();
}

function closeKakaoKeyModal(e) {
  if (e && e.target && e.target.id !== "modalKakaoKeySetting" && !e.target.classList.contains("sheet-close-btn") && !e.target.classList.contains("btn-secondary")) {
    return;
  }
  const modal = document.getElementById("modalKakaoKeySetting");
  if (modal) modal.className = "modal-overlay";
}

function saveKakaoJsKey() {
  const input = document.getElementById("inputKakaoJsKey");
  if (!input) return;
  const key = input.value.trim();
  if (key) {
    localStorage.setItem("family_kakao_js_key", key);
    showToastNotice("🔑 카카오 JavaScript 키가 저장되었습니다. 지도를 새로고침합니다.");
  } else {
    localStorage.removeItem("family_kakao_js_key");
    showToastNotice("🌐 카카오 키가 삭제되어 오픈스트리트맵 엔진으로 작동합니다.");
  }
  closeKakaoKeyModal();
  kakaoSdkLoadingPromise = null;

  if (AppState.detailViewMode === "map") {
    initCategoryKakaoMap();
  }
}

function getKakaoJsKey() {
  return localStorage.getItem("family_kakao_js_key") || AppState.kakao_js_key || "601649d245ace3f6733d5c4b74bd3a06";
}

function updateMapEngineBadge(badgeId) {
  const el = document.getElementById(badgeId);
  if (!el) return;
  if (AppState.mapEngine === "kakao") {
    el.innerHTML = "🗺️ 카카오 지도 엔진 작동 중";
    el.style.color = "#d97706";
  } else {
    el.innerHTML = "🌐 오픈스트리트맵 엔진 작동 중";
    el.style.color = "#0369a1";
  }
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
    AppState.favoritePlaces = places || [];

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

// ==========================================
// 3. 스마트 하이브리드 지도 엔진 (카카오맵 & Leaflet 듀얼 연동)
// ==========================================
let kakaoSdkLoadingPromise = null;

function loadKakaoSdk() {
  if (typeof kakao !== "undefined" && kakao.maps && kakao.maps.Map) {
    AppState.mapEngine = "kakao";
    return Promise.resolve(true);
  }

  const jsKey = getKakaoJsKey();
  if (!jsKey) {
    AppState.mapEngine = "leaflet";
    return Promise.resolve(false);
  }

  if (kakaoSdkLoadingPromise) return kakaoSdkLoadingPromise;

  kakaoSdkLoadingPromise = new Promise((resolve) => {
    const existing = document.getElementById("kakaoMapsSdkScript");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "kakaoMapsSdkScript";
    script.type = "text/javascript";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${jsKey}&libraries=services&autoload=false`;

    script.onload = () => {
      try {
        kakao.maps.load(() => {
          AppState.mapEngine = "kakao";
          resolve(true);
        });
      } catch (err) {
        console.warn("kakao.maps.load error:", err);
        AppState.mapEngine = "leaflet";
        resolve(false);
      }
    };

    script.onerror = (e) => {
      console.warn("Kakao SDK script load error. Falling back to Leaflet:", e);
      AppState.mapEngine = "leaflet";
      resolve(false);
    };

    document.head.appendChild(script);

    // 2.5초 타임아웃 방어 (네트워크 지연 시 즉시 오픈스트리트맵으로 표시)
    setTimeout(() => {
      if (typeof kakao === "undefined" || !kakao.maps || !kakao.maps.Map) {
        AppState.mapEngine = "leaflet";
        resolve(false);
      }
    }, 2500);
  });

  return kakaoSdkLoadingPromise;
}

// 카테고리 지도 렌더러
async function initCategoryKakaoMap() {
  const container = document.getElementById("kakaoCategoryMap");
  if (!container) return;

  const kakaoReady = await loadKakaoSdk();
  updateMapEngineBadge("catMapEngineBadge");

  if (kakaoReady && typeof kakao !== "undefined" && kakao.maps && kakao.maps.Map) {
    initKakaoCategoryMap(container);
  } else {
    initLeafletCategoryMap(container);
  }
}

// Leaflet 카테고리 지도 (오픈스트리트맵)
function initLeafletCategoryMap(container) {
  if (AppState.leafletCategoryMap) {
    try { AppState.leafletCategoryMap.remove(); } catch (e) {}
    AppState.leafletCategoryMap = null;
  }
  container.innerHTML = "";

  const map = L.map(container).setView([AppState.location.lat, AppState.location.lon], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  AppState.leafletCategoryMap = map;

  // 우리 집 마커
  const homeIcon = L.divIcon({
    className: 'custom-home-pin',
    html: '<div style="background:#0f172a;color:white;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #ffffff;">🏡 우리 집 (평내유진마젤란)</div>',
    iconSize: [60, 24],
    iconAnchor: [30, 12]
  });
  L.marker([AppState.location.lat, AppState.location.lon], { icon: homeIcon })
    .addTo(map)
    .bindPopup('<b>🏡 우리 집</b><br>남양주시 평내동 평내유진마젤란');

  // 지도 빈 곳 클릭 시 직접 핀 꽂기 (나만의 버스 정류소 핀 꽂기)
  map.on('click', function(e) {
    handleCategoryMapClick(e.latlng.lat, e.latlng.lng);
  });

  renderLeafletCategoryMarkers(map);
  updateMapHelperText();

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function renderLeafletCategoryMarkers(map) {
  if (!map) return;
  const cat = AppState.currentCategory;

  if (cat === "transit" && AppState.cachedTransitStops) {
    AppState.cachedTransitStops.forEach((s, idx) => {
      const sLat = s.lat || (AppState.location.lat + (Math.sin(idx + 1) * 0.003));
      const sLon = s.lon || (AppState.location.lon + (Math.cos(idx + 1) * 0.003));
      const icon = L.divIcon({
        className: 'cat-marker-pin',
        html: `<div style="background:#0284c7;color:white;padding:3px 6px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:1px solid #ffffff;">🚏 ${s.name}</div>`,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });
      const marker = L.marker([sLat, sLon], { icon }).addTo(map);
      marker.on("click", () => {
        selectBusStopOnMap(s);
      });
    });
  } else if (cat === "restaurant" && AppState.cachedPlaces) {
    AppState.cachedPlaces.forEach((p, idx) => {
      const pLat = AppState.location.lat + (Math.sin(idx + 1) * 0.005);
      const pLon = AppState.location.lon + (Math.cos(idx + 1) * 0.005);
      const icon = L.divIcon({
        className: 'cat-marker-pin',
        html: `<div style="background:#f97316;color:white;padding:3px 6px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);">🍽️ ${p.name}</div>`,
        iconSize: [70, 24],
        iconAnchor: [35, 12]
      });
      const marker = L.marker([pLat, pLon], { icon }).addTo(map);
      marker.on("click", () => {
        openSelectedPlaceCard({
          category: "식당",
          categoryTitle: "🍽️ 추천 맛집",
          categoryClass: "restaurant",
          name: p.name,
          address: p.address || "경기도 남양주시 평내동",
          phone: p.phone,
          status_info: p.status_badge || "영업중",
          lat: pLat,
          lon: pLon,
          extraHtml: `<div style="color: #ea580c; font-weight: 700;">${p.status_badge || '평내 단골 인기 식당'}</div>`
        });
      });
    });
  } else if (cat === "hospital" && AppState.cachedHospitals) {
    AppState.cachedHospitals.forEach((h, idx) => {
      const hLat = AppState.location.lat + (Math.cos(idx + 2) * 0.0045);
      const hLon = AppState.location.lon + (Math.sin(idx + 2) * 0.0045);
      const isPharm = (h.type === "약국");
      const icon = L.divIcon({
        className: 'cat-marker-pin',
        html: `<div style="background:${isPharm ? '#10b981' : '#3b82f6'};color:white;padding:3px 6px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);">${isPharm ? '💊' : '🏥'} ${h.name}</div>`,
        iconSize: [70, 24],
        iconAnchor: [35, 12]
      });
      const marker = L.marker([hLat, hLon], { icon }).addTo(map);
      marker.on("click", () => {
        openSelectedPlaceCard({
          category: h.type,
          categoryTitle: isPharm ? "💊 안심 약국" : "🏥 안심 병원",
          categoryClass: isPharm ? "pharmacy" : "hospital",
          name: h.name,
          address: h.address || "경기도 남양주시 평내동",
          phone: h.phone,
          status_info: h.status_badge,
          lat: hLat,
          lon: hLon,
          extraHtml: `<div style="color: ${isPharm ? '#059669' : '#2563eb'}; font-weight: 700;">${h.status_badge || ''}</div>`
        });
      });
    });
  }
}

// 카카오 카테고리 지도
function initKakaoCategoryMap(container) {
  const options = {
    center: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    level: 4
  };

  AppState.kakaoCategoryMap = new kakao.maps.Map(container, options);

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

  // 지도 빈 곳 클릭 시 직접 핀 꽂기 (나만의 버스 정류소 핀 꽂기)
  kakao.maps.event.addListener(AppState.kakaoCategoryMap, 'click', function(mouseEvent) {
    const latlng = mouseEvent.latLng;
    handleCategoryMapClick(latlng.getLat(), latlng.getLng());
  });

  renderKakaoCategoryMarkers();
  updateMapHelperText();

  setTimeout(() => {
    AppState.kakaoCategoryMap.relayout();
    AppState.kakaoCategoryMap.setCenter(new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon));
  }, 200);
}

function renderKakaoCategoryMarkers() {
  if (!AppState.kakaoCategoryMap) return;

  AppState.categoryMarkers.forEach(m => m.setMap(null));
  AppState.categoryMarkers = [];

  const cat = AppState.currentCategory;

  if (cat === "transit" && AppState.cachedTransitStops) {
    AppState.cachedTransitStops.forEach((s, idx) => {
      const sLat = s.lat || (AppState.location.lat + (Math.sin(idx + 1) * 0.003));
      const sLon = s.lon || (AppState.location.lon + (Math.cos(idx + 1) * 0.003));
      const pos = new kakao.maps.LatLng(sLat, sLon);
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: `<div style="background:#0284c7;color:white;padding:3px 7px;border-radius:8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;white-space:nowrap;">🚏 ${s.name}</div>`,
        yAnchor: 2.4
      });
      overlay.setMap(AppState.kakaoCategoryMap);
      AppState.categoryMarkers.push(overlay);

      kakao.maps.event.addListener(marker, "click", () => {
        selectBusStopOnMap(s);
      });
    });
  } else if (cat === "restaurant" && AppState.cachedPlaces) {
    AppState.cachedPlaces.forEach(p => {
      const pLat = AppState.location.lat + (Math.random() - 0.5) * 0.008;
      const pLon = AppState.location.lon + (Math.random() - 0.5) * 0.008;
      const pos = new kakao.maps.LatLng(pLat, pLon);
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      kakao.maps.event.addListener(marker, "click", () => {
        openSelectedPlaceCard({
          category: "식당",
          categoryTitle: "🍽️ 추천 맛집",
          categoryClass: "restaurant",
          name: p.name,
          address: p.address || "경기도 남양주시 평내동",
          phone: p.phone,
          status_info: p.status_badge || "영업중",
          lat: pLat,
          lon: pLon,
          extraHtml: `<div style="color: #ea580c; font-weight: 700;">${p.status_badge || '평내 단골 인기 식당'}</div>`
        });
      });
    });
  } else if (cat === "hospital" && AppState.cachedHospitals) {
    AppState.cachedHospitals.forEach(h => {
      const hLat = AppState.location.lat + (Math.random() - 0.5) * 0.006;
      const hLon = AppState.location.lon + (Math.random() - 0.5) * 0.006;
      const pos = new kakao.maps.LatLng(hLat, hLon);
      const isPharm = (h.type === "약국");
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      kakao.maps.event.addListener(marker, "click", () => {
        openSelectedPlaceCard({
          category: h.type,
          categoryTitle: isPharm ? "💊 안심 약국" : "🏥 안심 병원",
          categoryClass: isPharm ? "pharmacy" : "hospital",
          name: h.name,
          address: h.address || "경기도 남양주시 평내동",
          phone: h.phone,
          status_info: h.status_badge,
          lat: hLat,
          lon: hLon,
          extraHtml: `<div style="color: ${isPharm ? '#059669' : '#2563eb'}; font-weight: 700;">${h.status_badge || ''}</div>`
        });
      });
    });
  }
}

// ==========================================
// 지도 안내 및 지도 핀 직접 꽂기 / 목록 연동 헬퍼
// ==========================================
function updateMapHelperText() {
  const el = document.getElementById("mapHelperText");
  if (!el) return;
  if (AppState.currentCategory === "transit") {
    el.innerHTML = "💡 <b>지도 위 원하는 위치를 터치</b>하면 핀이 꽂히며 <b>나만의 버스 루트</b>를 만들 수 있습니다! 🚏";
  } else {
    el.innerHTML = "📍 지도의 마커를 터치하여 위치를 확인하고 즐겨찾기(등록/취소)를 체크하세요.";
  }
}

function handleCategoryMapClick(lat, lon) {
  if (AppState.currentCategory === "transit") {
    dropCustomTransitPin(lat, lon);
  }
}

// 지도 위 임의의 위치를 터치했을 때 나만의 버스 핀 꽂기
async function dropCustomTransitPin(lat, lon) {
  if (AppState.customTransitPin) {
    if (AppState.mapEngine === "kakao" && AppState.customTransitPin.setMap) {
      AppState.customTransitPin.setMap(null);
    } else if (AppState.leafletCategoryMap && AppState.customTransitPin.remove) {
      AppState.customTransitPin.remove();
    }
    AppState.customTransitPin = null;
  }

  const pinTitle = "내가 지정한 정류소 위치";
  const pinAddress = `남양주시 평내동 (위도 ${lat.toFixed(4)}, 경도 ${lon.toFixed(4)})`;

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(lat, lon),
      map: AppState.kakaoCategoryMap
    });
    AppState.customTransitPin = marker;
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(lat, lon));
  } else if (AppState.leafletCategoryMap) {
    const icon = L.divIcon({
      className: 'cat-marker-pin',
      html: `<div style="background:#0284c7;color:white;padding:4px 8px;border-radius:10px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;">📍 새 정류소 핀</div>`,
      iconSize: [85, 26],
      iconAnchor: [42, 13]
    });
    const marker = L.marker([lat, lon], { icon }).addTo(AppState.leafletCategoryMap);
    AppState.customTransitPin = marker;
    AppState.leafletCategoryMap.panTo([lat, lon]);
  }

  openSelectedPlaceCard({
    category: "교통",
    categoryTitle: "🚏 내가 꽂은 버스 핀",
    categoryClass: "transit",
    name: pinTitle,
    address: pinAddress,
    phone: "",
    status_info: "지도에서 직접 지정한 정류소 위치",
    lat: lat,
    lon: lon,
    extraHtml: `
      <div style="background: #e0f2fe; border: 1.5px solid #7dd3fc; border-radius: 10px; padding: 10px; margin-top: 4px;">
        <div style="font-weight: 800; color: #0369a1; margin-bottom: 4px;">📍 지정한 정류장 위치로 나만의 버스 루트 만들기</div>
        <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">자주 타는 버스 번호와 목적지를 등록하여 첫 화면 즐겨찾기에 추가하세요!</div>
        <button class="btn-primary" style="width: 100%; padding: 8px 12px; font-size: 12px;" onclick="openRouteModal('${pinTitle}', '', '잠실/강남 방면')">
          🚌 이 위치로 나만의 버스 루트 만들기
        </button>
      </div>
    `
  });
}

// 약국/병원 목록에서 선택 시 지도로 즉시 전환 & 핀 포커스 & 즐겨찾기 체크
function focusHospitalOnMap(idx) {
  const h = (AppState.cachedHospitals || [])[idx];
  if (!h) return;

  switchDetailView('map');

  const hLat = h.latitude || (AppState.location.lat + (Math.cos(idx + 2) * 0.0045));
  const hLon = h.longitude || (AppState.location.lon + (Math.sin(idx + 2) * 0.0045));

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    AppState.kakaoCategoryMap.setLevel(3);
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(hLat, hLon));
  } else if (AppState.leafletCategoryMap) {
    AppState.leafletCategoryMap.setView([hLat, hLon], 16);
  }

  const isPharm = (h.type === "약국");
  openSelectedPlaceCard({
    category: h.type,
    categoryTitle: isPharm ? "💊 안심 약국" : "🏥 안심 병원",
    categoryClass: isPharm ? "pharmacy" : "hospital",
    name: h.name,
    address: h.address || "경기도 남양주시 평내동",
    phone: h.phone,
    status_info: h.status_badge,
    lat: hLat,
    lon: hLon,
    extraHtml: `<div style="color: ${isPharm ? '#059669' : '#2563eb'}; font-weight: 700;">주말/야간: ${h.weekend_info || h.status_badge}</div>`
  });
}

// 식당 목록에서 선택 시 지도로 즉시 전환 & 핀 포커스
function focusRestaurantOnMap(idx) {
  const p = (AppState.cachedPlaces || [])[idx];
  if (!p) return;

  switchDetailView('map');

  const pLat = AppState.location.lat + (Math.sin(idx + 1) * 0.005);
  const pLon = AppState.location.lon + (Math.cos(idx + 1) * 0.005);

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    AppState.kakaoCategoryMap.setLevel(3);
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(pLat, pLon));
  } else if (AppState.leafletCategoryMap) {
    AppState.leafletCategoryMap.setView([pLat, pLon], 16);
  }

  openSelectedPlaceCard({
    category: "식당",
    categoryTitle: "🍽️ 추천 맛집",
    categoryClass: "restaurant",
    name: p.name,
    address: p.address || "경기도 남양주시 평내동",
    phone: p.phone,
    status_info: p.status_badge || "영업중",
    lat: pLat,
    lon: pLon,
    extraHtml: `<div style="color: #ea580c; font-weight: 700;">${p.status_badge || '평내 단골 인기 식당'}</div>`
  });
}

// ==========================================
// 지도 선택 장소 카드 & 버스 정류소 도착 인터랙션
// ==========================================
function openSelectedPlaceCard(data) {
  AppState.selectedPlace = data;
  const card = document.getElementById("mapSelectedPlaceCard");
  if (!card) return;

  const badgeEl = document.getElementById("selPlaceCatBadge");
  const nameEl = document.getElementById("selPlaceName");
  const addrEl = document.getElementById("selPlaceAddress");
  const phoneEl = document.getElementById("selPlacePhone");
  const extraBox = document.getElementById("selPlaceExtraBox");

  if (badgeEl) {
    badgeEl.textContent = data.categoryTitle || data.category;
    badgeEl.className = `selected-badge ${data.categoryClass || 'transit'}`;
  }
  if (nameEl) nameEl.textContent = data.name;
  if (addrEl) addrEl.textContent = data.address || "경기도 남양주시 평내동";

  if (phoneEl) {
    if (data.phone) {
      phoneEl.style.display = "block";
      phoneEl.textContent = `📞 ${data.phone}`;
    } else {
      phoneEl.style.display = "none";
    }
  }

  if (extraBox) {
    if (data.extraHtml) {
      extraBox.style.display = "block";
      extraBox.innerHTML = data.extraHtml;
    } else {
      extraBox.style.display = "none";
    }
  }

  updateSelectedFavButtonState(data.name);
  card.style.display = "block";
}

function updateSelectedFavButtonState(placeName) {
  const btn = document.getElementById("btnToggleSelectedFav");
  const star = document.getElementById("selFavStar");
  const text = document.getElementById("selFavText");
  if (!btn) return;

  const isFav = (AppState.favoritePlaces || []).some(p => p.name === placeName);
  if (isFav) {
    btn.className = "btn-card-toggle-fav is-favorite";
    if (star) star.textContent = "★";
    if (text) text.textContent = "즐겨찾기 취소";
  } else {
    btn.className = "btn-card-toggle-fav";
    if (star) star.textContent = "☆";
    if (text) text.textContent = "즐겨찾기 등록";
  }
}

function closeSelectedPlaceCard() {
  const card = document.getElementById("mapSelectedPlaceCard");
  if (card) card.style.display = "none";
  AppState.selectedPlace = null;
}

async function toggleSelectedPlaceFavorite() {
  const p = AppState.selectedPlace;
  if (!p) return;
  await toggleFavoritePlace(p.category, p.name, p.address, p.phone, p.status_info, p.lat, p.lon);
}

function navigateSelectedPlace() {
  const p = AppState.selectedPlace;
  if (!p) return;
  const targetLat = p.lat || AppState.location.lat;
  const targetLon = p.lon || AppState.location.lon;
  const url = `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${targetLat},${targetLon}`;
  window.open(url, "_blank");
}

// 버스 정류소 핀 클릭 시 실시간 도착 정보 조회 및 카드 렌더링
async function selectBusStopOnMap(stop) {
  const sLat = stop.lat || (AppState.location.lat + 0.001);
  const sLon = stop.lon || (AppState.location.lon - 0.001);

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(sLat, sLon));
  } else if (AppState.leafletCategoryMap) {
    AppState.leafletCategoryMap.panTo([sLat, sLon]);
  }

  openSelectedPlaceCard({
    category: "교통",
    categoryTitle: "🚏 버스 정류소",
    categoryClass: "transit",
    name: stop.name,
    address: `남양주시 평내동 (집에서 약 ${stop.distance || 120}m)`,
    phone: "",
    status_info: "실시간 노선 운행 중",
    lat: sLat,
    lon: sLon,
    extraHtml: `<div style="color: #64748b; padding: 4px;">도착 예정 버스 정보 조회 중... 🚌</div>`
  });

  try {
    const res = await fetch(`/api/transit/station-arrivals?station_name=${encodeURIComponent(stop.name)}`);
    const data = await res.json();
    const arrivals = data.arrivals || [];

    let extraHtml = "";
    if (arrivals.length > 0) {
      extraHtml = `
        <div style="font-weight: 800; color: #0369a1; margin-bottom: 6px;">🚌 실시간 도착 예정 버스 (${arrivals.length}대)</div>
        <div class="station-arrival-list">
          ${arrivals.map(a => `
            <div class="station-arrival-item">
              <div>
                <span class="bus-num-pill" style="background: ${a.badge_color};">${a.route_no}</span>
                <span style="font-weight: 700; margin-left: 6px; color: #334155;">➔ ${a.destination}</span>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 800; color: #e11d48;">${a.remain_time}</span>
                <span style="font-size: 10px; color: #64748b; margin-left: 4px;">(${a.remain_stops})</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div style="margin-top: 10px;">
          <button class="btn-primary" style="width: 100%; padding: 8px 12px; font-size: 12px;" onclick="openRouteModal('${stop.name}', '', '잠실/강남 방면')">
            🚌 '${stop.name}'(으)로 나만의 버스 루트 만들기
          </button>
        </div>
      `;
    } else {
      extraHtml = `
        <div style="color: #64748b; font-size: 11px;">현재 운행 중인 도착 예정 버스가 없습니다.</div>
        <div style="margin-top: 8px;">
          <button class="btn-primary" style="width: 100%; padding: 8px 12px; font-size: 12px;" onclick="openRouteModal('${stop.name}', '', '잠실/강남 방면')">
            🚌 '${stop.name}'(으)로 나만의 버스 루트 만들기
          </button>
        </div>
      `;
    }

    const extraBox = document.getElementById("selPlaceExtraBox");
    if (extraBox && AppState.selectedPlace && AppState.selectedPlace.name === stop.name) {
      extraBox.innerHTML = extraHtml;
    }
  } catch (e) {
    console.warn("fetch station arrivals error:", e);
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
  AppState.cachedTransitStops = stops || [];
  AppState.cachedTransitRoutes = routes || [];

  el.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 13px; font-weight: 800;">📍 내 주변 버스 정류소 (터치 시 실시간 도착 정보)</span>
      <button class="btn-mini btn-fav" onclick="openRouteModal()">+ 새 루트 등록</button>
    </div>

    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 12px;">
      ${stops.map(s => `
        <div style="flex: 0 0 auto; background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 10px; padding: 7px 12px; font-size: 12px; cursor: pointer; transition: all 0.15s;" onclick="selectBusStopFromList('${s.name}')">
          🚏 <strong>${s.name}</strong> <span style="font-size: 10px; color: #0284c7;">(${s.distance}m)</span>
        </div>
      `).join("")}
    </div>

    <!-- 목록에서 선택한 정류소 실시간 도착 버스 정보 영역 -->
    <div id="listSelectedStopArrivals" style="margin-bottom: 14px;"></div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 13px; font-weight: 800;">🚌 실시간 등록 루트 도착 현황</span>
      <span style="font-size: 11px; color: #0284c7; font-weight: 700;">상단 🗺️ 지도 탭에서도 정류소 선택 가능</span>
    </div>
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

// 목록에서 정류소 탭 시 실시간 도착 버스 정보 노출 헬퍼
async function selectBusStopFromList(stationName) {
  const container = document.getElementById("listSelectedStopArrivals");
  if (!container) return;

  container.innerHTML = `
    <div style="background: #f8fafc; border: 1.5px solid #0284c7; border-radius: 12px; padding: 12px; animation: fadeIn 0.2s;">
      <div style="font-size: 12px; color: #64748b;">🚏 <strong>${stationName}</strong> 도착 정보 조회 중... 🚌</div>
    </div>
  `;

  try {
    const res = await fetch(`/api/transit/station-arrivals?station_name=${encodeURIComponent(stationName)}`);
    const data = await res.json();
    const arrivals = data.arrivals || [];

    if (arrivals.length > 0) {
      container.innerHTML = `
        <div style="background: #f8fafc; border: 1.5px solid #0284c7; border-radius: 12px; padding: 12px; animation: fadeIn 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 800; color: #0284c7;">🚏 ${stationName} 실시간 도착 버스 (${arrivals.length}대)</span>
            <button class="btn-mini btn-fav" onclick="selectStartStation('${stationName}')">+ 이 정류소로 새 루트 등록</button>
          </div>
          <div class="station-arrival-list">
            ${arrivals.map(a => `
              <div class="station-arrival-item">
                <div>
                  <span class="bus-num-pill" style="background: ${a.badge_color};">${a.route_no}</span>
                  <span style="font-weight: 700; margin-left: 6px; color: #334155;">➔ ${a.destination}</span>
                </div>
                <div style="text-align: right;">
                  <span style="font-weight: 800; color: #e11d48;">${a.remain_time}</span>
                  <span style="font-size: 10px; color: #64748b; margin-left: 4px;">(${a.remain_stops})</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; font-size: 12px; color: #64748b;">
          🚏 ${stationName}: 현재 운행 중인 버스 정보가 없습니다.
          <button class="btn-mini btn-fav" style="margin-left: 8px;" onclick="selectStartStation('${stationName}')">+ 루트 등록</button>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = "";
  }
}

async function renderHospitalDetail(el) {
  const res = await fetch("/api/hospital");
  const data = await res.json();
  AppState.cachedHospitals = data.items || [];
  renderHospitalDetailContent(el, "ALL");
}

function renderHospitalDetailContent(el, currentFilter) {
  const items = AppState.cachedHospitals || [];
  const favList = AppState.favoritePlaces || [];

  el.innerHTML = `
    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <button class="btn-mini ${currentFilter === 'ALL' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'ALL' ? '#0284c7' : '#e2e8f0'}; color: ${currentFilter === 'ALL' ? 'white' : '#334155'};" onclick="filterHospitalList('ALL')">전체</button>
      <button class="btn-mini ${currentFilter === 'PHARMACY' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'PHARMACY' ? '#10b981' : '#ecfdf5'}; color: ${currentFilter === 'PHARMACY' ? 'white' : '#059669'};" onclick="filterHospitalList('PHARMACY')">약국만</button>
      <button class="btn-mini ${currentFilter === 'CHILDREN' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'CHILDREN' ? '#db2777' : '#fdf2f8'}; color: ${currentFilter === 'CHILDREN' ? 'white' : '#db2777'};" onclick="filterHospitalList('CHILDREN')">소아과/달빛</button>
    </div>

    <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 8px;">
      💡 약국이나 병원을 터치하면 <b>지도 위치로 이동하고 핀이 꽂혀 즐겨찾기를 바로 체크</b>할 수 있습니다!
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${items.map((h, idx) => {
        const isFav = favList.some(p => p.name === h.name);
        return `
          <div class="item-card" style="cursor: pointer;" onclick="focusHospitalOnMap(${idx})">
            <div class="item-card-top">
              <span class="item-name" style="color: #0f172a;">${h.name}</span>
              <span class="item-badge" style="background: ${h.badge_color}; color: white;">${h.badge}</span>
            </div>
            <div class="item-desc">주말: ${h.weekend_info}</div>
            <div class="item-desc" style="color: #64748b; font-size: 11px;">📍 ${h.address}</div>
            <div class="item-action-row" onclick="event.stopPropagation()">
              <button class="btn-mini btn-fav" style="background: #e0f2fe; color: #0369a1;" onclick="focusHospitalOnMap(${idx})">🗺️ 지도 위치 보기</button>
              <button class="btn-mini btn-fav ${isFav ? 'is-fav' : ''}" style="background: ${isFav ? '#fffbeb' : '#ecfdf5'}; color: ${isFav ? '#b45309' : '#047857'}; border: 1px solid ${isFav ? '#fde68a' : '#a7f3d0'};" onclick="quickAddFavoritePlace('${h.type}', '${h.name}', '${h.address}', '${h.phone}', '${h.status_badge}')">
                ${isFav ? '★ 즐겨찾기 취소' : '☆ 즐겨찾기'}
              </button>
              ${h.phone ? `<a href="tel:${h.phone}" class="btn-mini btn-call">📞 전화</a>` : ''}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

async function filterHospitalList(filterType) {
  const contentEl = document.getElementById("sheetContent");
  if (!contentEl) return;
  try {
    const res = await fetch(`/api/hospital?filter_type=${filterType}`);
    const data = await res.json();
    AppState.cachedHospitals = data.items || [];
    renderHospitalDetailContent(contentEl, filterType);
    if (AppState.detailViewMode === "map") {
      if (AppState.mapEngine === "kakao") renderKakaoCategoryMarkers();
      else if (AppState.leafletCategoryMap) renderLeafletCategoryMarkers(AppState.leafletCategoryMap);
    }
  } catch (e) {
    console.error("Filter hospital error:", e);
  }
}

async function renderRestaurantDetail(el) {
  const res = await fetch("/api/restaurant/search?query=맛집");
  const places = await res.json();
  AppState.cachedPlaces = places;
  const favList = AppState.favoritePlaces || [];

  el.innerHTML = `
    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <input type="text" id="inputSearchRestQuery" placeholder="식당 또는 음식 검색 (예: 갈비, 파스타, 카페)" style="flex: 1; padding: 8px 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 12px;">
      <button onclick="executeRestSearch()" class="btn-mini" style="background: #0ea5e9; color: white;">검색</button>
    </div>

    <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 8px;">
      💡 식당 카드를 터치하면 <b>지도 위치로 이동하고 핀이 꽂혀 즐겨찾기를 체크</b>할 수 있습니다!
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${places.map((p, idx) => {
        const isFav = favList.some(f => f.name === p.name);
        return `
          <div class="item-card" style="cursor: pointer;" onclick="focusRestaurantOnMap(${idx})">
            <div class="item-card-top">
              <span class="item-name">${p.name}</span>
              <span class="item-badge" style="background: #ffedd5; color: #c2410c;">${p.category}</span>
            </div>
            <div class="item-desc">📍 ${p.address} (${p.distance})</div>
            <div class="item-action-row" onclick="event.stopPropagation()">
              <button class="btn-mini btn-fav" style="background: #e0f2fe; color: #0369a1;" onclick="focusRestaurantOnMap(${idx})">🗺️ 지도 위치 보기</button>
              <button class="btn-mini btn-fav" style="background: ${isFav ? '#fffbeb' : '#ecfdf5'}; color: ${isFav ? '#b45309' : '#047857'}; border: 1px solid ${isFav ? '#fde68a' : '#a7f3d0'};" onclick="quickAddFavoritePlace('식당', '${p.name}', '${p.address}', '${p.phone}', '${p.status_badge}')">
                ${isFav ? '★ 단골 취소' : '⭐ 단골 등록'}
              </button>
              ${p.phone ? `<a href="tel:${p.phone}" class="btn-mini btn-call">📞 전화</a>` : ''}
            </div>
          </div>
        `;
      }).join("")}
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

// 즐겨찾기 즉시 저장/취소 원터치 토글 헬퍼
async function quickAddFavoritePlace(category, name, address, phone, status_info) {
  await toggleFavoritePlace(category, name, address, phone, status_info);
}

async function toggleFavoritePlace(category, name, address = "", phone = "", status_info = "", lat = null, lon = null) {
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
        latitude: lat || AppState.location.lat,
        longitude: lon || AppState.location.lon
      })
    });
    const d = await res.json();
    if (d.action === "removed" || d.is_favorite === false) {
      showToast(`🗑️ '${name}' 즐겨찾기가 취소되었습니다.`, "info");
    } else {
      showToast(`⭐ '${name}' 항목이 즐겨찾기에 등록되었습니다!`, "success");
    }
    await loadFavorites();
    if (AppState.selectedPlace && AppState.selectedPlace.name === name) {
      updateSelectedFavButtonState(name);
    }
  } catch (e) {
    showToast("즐겨찾기 처리 중 오류가 발생했습니다.", "error");
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
      const unreported = children.filter(c => !c.has_location);
      if (unreported.length === children.length) {
        if (titleEl) titleEl.textContent = "우리 아이 실시간 안심 위치";
        if (subEl) subEl.textContent = "⚠️ 자녀 스마트폰 위치 수신 대기 중 (앱 설치 및 실행 필요)";
      } else if (unreported.length > 0) {
        const reportedChild = children.find(c => c.has_location);
        const unChild = unreported[0];
        if (titleEl) titleEl.textContent = `우리 아이 안심 위치 (1명 확인 / 1명 대기)`;
        if (subEl) subEl.textContent = `${reportedChild.name}: ${reportedChild.landmark} | ⚠️ ${unChild.name}: 미수신`;
      } else {
        const summaryTexts = children.map(c => `${c.role_title}(${c.name}): ${c.landmark || '위치 확인됨'}`);
        if (titleEl) titleEl.textContent = `우리 아이 안심 위치 (${children.length}명 전원 확인)`;
        if (subEl) subEl.textContent = summaryTexts.join(" | ");
      }
    }
  } catch (e) {}
}

async function openSafetyModal() {
  const modal = document.getElementById("modalSafetyMap");
  modal.className = "modal-overlay active";

  await fetchFamilyLocations();
  startSafetyPolling();
}

function startSafetyPolling() {
  stopSafetyPolling();
  AppState.safetyPollingTimer = setInterval(() => {
    fetchFamilyLocations(true);
  }, 10000);
}

function stopSafetyPolling() {
  if (AppState.safetyPollingTimer) {
    clearInterval(AppState.safetyPollingTimer);
    AppState.safetyPollingTimer = null;
  }
}

async function fetchFamilyLocations(isSilent = false) {
  const timeHeader = document.getElementById("safetyLastCheckTime");
  const now = new Date();
  const kstTime = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul"
  }).format(now);
  if (timeHeader) timeHeader.textContent = `${kstTime} 실시간 확인`;

  try {
    const res = await fetch("/api/location/family");
    const data = await res.json();
    const children = data.children || [];

    // 아이들 위치 및 실시간 로그인 접속 모니터링 카드 렌더링
    const listEl = document.getElementById("safetyChildrenList");
    listEl.innerHTML = children.map(c => {
      const isOnline = c.is_online;
      const sessionBadgeBg = isOnline ? "#22c55e" : (c.login_status === 'RECENT' ? '#f59e0b' : '#94a3b8');
      const cardBg = isOnline ? "#f0fdf4" : (c.is_manual ? "#fffbeb" : "#ffffff");
      const cardBorder = isOnline ? "#86efac" : (c.is_manual ? "#fde047" : "#e2e8f0");

      let locationTitle = "📍 위치 미수신";
      let locationBadge = "";
      let locationDesc = "";

      if (c.has_location) {
        locationTitle = `📍 ${c.landmark || c.address}`;
        if (c.is_manual) {
          locationBadge = '<span style="font-size: 9px; padding: 2px 6px; background: #fef08a; color: #854d0e; border-radius: 4px; font-weight: 800;">부모 수동지정</span>';
          locationDesc = `📌 부모가 수동 설정한 장소('${c.landmark}') 표시 중 (${c.time_diff_desc} 지정). 자녀가 스마트폰에서 로그인 시 실시간 GPS로 자동 갱신됩니다.`;
        } else {
          locationBadge = '<span style="font-size: 9px; padding: 2px 6px; background: #bbf7d0; color: #166534; border-radius: 4px; font-weight: 800;">실시간 GPS</span>';
          locationDesc = `GPS 수신: ${c.time_diff_desc} (${c.updated_at}) | 🔋 ${c.battery_level ? c.battery_level + '%' : '--'} | ${c.is_moving ? '🏃 이동 중' : '🛑 정지'}`;
        }
      } else {
        if (isOnline) {
          locationTitle = "📍 실시간 접속 중 (GPS 수신 대기)";
          locationDesc = "🟢 자녀가 스마트폰에서 앱에 접속 중입니다! 위치 권한이 허용되면 곧 실시간 GPS가 지도에 표시됩니다.";
        } else {
          locationTitle = "📍 위치 미수신";
          locationDesc = "⚠️ 자녀 스마트폰에서 앱을 실행하고 로그인해야 실시간 위치가 전송됩니다. 필요 시 아래 버튼으로 위치를 직접 지정하세요.";
        }
      }

      return `
        <div class="item-card" style="margin-top: 10px; border-radius: 12px; padding: 12px; border: 1.5px solid ${cardBorder}; background: ${cardBg};">
          <!-- 상단: 이름 + 로그인 실시간 접속 뱃지 -->
          <div class="item-card-top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">${c.avatar}</span>
              <span style="font-weight: 800; font-size: 14px; color: #1e293b;">${c.role_title} (${c.name})</span>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; background: ${sessionBadgeBg}; color: white;">
                ${c.login_badge}
              </span>
            </div>
          </div>

          <!-- 중단: 위치 안내 영역 -->
          <div style="background: white; border-radius: 8px; padding: 8px 10px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-size: 13px; font-weight: 800; color: #0f172a;">${locationTitle}</span>
              ${locationBadge}
            </div>
            <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
              ${locationDesc}
            </div>
            ${c.device_info ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 3px;">최근 활동: ${c.login_desc} (${c.device_info})</div>` : ''}
          </div>

          <!-- 하단 액션 버튼 -->
          <div class="child-card-actions" style="display: flex; gap: 6px;">
            <button class="btn-card-action" onclick="openManualLocationModal('${c.username}', '${c.name}', '${c.role_title}')" style="flex: 1; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; cursor: pointer;">
              📍 위치 직접 설정/수정
            </button>
            <button class="btn-card-action" onclick="sendChildLocationPing('${c.username}', '${c.name}')" style="flex: 1; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 6px; border: 1px solid #7dd3fc; background: #e0f2fe; color: #0284c7; cursor: pointer;">
              📲 위치 요청 톡 전송
            </button>
          </div>
        </div>
      `;
    }).join("");

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
  stopSafetyPolling();
  document.getElementById("modalSafetyMap").className = "modal-overlay";
}

// 실측 검증 시뮬레이터 토글 & 실행 함수
function toggleSafetyTestPanel() {
  const body = document.getElementById("safetyTestPanelBody");
  const arrow = document.getElementById("testPanelArrow");
  if (!body) return;
  const isHidden = body.style.display === "none";
  body.style.display = isHidden ? "flex" : "none";
  if (arrow) arrow.textContent = isHidden ? "▲" : "▼";
}

async function simulateChildLocation(username, placeName, lat, lon, isManual = false) {
  try {
    const res = await fetch("/api/location/test-simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        latitude: lat,
        longitude: lon,
        accuracy: 8.0,
        battery_level: 88,
        is_moving: false,
        is_manual: isManual,
        landmark: placeName
      })
    });
    const d = await res.json();
    showToast(`🧪 [검증] ${username} 위치가 '${placeName}'(으)로 갱신되었습니다!`, "success");
    await fetchFamilyLocations();
  } catch (err) {
    showToast("위치 시뮬레이션 중 오류가 발생했습니다.", "error");
  }
}

async function initSafetyKakaoMap(children) {
  const container = document.getElementById("kakaoSafetyMap");
  if (!container) return;

  const kakaoReady = await loadKakaoSdk();
  updateMapEngineBadge("safetyMapEngineBadge");

  if (kakaoReady && typeof kakao !== "undefined" && kakao.maps && kakao.maps.Map) {
    initKakaoSafetyMap(container, children);
  } else {
    initLeafletSafetyMap(container, children);
  }
}

function initLeafletSafetyMap(container, children) {
  if (AppState.leafletSafetyMap) {
    try { AppState.leafletSafetyMap.remove(); } catch (e) {}
    AppState.leafletSafetyMap = null;
  }
  container.innerHTML = "";

  const validChildren = (children || []).filter(c => c.has_location && c.latitude && c.longitude);
  const centerLat = validChildren.length > 0 ? validChildren[0].latitude : AppState.location.lat;
  const centerLon = validChildren.length > 0 ? validChildren[0].longitude : AppState.location.lon;

  const map = L.map(container).setView([centerLat, centerLon], validChildren.length > 0 ? 14 : 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  AppState.leafletSafetyMap = map;

  // 우리 집 마커
  const homeIcon = L.divIcon({
    className: 'custom-home-pin',
    html: '<div style="background:#0f172a;color:white;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #ffffff;">🏡 우리 집</div>',
    iconSize: [60, 24],
    iconAnchor: [30, 12]
  });
  L.marker([AppState.location.lat, AppState.location.lon], { icon: homeIcon })
    .addTo(map)
    .bindPopup('<b>🏡 우리 집</b><br>평내유진마젤란 안심 거점');

  // 안심존 원형 반경 (250m)
  L.circle([AppState.location.lat, AppState.location.lon], {
    radius: 250,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.15
  }).addTo(map).bindPopup('🛡️ 유진마젤란 안심 구역 (반경 250m)');

  // 유효한 위치가 있는 아이들만 마커 표시!
  validChildren.forEach(c => {
    const isFirstChild = (c.username === "도비사랑녀");
    const bgColor = isFirstChild ? "#f59e0b" : "#ec4899";
    const childIcon = L.divIcon({
      className: 'child-safety-pin',
      html: `<div style="background:${bgColor};color:white;padding:5px 10px;border-radius:12px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid #ffffff;">${c.avatar} ${c.name} (${c.landmark || '위치'})</div>`,
      iconSize: [120, 28],
      iconAnchor: [60, 14]
    });

    L.marker([c.latitude, c.longitude], { icon: childIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-size:12px;line-height:1.5;">
          <b>${c.avatar} ${c.role_title} (${c.name})</b><br>
          <span style="display:inline-block;padding:2px 6px;background:#10b981;color:white;border-radius:6px;font-size:10px;font-weight:800;margin:3px 0;">${c.status_badge}</span><br>
          📍 <b>위치:</b> ${c.landmark || c.address}<br>
          🔋 <b>배터리:</b> ${c.battery_level ? c.battery_level + '%' : '--'} | ${c.is_moving ? '🏃 이동 중' : '🛑 정지'}<br>
          ⏱️ <b>확인:</b> ${c.time_diff_desc} (${c.updated_at})
        </div>
      `);
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function initKakaoSafetyMap(container, children) {
  const validChildren = (children || []).filter(c => c.has_location && c.latitude && c.longitude);
  const centerLat = validChildren.length > 0 ? validChildren[0].latitude : AppState.location.lat;
  const centerLon = validChildren.length > 0 ? validChildren[0].longitude : AppState.location.lon;

  const options = {
    center: new kakao.maps.LatLng(centerLat, centerLon),
    level: validChildren.length > 0 ? 5 : 4
  };

  AppState.kakaoSafetyMap = new kakao.maps.Map(container, options);

  // 집 마커
  const homeMarker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    map: AppState.kakaoSafetyMap
  });
  new kakao.maps.CustomOverlay({
    position: homeMarker.getPosition(),
    content: '<div style="padding: 4px 8px; background: #0f172a; color: white; font-size: 11px; font-weight: 800; border-radius: 8px;">🏡 우리 집</div>',
    yAnchor: 2.2,
    map: AppState.kakaoSafetyMap
  });

  // 집 안심 구역 원 (반경 250m)
  new kakao.maps.Circle({
    center: new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon),
    radius: 250,
    strokeWeight: 2,
    strokeColor: '#10b981',
    strokeOpacity: 0.8,
    fillColor: '#10b981',
    fillOpacity: 0.15,
    map: AppState.kakaoSafetyMap
  });

  // 유효한 위치가 있는 아이들만 마커 표시!
  validChildren.forEach(c => {
    const isFirstChild = (c.username === "도비사랑녀");
    const bgColor = isFirstChild ? "#f59e0b" : "#ec4899";
    const cMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(c.latitude, c.longitude),
      map: AppState.kakaoSafetyMap
    });
    new kakao.maps.CustomOverlay({
      position: cMarker.getPosition(),
      content: `<div style="padding: 5px 9px; background: ${bgColor}; color: white; font-size: 11px; font-weight: 800; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">${c.avatar} ${c.name} (${c.landmark || '위치'})</div>`,
      yAnchor: 2.2,
      map: AppState.kakaoSafetyMap
    });
  });

  AppState.kakaoSafetyMap.relayout();
}

// 수동 위치 설정 모달 제어
function openManualLocationModal(username, name, roleTitle) {
  const modal = document.getElementById("modalManualLocation");
  if (!modal) return;
  document.getElementById("manualModalTargetName").textContent = `${roleTitle} (${name})`;
  document.getElementById("manualLocationTargetUser").value = username;
  document.getElementById("manualLocationPlaceName").value = "";
  document.getElementById("manualLocationMemo").value = "";
  modal.className = "modal-overlay active";
}

function closeManualLocationModal() {
  const modal = document.getElementById("modalManualLocation");
  if (modal) modal.className = "modal-overlay";
}

function applyPresetLocation(name, lat, lon) {
  document.getElementById("manualLocationPlaceName").value = name;
  document.getElementById("manualLocationLat").value = lat;
  document.getElementById("manualLocationLon").value = lon;
}

async function submitManualLocation() {
  const username = document.getElementById("manualLocationTargetUser").value;
  const placeName = document.getElementById("manualLocationPlaceName").value.trim();
  const memo = document.getElementById("manualLocationMemo").value.trim();
  const lat = parseFloat(document.getElementById("manualLocationLat").value) || AppState.location.lat;
  const lon = parseFloat(document.getElementById("manualLocationLon").value) || AppState.location.lon;

  if (!placeName) {
    alert("장소명을 입력해 주세요 (예: 호평동 수학학원)");
    return;
  }

  const landmark = memo ? `${placeName} (${memo})` : placeName;

  try {
    const res = await fetch("/api/location/manual-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        latitude: lat,
        longitude: lon,
        landmark,
        battery_level: 88
      })
    });
    const d = await res.json();
    closeManualLocationModal();
    showToastNotice(`📍 ${username}의 위치가 '${landmark}'(으)로 갱신되었습니다!`);
    openSafetyModal();
    checkChildSafetySummary();
  } catch (e) {
    alert("위치 저장 중 오류가 발생했습니다.");
  }
}

async function sendChildLocationPing(username, name) {
  try {
    await fetch("/api/location/request-ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_username: username,
        requester_name: AppState.currentUser ? AppState.currentUser.name : "아빠"
      })
    });
    showToastNotice(`📲 ${name}에게 실시간 위치 요청 톡을 전송했습니다!`);
  } catch (e) {
    alert("위치 요청 전송에 실패했습니다.");
  }
}

function requestChildLocationRefresh() {
  showToastNotice("🔄 아이들 최신 위치 정보를 다시 조회합니다...");
  openSafetyModal();
}

// 자녀 스마트폰에서 백그라운드 GPS 위치 자동 전송
function startChildLocationTracker() {
  if (!navigator.geolocation || !AppState.currentUser) return;

  async function reportPos(pos) {
    if (!AppState.currentUser) return;
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const acc = pos.coords.accuracy;

    let batteryLevel = 85;
    try {
      if (navigator.getBattery) {
        const b = await navigator.getBattery();
        batteryLevel = Math.round(b.level * 100);
      }
    } catch (e) {}

    try {
      await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: AppState.currentUser.username,
          latitude: lat,
          longitude: lon,
          accuracy: acc,
          battery_level: batteryLevel,
          is_moving: false
        })
      });
      console.log("[GPS] Child location auto-reported successfully.");
    } catch (e) {}
  }

  // 1. 즉시 1회 위치 리포트
  navigator.geolocation.getCurrentPosition(
    reportPos,
    (err) => console.warn("GPS init error:", err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
  );

  // 2. 실시간 지속 감시
  navigator.geolocation.watchPosition(
    reportPos,
    (err) => console.warn("GPS watch error:", err),
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

let lastSeenChatMsgId = 0;

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showToast("이 브라우저는 웹 알림을 지원하지 않습니다.", "info");
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      showToast("🔔 가족 메시지 알림이 활성화되었습니다!", "success");
      const btn = document.getElementById("btnRequestNotify");
      if (btn) {
        btn.textContent = "🔔 알림 켜짐";
        btn.style.background = "#dcfce7";
      }
      triggerMessageNotification({
        sender_name: "우리가족챙기기",
        text: "가족 메시지 및 실시간 위치 알림이 켜졌습니다. ✨"
      });
    } else {
      showToast("알림 권한이 허용되지 않았습니다. 브라우저 설정에서 허용해주세요.", "info");
    }
  } catch (err) {
    console.warn("Notification permission error:", err);
  }
}

function triggerMessageNotification(msg) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const title = `💬 ${msg.sender_name}님의 새 메시지`;
  const options = {
    body: msg.text || "가족 메시지가 도착했습니다.",
    icon: "/static/icons/icon-192.png",
    badge: "/static/icons/icon-192.png",
    vibrate: [200, 100, 200],
    tag: "family-care-msg-" + Date.now()
  };

  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.warn("Trigger notification error:", e);
  }
}

async function loadChatMessages(roomId) {
  try {
    const res = await fetch(`/api/chat/messages?room_id=${roomId}`);
    const msgs = await res.json();
    const scrollEl = document.getElementById("chatMessagesScroll");

    const currentUname = AppState.currentUser ? AppState.currentUser.username : "미니미니";

    // 최신 메시지 감지 및 알림 트리거
    if (msgs.length > 0) {
      const latestMsg = msgs[msgs.length - 1];
      if (lastSeenChatMsgId !== 0 && latestMsg.id > lastSeenChatMsgId && latestMsg.sender_username !== currentUname) {
        triggerMessageNotification(latestMsg);
        const unreadDot = document.getElementById("chatUnreadDot");
        if (unreadDot) unreadDot.style.display = "block";
      }
      lastSeenChatMsgId = latestMsg.id;
    }

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
      sendUserHeartbeat();
      if (d.user.role_type === "CHILD") {
        startChildLocationTracker();
      }
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
function openRouteModal(defaultStationName = "", defaultRouteNo = "", defaultDest = "") {
  document.getElementById("modalAddRoute").className = "modal-overlay active";
  if (defaultStationName) {
    const stInput = document.getElementById("inputStationName");
    const titleInput = document.getElementById("inputRouteTitle");
    if (stInput) stInput.value = defaultStationName;
    if (titleInput) titleInput.value = `${defaultStationName} 출발`;
  }
  if (defaultRouteNo) {
    const routeInput = document.getElementById("inputRouteNo");
    if (routeInput) routeInput.value = defaultRouteNo;
  }
  if (defaultDest) {
    const destInput = document.getElementById("inputDestination");
    if (destInput) destInput.value = defaultDest;
  }
}

function closeRouteModal() {
  document.getElementById("modalAddRoute").className = "modal-overlay";
}

function selectStartStation(stationName) {
  openRouteModal(stationName, "", "잠실/강남 방면");
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
