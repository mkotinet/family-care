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
  APP_VERSION: document.querySelector('meta[name="app-version"]')?.getAttribute('content') || '1.3.3',
  versionMeta: null,
  isCheckingVersion: false,
  lastVersionCheckTime: 0,
  currentUser: null,       // 현재 로그인 유저 { username, name, role_title, role_type, avatar }
  token: null,
  familyMembers: [],       // 4인 공식 가족 회원
  kakao_js_key: "",
  mapEngine: "leaflet",    // 'kakao' or 'leaflet'
  location: {
    lat: 37.643421,
    lon: 127.236018,
    address: "남양주시 평내동 평내마젤란21아파트"
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
  safetyPollingTimer: null,
  categoryRouteLine: null,      // 집 ➔ 목적지 (식당/병원/약국) 경로선
  transitRouteLine: null,       // 버스 출발지 ➔ 도착지 경로선
  transitOriginMarker: null,    // 버스 출발지 깃발 마커
  transitRouteBuilder: {
    origin: null,               // { name, lat, lon, address }
    destination: null           // { name, lat, lon, address }
  },
  busAlerts: JSON.parse(localStorage.getItem('family_bus_alerts') || '[]'), // 예약된 버스 알림 목록
  currentAlarmTarget: null,     // 현재 알림 설정 중인 버스 정보
  busAlertLoopTimer: null,
  isSingleFocusMode: false,     // 선택 장소 단 1곳만 포커스 모드
  singleFocusPlace: null,
  currentCultureScope: "local",
  currentHospitalFilter: "ALL",
  cachedFestivals: []
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

  // 버스 도착 알림 감시 루프 초기화 (15초 주기)
  initBusAlertSystem();

  // 앱 실행 시 내 위치 자동 탐색 및 날씨/지역 자동 반영
  autoDetectUserLocation();

  // 자녀 계정일 경우 자동 GPS 위치 추적 리포트 가동
  if (AppState.currentUser && AppState.currentUser.role_type === "CHILD") {
    startChildLocationTracker();
  }
});

// 앱 실행 시 브라우저 GPS로 내 현재 위치를 자동 탐색하여 날씨와 위치를 즉시 동기화
async function autoDetectUserLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      AppState.location.lat = lat;
      AppState.location.lon = lon;

      // 카카오 역지오코딩 시도
      try {
        if (typeof kakao !== "undefined" && kakao.maps && kakao.maps.services) {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2RegionCode(lon, lat, (result, status) => {
            if (status === kakao.maps.services.Status.OK && result.length > 0) {
              const r = result[0];
              AppState.location.address = `${r.region_1depth_name} ${r.region_2depth_name} ${r.region_3depth_name}`;
              const locEl = document.getElementById("currentLocText");
              if (locEl) locEl.innerText = AppState.location.address;
            }
          });
        }
      } catch (e) {}

      // 실시간 날씨 데이터 즉시 재조회 및 화면 갱신
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const wData = await res.json();
        AppState.weatherData = wData;
        renderWeatherSummary(wData);
      } catch (e) {}

      // 즐겨찾기 갱신
      loadFavorites();
      console.log(`[Auto Location] 내 위치 자동 반영 완료: (${lat}, ${lon})`);
    },
    (err) => {
      console.log("[Auto Location] GPS 권한 미허용/타임아웃. 기본 거점(평내유진마젤란) 유지");
    },
    { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
  );
}

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
  if (e && e.target && e.target.id !== "modalWhatsNew" && !e.target.closest(".sheet-close-btn") && !e.target.closest(".btn-primary") && !e.target.closest(".btn-secondary")) {
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

function showToast(msg, type = "info") {
  showToastNotice(msg);
}
window.showToast = showToast;
window.showToastNotice = showToastNotice;

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
// 3. 우리 가족 즐겨찾기 퀵뷰 & 스마트 라우팅
// ==========================================
// 즐겨찾기 카테고리 판별 헬퍼
function isTransitCategory(cat) {
  if (!cat) return false;
  return /교통|버스|정류|노선|지하철|출발|도착/i.test(cat);
}
function isRestaurantCategory(cat) {
  if (!cat) return false;
  return /식당|음식|맛집|카페|베이커리|중식|한식|일식|양식|분식|치킨|피자|외식/i.test(cat);
}
function isHospitalCategory(cat) {
  if (!cat) return false;
  return /약국|병원|의원|의료|클리닉|치과|안과|이비인후과|소아과|내과/i.test(cat);
}

// 1. 교통 즐겨찾기 클릭 (루트 ID 기반 포커스)
async function focusFavoriteTransitRouteById(routeId) {
  await openCategoryDetail('transit');
  const t = (AppState.loadedTransit || []).find(item => item.id == routeId);
  if (t && t.station_name) {
    setTimeout(() => {
      selectBusStopFromList(t.station_name);
    }, 300);
  }
}
window.focusFavoriteTransitRouteById = focusFavoriteTransitRouteById;

// 2. 식당 즐겨찾기 클릭 (단골 식당 ID 기반 지도 단일 핀 포커스)
async function focusFavoriteRestaurantById(restId) {
  await openCategoryDetail('restaurant');
  const r = (AppState.loadedRestaurants || []).find(item => item.id == restId);
  if (r) {
    setTimeout(() => {
      focusSinglePlaceOnMap({
        id: r.id,
        name: r.name,
        category: r.category || '식당',
        address: r.address || '경기도 남양주시 평내동',
        phone: r.phone || '',
        distance: r.distance_meters ? `${r.distance_meters}m` : '300m',
        lat: Number(r.lat || r.latitude || (AppState.location.lat + 0.003)),
        lon: Number(r.lon || r.longitude || (AppState.location.lon + 0.003)),
        status_badge: r.status_badge || '🟢 단골 맛집'
      }, '식당');
    }, 250);
  }
}
window.focusFavoriteRestaurantById = focusFavoriteRestaurantById;

// 3. 지도 등록 장소 즐겨찾기 클릭 (장소 ID 기반 카테고리별 단일 핀 포커스 및 네비게이션)
async function focusFavoritePlaceById(placeId) {
  const p = (AppState.favoritePlaces || []).find(item => item.id == placeId);
  if (!p) {
    openCategoryDetail('culture');
    return;
  }

  const pLat = Number(p.latitude || p.lat || AppState.location.lat);
  const pLon = Number(p.longitude || p.lon || AppState.location.lon);
  const placeObj = {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address || p.memo || '경기도 남양주시 평내동',
    phone: p.phone || '',
    lat: pLat,
    lon: pLon,
    status_badge: p.status_info || '⭐ 즐겨찾기'
  };

  if (isTransitCategory(p.category)) {
    await openCategoryDetail('transit');
    setTimeout(() => {
      selectBusStopFromList(p.name);
    }, 300);
  } else if (isRestaurantCategory(p.category)) {
    await openCategoryDetail('restaurant');
    setTimeout(() => {
      focusSinglePlaceOnMap(placeObj, '식당');
    }, 250);
  } else if (isHospitalCategory(p.category)) {
    await openCategoryDetail('hospital');
    setTimeout(() => {
      focusSinglePlaceOnMap(placeObj, p.category);
    }, 250);
  } else {
    // 문화/축제
    await openCategoryDetail('culture');
  }
}
window.focusFavoritePlaceById = focusFavoritePlaceById;

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
    AppState.loadedTransit = transit || [];
    AppState.loadedRestaurants = restaurants || [];
    AppState.favoritePlaces = places || [];
    AppState.loadedPlaces = places || [];

    // 사용자 요청 필수 준수: 즐겨찾기는 1. 교통 -> 2. 식당 -> 3. 병원/약국 -> 4. 기타 순으로 정리 표출
    const transitItems = [];
    const restaurantItems = [];
    const hospitalItems = [];
    const otherItems = [];

    // 1) 교통 루트 항목
    (transit || []).forEach(t => {
      transitItems.push(`
        <div class="fav-card" onclick="focusFavoriteTransitRouteById(${t.id})">
          <div class="fav-card-top" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="fav-card-tag" style="background: #e0f2fe; color: #0369a1;">🚌 ${t.route_no}</span>
            <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation()">
              <button style="border:none; background:#f1f5f9; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="수정" onclick="openEditTransitModalById(${t.id})">✏️</button>
              <button style="border:none; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="삭제" onclick="deleteTransitRoute(${t.id})">🗑️</button>
            </div>
          </div>
          <div>
            <div class="fav-card-title">${t.title}</div>
            <div class="fav-card-sub">${t.station_name} ➔ ${t.destination || t.dest_station_name}</div>
          </div>
          <div class="fav-card-highlight" style="color: ${t.badge_color};">
            ${t.remain_time}
          </div>
        </div>
      `);
    });

    // 2) 단골 식당 항목
    const seenRestNames = new Set();
    (restaurants || []).forEach(r => {
      seenRestNames.add(r.name);
      restaurantItems.push(`
        <div class="fav-card" onclick="focusFavoriteRestaurantById(${r.id})">
          <div class="fav-card-top" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="fav-card-tag" style="background: #ffedd5; color: #c2410c;">🍽️ ${r.category}</span>
            <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation()">
              <span style="font-size: 10px; color: #64748b; margin-right: 2px;">${r.distance_meters}m</span>
              <button style="border:none; background:#f1f5f9; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="수정" onclick="openEditRestaurantModalById(${r.id})">✏️</button>
              <button style="border:none; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="삭제" onclick="deleteFavoriteRestaurant(${r.id})">🗑️</button>
            </div>
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

    // 3) 지도에서 추가한 장소들 분류 (교통, 식당, 병원/약국, 기타)
    (places || []).forEach(p => {
      const cardHtml = `
        <div class="fav-card" onclick="focusFavoritePlaceById(${p.id})">
          <div class="fav-card-top" style="display: flex; justify-content: space-between; align-items: center;">
            <span class="fav-card-tag" style="background: ${isTransitCategory(p.category) ? '#e0f2fe' : (isHospitalCategory(p.category) ? '#ecfdf5' : (isRestaurantCategory(p.category) ? '#ffedd5' : '#f1f5f9'))}; color: ${isTransitCategory(p.category) ? '#0369a1' : (isHospitalCategory(p.category) ? '#047857' : (isRestaurantCategory(p.category) ? '#c2410c' : '#334155'))};">
              ${isTransitCategory(p.category) ? '🚏' : (isHospitalCategory(p.category) ? '💊' : (isRestaurantCategory(p.category) ? '🍽️' : '⭐'))} ${p.category}
            </span>
            <div style="display: flex; align-items: center; gap: 4px;" onclick="event.stopPropagation()">
              <button style="border:none; background:#f1f5f9; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="수정" onclick="openEditPlaceModalById(${p.id})">✏️</button>
              <button style="border:none; background:#fee2e2; color:#b91c1c; border-radius:4px; padding:2px 5px; font-size:10px; cursor:pointer;" title="삭제" onclick="deleteFavoritePlace(${p.id})">🗑️</button>
            </div>
          </div>
          <div>
            <div class="fav-card-title">${p.name}</div>
            <div class="fav-card-sub">${p.memo || p.address || ''}</div>
          </div>
          <div class="fav-card-highlight" style="font-size: 11px; color: #0284c7;">
            ${p.status_info || '즐겨찾기 저장됨'}
          </div>
        </div>
      `;

      if (isTransitCategory(p.category)) {
        transitItems.push(cardHtml);
      } else if (isRestaurantCategory(p.category)) {
        if (!seenRestNames.has(p.name)) {
          restaurantItems.push(cardHtml);
        }
      } else if (isHospitalCategory(p.category)) {
        hospitalItems.push(cardHtml);
      } else {
        otherItems.push(cardHtml);
      }
    });

    // 최종 합본: 1. 교통 ➔ 2. 식당 ➔ 3. 병원/약국 ➔ 4. 기타
    const allItems = [...transitItems, ...restaurantItems, ...hospitalItems, ...otherItems];

    container.innerHTML = allItems.length > 0 ? allItems.join("") : `
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
  // 카테고리 전환 시 이전 상태 및 지도 찌꺼기(출발/도착 깃발, 경로선, 바텀 카드 등) 완전 초기화
  resetTransitRouteBuilder(true);
  clearCategoryMarkers();
  clearCategoryRouteLine();
  closeSelectedPlaceCard();
  if (AppState.customTransitPin) {
    if (AppState.customTransitPin.setMap) AppState.customTransitPin.setMap(null);
    if (AppState.customTransitPin.remove) AppState.customTransitPin.remove();
    AppState.customTransitPin = null;
  }
  AppState.isSingleFocusMode = false;
  AppState.singleFocusPlace = null;

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
function switchDetailView(mode, forceReset = false) {
  AppState.detailViewMode = mode;
  const mapWrapper = document.getElementById("sheetMapWrapper");
  const contentEl = document.getElementById("sheetContent");

  document.getElementById("btnViewList").className = `toggle-btn ${mode === 'list' ? 'active' : ''}`;
  document.getElementById("btnViewMap").className = `toggle-btn ${mode === 'map' ? 'active' : ''}`;

  if (mode === "map") {
    mapWrapper.style.display = "block";
    contentEl.style.display = "flex";

    if (forceReset) {
      AppState.isSingleFocusMode = false;
      AppState.singleFocusPlace = null;
    }

    if (!AppState.kakaoCategoryMap && !AppState.leafletCategoryMap) {
      initCategoryKakaoMap();
    } else {
      if (AppState.kakaoCategoryMap) {
        AppState.kakaoCategoryMap.relayout();
        if (AppState.currentCategory === "transit" && !AppState.isSingleFocusMode) {
          AppState.kakaoCategoryMap.setLevel(3);
          AppState.kakaoCategoryMap.setCenter(new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon));
        }
        if (forceReset) {
          renderKakaoCategoryMarkers();
          updateMapHelperText();
        }
      } else if (AppState.leafletCategoryMap) {
        AppState.leafletCategoryMap.invalidateSize();
        if (AppState.currentCategory === "transit" && !AppState.isSingleFocusMode) {
          AppState.leafletCategoryMap.setView([AppState.location.lat, AppState.location.lon], 17);
        }
        if (forceReset) {
          renderLeafletCategoryMarkers(AppState.leafletCategoryMap);
          updateMapHelperText();
        }
      }
    }
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

  if (!AppState.isSingleFocusMode) {
    renderLeafletCategoryMarkers(map);
    updateMapHelperText();
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function renderLeafletCategoryMarkers(map) {
  if (!map) return;
  if (AppState.isSingleFocusMode) return;
  const cat = AppState.currentCategory;

  if (cat === "transit" && AppState.cachedTransitStops) {
    AppState.cachedTransitStops.forEach((s, idx) => {
      const sLat = Number(s.lat || s.latitude);
      const sLon = Number(s.lon || s.longitude);
      if (!sLat || !sLon) return;
      const dirTag = s.direction === "hopyeong" ? " (호평행)" : (s.direction === "seoul" ? " (서울행)" : "");
      const icon = L.divIcon({
        className: 'cat-marker-pin',
        html: `<div style="background:#0284c7;color:white;padding:3px 6px;border-radius:8px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:1px solid #ffffff;">🚏 ${s.name}${dirTag}</div>`,
        iconSize: [85, 24],
        iconAnchor: [42, 12]
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
        focusRestaurantByName(p.name);
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
        focusHospitalByName(h.name);
      });
    });
  }
}

// 카카오 카테고리 지도
function initKakaoCategoryMap(container) {
  const isTransit = AppState.currentCategory === "transit";
  const centerLat = AppState.location.lat;
  const centerLon = AppState.location.lon;
  // 쾌적한 도보/단지 상세 스케일 (너무 축소되어 촘촘해지지 않도록 기본 레벨 3 보장)
  const zoomLevel = 3;

  const options = {
    center: new kakao.maps.LatLng(centerLat, centerLon),
    level: zoomLevel
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

  if (!AppState.isSingleFocusMode) {
    renderKakaoCategoryMarkers();
    updateMapHelperText();
  }

  setTimeout(() => {
    AppState.kakaoCategoryMap.relayout();
    AppState.kakaoCategoryMap.setCenter(new kakao.maps.LatLng(centerLat, centerLon));
  }, 200);
}

function renderKakaoCategoryMarkers() {
  if (!AppState.kakaoCategoryMap) return;
  if (AppState.isSingleFocusMode) return;

  AppState.categoryMarkers.forEach(m => m.setMap(null));
  AppState.categoryMarkers = [];

  const cat = AppState.currentCategory;

  if (cat === "transit" && AppState.cachedTransitStops) {
    AppState.cachedTransitStops.forEach((s, idx) => {
      const sLat = Number(s.lat || s.latitude);
      const sLon = Number(s.lon || s.longitude);
      if (!sLat || !sLon) return;
      const dirTag = s.direction === "hopyeong" ? " (호평행)" : (s.direction === "seoul" ? " (서울행)" : "");
      const pos = new kakao.maps.LatLng(sLat, sLon);
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: `<div onclick="selectBusStopOnMapById(${idx}); event.stopPropagation();" style="background:#0284c7;color:white;padding:3px 7px;border-radius:8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;white-space:nowrap;border:1px solid #ffffff;">🚏 ${s.name}${dirTag}</div>`,
        yAnchor: 2.4,
        clickable: true
      });
      overlay.setMap(AppState.kakaoCategoryMap);
      AppState.categoryMarkers.push(overlay);

      kakao.maps.event.addListener(marker, "click", () => {
        selectBusStopOnMap(s);
      });
    });
  } else if (cat === "restaurant" && AppState.cachedPlaces) {
    AppState.cachedPlaces.forEach((p, idx) => {
      const pLat = Number(p.lat || p.latitude || (AppState.location.lat + (Math.random() - 0.5) * 0.008));
      const pLon = Number(p.lon || p.longitude || (AppState.location.lon + (Math.random() - 0.5) * 0.008));
      const pos = new kakao.maps.LatLng(pLat, pLon);
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      const safeName = (p.name || '').replace(/'/g, "\\'");
      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: `<div onclick="focusRestaurantByName('${safeName}'); event.stopPropagation();" style="background:#ea580c;color:white;padding:3px 7px;border-radius:8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;white-space:nowrap;">🍽️ ${p.name}</div>`,
        yAnchor: 2.4,
        clickable: true
      });
      overlay.setMap(AppState.kakaoCategoryMap);
      AppState.categoryMarkers.push(overlay);

      kakao.maps.event.addListener(marker, "click", () => {
        focusRestaurantByName(p.name);
      });
    });
  } else if (cat === "hospital" && AppState.cachedHospitals) {
    AppState.cachedHospitals.forEach((h, idx) => {
      const hLat = Number(h.lat || h.latitude || (AppState.location.lat + (Math.random() - 0.5) * 0.006));
      const hLon = Number(h.lon || h.longitude || (AppState.location.lon + (Math.random() - 0.5) * 0.006));
      const pos = new kakao.maps.LatLng(hLat, hLon);
      const isPharm = (h.type === "약국");
      const marker = new kakao.maps.Marker({
        position: pos,
        map: AppState.kakaoCategoryMap
      });
      AppState.categoryMarkers.push(marker);

      const pinBg = isPharm ? '#10b981' : '#2563eb';
      const pinIcon = isPharm ? '💊' : '🏥';
      const safeHName = (h.name || '').replace(/'/g, "\\'");
      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: `<div onclick="focusHospitalByName('${safeHName}'); event.stopPropagation();" style="background:${pinBg};color:white;padding:3px 7px;border-radius:8px;font-size:11px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;white-space:nowrap;">${pinIcon} ${h.name}</div>`,
        yAnchor: 2.4,
        clickable: true
      });
      overlay.setMap(AppState.kakaoCategoryMap);
      AppState.categoryMarkers.push(overlay);

      kakao.maps.event.addListener(marker, "click", () => {
        focusHospitalByName(h.name);
      });
    });
  }
}

// ==========================================
// 거리 계산, 경로선(Polyline) 및 2단계 버스 루트 빌더 헬퍼
// ==========================================
function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLon = (lon2 - lon1) * Math.PI / 180.0;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function getDistanceFromHome(targetLat, targetLon) {
  const homeLat = AppState.location.lat;
  const homeLon = AppState.location.lon;
  const dKm = calcDistanceKm(homeLat, homeLon, targetLat, targetLon);
  const dText = dKm < 1 ? `${Math.round(dKm * 1000)}m` : `${dKm.toFixed(1)}km`;
  const walkMin = Math.max(1, Math.round((dKm / 4.0) * 60)); // 시속 4km 도보 기준
  const carMin = Math.max(1, Math.round((dKm / 25.0) * 60)); // 시속 25km 시내 차량 기준
  return { dKm, dText, walkMin, carMin };
}

// 집(평내유진마젤란) ➔ 식당/약국/병원 경로선 긋기
function drawRouteFromHome(destLat, destLon, title = "") {
  clearCategoryRouteLine();
  const homeLat = AppState.location.lat;
  const homeLon = AppState.location.lon;

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    const linePath = [
      new kakao.maps.LatLng(homeLat, homeLon),
      new kakao.maps.LatLng(destLat, destLon)
    ];
    AppState.categoryRouteLine = new kakao.maps.Polyline({
      map: AppState.kakaoCategoryMap,
      path: linePath,
      strokeWeight: 4,
      strokeColor: '#0ea5e9',
      strokeOpacity: 0.85,
      strokeStyle: 'dash'
    });

    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(linePath[0]);
    bounds.extend(linePath[1]);
    AppState.kakaoCategoryMap.setBounds(bounds);
  } else if (AppState.leafletCategoryMap) {
    AppState.categoryRouteLine = L.polyline(
      [[homeLat, homeLon], [destLat, destLon]],
      { color: '#0ea5e9', weight: 4, dashArray: '6, 8', opacity: 0.85 }
    ).addTo(AppState.leafletCategoryMap);
    AppState.leafletCategoryMap.fitBounds(AppState.categoryRouteLine.getBounds(), { padding: [35, 35] });
  }
}

function clearCategoryRouteLine() {
  if (AppState.categoryRouteLine) {
    if (AppState.mapEngine === "kakao" && AppState.categoryRouteLine.setMap) {
      AppState.categoryRouteLine.setMap(null);
    } else if (AppState.categoryRouteLine.remove) {
      AppState.categoryRouteLine.remove();
    }
    AppState.categoryRouteLine = null;
  }
}

// ==========================================
// 🚌 2단계 버스 루트 빌더 (출발지 ➔ 도착지)
// ==========================================
function resetTransitRouteBuilder(silent = false) {
  AppState.transitRouteBuilder = { origin: null, destination: null };
  clearTransitRouteLine();
  if (AppState.transitOriginMarker) {
    if (AppState.mapEngine === "kakao" && AppState.transitOriginMarker.setMap) {
      AppState.transitOriginMarker.setMap(null);
    } else if (AppState.transitOriginMarker.remove) {
      AppState.transitOriginMarker.remove();
    }
    AppState.transitOriginMarker = null;
  }
  if (AppState.customTransitPin) {
    if (AppState.customTransitPin.setMap) AppState.customTransitPin.setMap(null);
    if (AppState.customTransitPin.remove) AppState.customTransitPin.remove();
    AppState.customTransitPin = null;
  }
  updateMapHelperText();
  if (!silent) {
    showToast("🔄 버스 루트 선택이 초기화되었습니다. 지도에서 출발지를 선택해주세요.", "info");
  }
}

function clearTransitRouteLine() {
  if (AppState.transitRouteLine) {
    if (AppState.mapEngine === "kakao" && AppState.transitRouteLine.setMap) {
      AppState.transitRouteLine.setMap(null);
    } else if (AppState.transitRouteLine.remove) {
      AppState.transitRouteLine.remove();
    }
    AppState.transitRouteLine = null;
  }
}

function setTransitOrigin(place) {
  if (place && place.name) {
    place.name = formatFriendlyPlaceName(place.lat, place.lon, place.address || "", place.name);
  }
  AppState.transitRouteBuilder.origin = place;
  AppState.transitRouteBuilder.destination = null;
  clearTransitRouteLine();

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    if (AppState.transitOriginMarker && AppState.transitOriginMarker.setMap) {
      AppState.transitOriginMarker.setMap(null);
    }
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(place.lat, place.lon),
      content: `<div style="background:#ef4444;color:white;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;white-space:nowrap;">🚩 출발: ${place.name}</div>`,
      yAnchor: 2.2
    });
    overlay.setMap(AppState.kakaoCategoryMap);
    AppState.transitOriginMarker = overlay;
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(place.lat, place.lon));
  } else if (AppState.leafletCategoryMap) {
    if (AppState.transitOriginMarker && AppState.transitOriginMarker.remove) {
      AppState.transitOriginMarker.remove();
    }
    const icon = L.divIcon({
      className: 'origin-marker-pin',
      html: `<div style="background:#ef4444;color:white;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;">🚩 출발: ${place.name}</div>`,
      iconSize: [95, 26],
      iconAnchor: [47, 13]
    });
    AppState.transitOriginMarker = L.marker([place.lat, place.lon], { icon }).addTo(AppState.leafletCategoryMap);
    AppState.leafletCategoryMap.panTo([place.lat, place.lon]);
  }

  updateMapHelperText();
  showToast(`🚩 출발지가 '${place.name}'(으)로 설정되었습니다! 이제 지도에서 도착지 정류소/위치를 터치해주세요.`, "info");
  closeSelectedPlaceCard();
}

function setTransitDestination(place) {
  if (place && place.name) {
    place.name = formatFriendlyPlaceName(place.lat, place.lon, place.address || "", place.name);
  }
  if (!AppState.transitRouteBuilder.origin) {
    setTransitOrigin(place);
    return;
  }

  const origin = AppState.transitRouteBuilder.origin;
  const dest = place;
  AppState.transitRouteBuilder.destination = dest;

  const dKm = calcDistanceKm(origin.lat, origin.lon, dest.lat, dest.lon);
  const dText = dKm < 1 ? `${Math.round(dKm * 1000)}m` : `${dKm.toFixed(1)}km`;
  const estMin = Math.max(2, Math.round((dKm / 20.0) * 60)); // 시내버스 평균 시속 20km

  clearTransitRouteLine();
  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    const linePath = [
      new kakao.maps.LatLng(origin.lat, origin.lon),
      new kakao.maps.LatLng(dest.lat, dest.lon)
    ];
    AppState.transitRouteLine = new kakao.maps.Polyline({
      map: AppState.kakaoCategoryMap,
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#0284c7',
      strokeOpacity: 0.9,
      strokeStyle: 'solid'
    });
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(linePath[0]);
    bounds.extend(linePath[1]);
    AppState.kakaoCategoryMap.setBounds(bounds);
    setTimeout(() => {
      if (AppState.kakaoCategoryMap && AppState.kakaoCategoryMap.getLevel() > 4) {
        AppState.kakaoCategoryMap.setLevel(4); // 과도한 줌아웃 제한(최대 레벨 4: 100m 스케일)으로 촘촘함 방지
      }
    }, 120);
  } else if (AppState.leafletCategoryMap) {
    AppState.transitRouteLine = L.polyline(
      [[origin.lat, origin.lon], [dest.lat, dest.lon]],
      { color: '#0284c7', weight: 5, opacity: 0.9 }
    ).addTo(AppState.leafletCategoryMap);
    AppState.leafletCategoryMap.fitBounds(AppState.transitRouteLine.getBounds(), { padding: [40, 40], maxZoom: 16 });
  }

  updateMapHelperText();

  openSelectedPlaceCard({
    category: "교통",
    categoryTitle: "🚌 나만의 버스 루트 완성",
    categoryClass: "transit",
    name: `${origin.name} ➔ ${dest.name}`,
    address: `출발: ${origin.address || origin.name} / 도착: ${dest.address || dest.name}`,
    phone: "",
    status_info: `이동 거리: 약 ${dText} · 소요 예상: 약 ${estMin}분`,
    lat: dest.lat,
    lon: dest.lon,
    extraHtml: `
      <div class="transit-route-box">
        <div class="transit-route-step-header">
          <span>🏁 버스 이동 루트 (출발 ➔ 도착)</span>
          <button type="button" style="font-size:11px; color:#ef4444; border:none; background:none; cursor:pointer; font-weight:700;" onclick="resetTransitRouteBuilder()">🔄 다시 선택</button>
        </div>
        <div class="transit-route-nodes">
          <div class="transit-route-node origin">
            <span class="node-badge">출발</span>
            <b>${origin.name}</b>
          </div>
          <div style="font-size: 11px; color: #0284c7; padding-left: 12px; font-weight:700;">⬇️ 약 ${dText} (소요 예상: 약 ${estMin}분)</div>
          <div class="transit-route-node dest">
            <span class="node-badge">도착</span>
            <b>${dest.name}</b>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
          <button class="btn-primary" style="width: 100%; padding: 12px 10px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #0284c7, #0369a1); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);" onclick="saveTransitRouteDirect('${origin.name}', '${dest.name}')">
            ⭐ [${origin.name} ➔ ${dest.name}] 즐겨찾기 즉시 저장
          </button>
          <div style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="flex: 1; padding: 8px; font-size: 11px;" onclick="openRouteModal('${origin.name}', '', '${dest.name}', '${origin.name} ➔ ${dest.name}')">
              ✏️ 버스 번호 직접 지정
            </button>
            <button class="btn-secondary" style="flex: 1; padding: 8px; font-size: 11px;" onclick="resetTransitRouteBuilder()">
              다시 선택
            </button>
          </div>
        </div>
      </div>
    `
  });
}

// ==========================================
// 지도 안내 및 지도 핀 직접 꽂기 / 목록 연동 헬퍼
// ==========================================
function updateMapHelperText() {
  const el = document.getElementById("mapHelperText");
  if (!el) return;
  if (AppState.currentCategory === "transit") {
    if (!AppState.transitRouteBuilder.origin) {
      el.innerHTML = "💡 지도에서 정류소(🚏)나 위치를 터치하여 <b>출발지</b>를 선택하세요.";
    } else if (!AppState.transitRouteBuilder.destination) {
      el.innerHTML = `🚩 출발: <b>${AppState.transitRouteBuilder.origin.name}</b> ➔ 이제 지도에서 <b>도착지</b>를 터치하세요! <button onclick="resetTransitRouteBuilder()" style="border:none;background:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:6px;font-size:10px;cursor:pointer;margin-left:4px;">취소</button>`;
    } else {
      el.innerHTML = `✅ <b>${AppState.transitRouteBuilder.origin.name} ➔ ${AppState.transitRouteBuilder.destination.name}</b> 루트 생성 완료! <button onclick="resetTransitRouteBuilder()" style="border:none;background:#f1f5f9;color:#475569;padding:2px 6px;border-radius:6px;font-size:10px;cursor:pointer;margin-left:4px;">다시 선택</button>`;
    }
  } else {
    el.innerHTML = "📍 지도의 마커를 터치하면 <b>우리 집(🏡)에서의 거리와 경로선</b>이 표시되고 즐겨찾기를 체크할 수 있습니다.";
  }
}

// 긴 행정구역/지번 주소를 직관적이고 친숙한 단지/건물/랜드마크 명칭으로 변환 (카카오버스 공식 명칭 최우선 보존)
function formatFriendlyPlaceName(lat, lon, rawAddress = "", buildingName = "") {
  const addrStr = String(rawAddress || "");
  const bStr = String(buildingName || "").trim();

  // 0. 이미 공식 정류소 명칭 형식을 갖추고 있는 경우 원형 보존
  if (bStr.includes("평내화성.유진아파트") || addrStr.includes("평내화성.유진아파트")) return "평내화성.유진아파트";
  if (bStr.includes("평내신명.대주.금호아파트") || addrStr.includes("평내신명.대주.금호아파트")) return "평내신명.대주.금호아파트";
  if (bStr.includes("평내중흥.유라.삼창아파트") || addrStr.includes("평내중흥.유라.삼창아파트")) return "평내중흥.유라.삼창아파트";

  // 1. 역지오코딩 빌딩명/단지명이 제공된 경우 최우선 정제
  if (bStr) {
    if ((bStr.includes("화성") && bStr.includes("유진")) || bStr.includes("몬테소리")) return "평내화성.유진아파트";
    if (bStr.includes("유진") || bStr.includes("마젤란") || bStr.includes("화성")) return "평내화성.유진아파트";
    if (bStr.includes("대주") || bStr.includes("신명")) return "평내신명.대주.금호아파트";
    if (bStr.includes("중흥") || bStr.includes("유라") || bStr.includes("삼창")) return "평내중흥.유라.삼창아파트";
    if (bStr.includes("금강")) return "호평마을금강아파트";
    if (bStr.includes("이마트")) return "이마트 남양주점";
    return bStr.endsWith("아파트") ? bStr : `${bStr}아파트`;
  }

  // 2. 평내화성.유진아파트 (유진몬테소리어린이집 앞 23453 & 화성파크힐즈 앞 23454 실측 지오펜스)
  const yujinDist1 = calcDistanceKm(lat, lon, 37.642380, 127.235250) * 1000;
  const yujinDist2 = calcDistanceKm(lat, lon, 37.642150, 127.235650) * 1000;
  if (yujinDist1 <= 150 || yujinDist2 <= 150 || addrStr.includes("유진") || addrStr.includes("화성") || addrStr.includes("몬테소리") || addrStr.includes("마젤란") || addrStr.includes("평내로 89") || addrStr.includes("평내로 72")) {
    return "평내화성.유진아파트";
  }

  // 3. 평내신명.대주.금호아파트 (실측 지오펜스)
  const shinmyeongDist1 = calcDistanceKm(lat, lon, 37.643800, 127.238500) * 1000;
  const shinmyeongDist2 = calcDistanceKm(lat, lon, 37.643650, 127.238700) * 1000;
  if (shinmyeongDist1 <= 150 || shinmyeongDist2 <= 150 || addrStr.includes("신명") || addrStr.includes("대주") || addrStr.includes("평내로 115")) {
    return "평내신명.대주.금호아파트";
  }

  // 4. 평내중흥.유라.삼창아파트 (실측 지오펜스)
  const jungheungDist1 = calcDistanceKm(lat, lon, 37.646500, 127.241600) * 1000;
  const jungheungDist2 = calcDistanceKm(lat, lon, 37.646300, 127.241800) * 1000;
  if (jungheungDist1 <= 180 || jungheungDist2 <= 180 || addrStr.includes("중흥") || addrStr.includes("유라") || addrStr.includes("평내로 150")) {
    return "평내중흥.유라.삼창아파트";
  }

  const stationDist = calcDistanceKm(lat, lon, 37.653412, 127.244123) * 1000;
  if (stationDist <= 250 || addrStr.includes("늘을2로 20") || addrStr.includes("호평역")) {
    return "평내호평역";
  }

  const centerDist = calcDistanceKm(lat, lon, 37.641500, 127.229000) * 1000;
  if (centerDist <= 180 || addrStr.includes("110") || addrStr.includes("주민센터")) {
    return "평내동주민센터.남양주소방서";
  }

  // 3. 일반 주소인 경우 불필요한 광역 시·도 접두사 제거
  let cleaned = addrStr
    .replace(/^경기\s*남양주시\s*/, "")
    .replace(/^경기도\s*남양주시\s*/, "")
    .replace(/\s*정류소$/, "")
    .replace(/\s*정류장$/, "")
    .trim();

  if (!cleaned || cleaned.length > 25) {
    return `평내동 (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
  }
  return cleaned;
}
window.formatFriendlyPlaceName = formatFriendlyPlaceName;

function findNearestBusStop(lat, lon, maxDistanceMeters = 350) {
  let nearest = null;
  let minDist = Infinity;
  (AppState.cachedTransitStops || []).forEach(s => {
    const sLat = Number(s.lat || s.latitude);
    const sLon = Number(s.lon || s.longitude);
    if (sLat && sLon) {
      const dMeters = calcDistanceKm(lat, lon, sLat, sLon) * 1000;
      if (dMeters < minDist && dMeters <= maxDistanceMeters) {
        minDist = dMeters;
        nearest = s;
      }
    }
  });
  return nearest;
}

function selectBusStopOnMapById(idx) {
  window._justSelectedBusStop = Date.now();
  const s = (AppState.cachedTransitStops || [])[idx];
  if (s) {
    selectBusStopOnMap(s);
  }
}
window.selectBusStopOnMapById = selectBusStopOnMapById;

function handleCategoryMapClick(lat, lon) {
  if (window._justSelectedBusStop && (Date.now() - window._justSelectedBusStop < 600)) {
    return;
  }
  if (AppState.currentCategory === "transit") {
    // 150m 이내에 등록된 버스 정류소가 있는지 우선 감지하여 자동 매핑 (과도한 350m 반경 오매핑 방지)
    const nearestStop = findNearestBusStop(lat, lon, 150);

    if (AppState.transitRouteBuilder.origin && !AppState.transitRouteBuilder.destination) {
      const destName = nearestStop ? nearestStop.name : formatFriendlyPlaceName(lat, lon, nearestStop ? nearestStop.address : "");
      setTransitDestination({
        name: destName,
        lat,
        lon,
        address: nearestStop ? (nearestStop.address || `남양주시 평내동`) : `남양주시 평내동`
      });
    } else {
      if (nearestStop) {
        selectBusStopOnMap(nearestStop);
      } else {
        dropCustomTransitPin(lat, lon);
      }
    }
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

  const nearest = findNearestBusStop(lat, lon, 350);
  let pinTitle = nearest ? nearest.name : formatFriendlyPlaceName(lat, lon);
  let pinAddress = nearest ? (nearest.address || "경기 남양주시 평내동") : "경기 남양주시 평내동";

  // 카카오 역지오코딩 시도하여 정확한 도로명/건물명 획득
  if (!nearest && typeof kakao !== "undefined" && kakao.maps && kakao.maps.services) {
    try {
      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.coord2Address(lon, lat, (result, status) => {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const r = result[0];
          const road = r.road_address ? r.road_address.address_name : "";
          const jibun = r.address ? r.address.address_name : "";
          const bName = (r.road_address && r.road_address.building_name) ? r.road_address.building_name : "";
          const addr = road || jibun;
          if (addr || bName) {
            pinTitle = formatFriendlyPlaceName(lat, lon, addr, bName);
            pinAddress = addr || `경기 남양주시 평내동`;
            const nameEl = document.getElementById("selPlaceName");
            if (nameEl) nameEl.textContent = pinTitle;
            const addrEl = document.getElementById("selPlaceAddress");
            if (addrEl) addrEl.textContent = pinAddress;

            const btnOrigin = document.getElementById("btnSetCustomOrigin");
            if (btnOrigin) {
              btnOrigin.onclick = () => setTransitOrigin({ name: pinTitle, lat, lon, address: pinAddress });
            }
            const btnDest = document.getElementById("btnSetCustomDest");
            if (btnDest) {
              btnDest.onclick = () => {
                setTransitOrigin({ name: "평내유진아파트", lat: AppState.location.lat, lon: AppState.location.lon, address: "우리 집" });
                setTransitDestination({ name: pinTitle, lat, lon, address: pinAddress });
              };
            }
          }
        }
      });
    } catch (e) {}
  }

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
    categoryTitle: "🚏 버스 정류소 선택됨",
    categoryClass: "transit",
    name: pinTitle,
    address: pinAddress,
    phone: "",
    status_info: "지도에서 선택된 정류소 위치",
    lat: lat,
    lon: lon,
    extraHtml: `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 10px; margin-top: 4px;">
        <div style="font-weight: 800; color: #166534; font-size: 12px; margin-bottom: 4px;">🚩 나만의 버스 루트 만들기 (1단계)</div>
        <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">이 위치를 출발지로 할까요, 아니면 도착지로 할까요?</div>
        <div style="display: flex; gap: 6px;">
          <button id="btnSetCustomOrigin" class="btn-primary" style="flex: 1; padding: 8px; font-size: 11px; background: #0284c7;" onclick='setTransitOrigin({ name: "${pinTitle}", lat: ${lat}, lon: ${lon}, address: "${pinAddress}" })'>
            🚩 출발지로 설정
          </button>
          <button id="btnSetCustomDest" class="btn-secondary" style="flex: 1; padding: 8px; font-size: 11px;" onclick='setTransitOrigin({ name: "평내유진아파트", lat: ${AppState.location.lat}, lon: ${AppState.location.lon}, address: "우리 집" }); setTransitDestination({ name: "${pinTitle}", lat: ${lat}, lon: ${lon}, address: "${pinAddress}" });'>
            🏁 우리집에서 오는 도착지로 설정
          </button>
        </div>
      </div>
    `
  });
}

// 기존 카테고리 핀 마커 및 오버레이 전체 초기화
function clearCategoryMarkers() {
  if (AppState.categoryMarkers) {
    AppState.categoryMarkers.forEach(m => {
      if (m.setMap) m.setMap(null);
      if (m.remove) m.remove();
    });
  }
  AppState.categoryMarkers = [];
}

// 전체 핀 다시 보기 복원
function showAllCategoryMarkers() {
  AppState.isSingleFocusMode = false;
  AppState.singleFocusPlace = null;
  clearCategoryMarkers();
  clearCategoryRouteLine();
  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    renderKakaoCategoryMarkers();
    AppState.kakaoCategoryMap.setLevel(4);
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon));
  } else if (AppState.leafletCategoryMap) {
    renderLeafletCategoryMarkers(AppState.leafletCategoryMap);
    AppState.leafletCategoryMap.setView([AppState.location.lat, AppState.location.lon], 15);
  }
  updateMapHelperText();
  showToast("📍 주변 전체 핀이 다시 표시되었습니다.", "info");
}
window.showAllCategoryMarkers = showAllCategoryMarkers;

// 선택한 약국 또는 식당 '단 1곳만' 강조 표시하고, 우리집/내위치 핀과 경로선(Polyline)을 렌더링
async function focusSinglePlaceOnMap(place, category) {
  AppState.isSingleFocusMode = true;
  AppState.singleFocusPlace = place;

  switchDetailView('map', false);

  if (!AppState.kakaoCategoryMap && !AppState.leafletCategoryMap) {
    await initCategoryKakaoMap();
  }

  const pLat = Number(place.lat || place.latitude || (AppState.location.lat + 0.003));
  const pLon = Number(place.lon || place.longitude || (AppState.location.lon + 0.003));
  const isPharm = (category === "약국" || place.type === "약국");
  const isRestaurant = (category === "식당");

  // 1. 기존 주변 수십 개 핀들을 모두 숨김 (단일 핀 포커스를 위해)
  clearCategoryMarkers();
  clearCategoryRouteLine();

  // 2. 카카오맵인 경우
  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    const map = AppState.kakaoCategoryMap;

    // 우리 집 마커 & 오버레이 보장
    const homePos = new kakao.maps.LatLng(AppState.location.lat, AppState.location.lon);
    const homeMarker = new kakao.maps.Marker({ position: homePos, map: map });
    AppState.categoryMarkers.push(homeMarker);
    const homeOverlay = new kakao.maps.CustomOverlay({
      position: homePos,
      content: '<div style="padding: 4px 8px; background: #0f172a; color: white; font-size: 11px; font-weight: 800; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); white-space:nowrap;">🏡 우리 집 (내 위치)</div>',
      yAnchor: 2.2
    });
    homeOverlay.setMap(map);
    AppState.categoryMarkers.push(homeOverlay);

    // 선택한 장소 단일 마커 & 강조 커스텀 오버레이
    const targetPos = new kakao.maps.LatLng(pLat, pLon);
    const targetMarker = new kakao.maps.Marker({ position: targetPos, map: map });
    AppState.categoryMarkers.push(targetMarker);

    const pinBg = isPharm ? '#10b981' : (isRestaurant ? '#f97316' : '#3b82f6');
    const pinIcon = isPharm ? '💊' : (isRestaurant ? '🍽️' : '🏥');
    const targetOverlay = new kakao.maps.CustomOverlay({
      position: targetPos,
      content: `<div style="background:${pinBg};color:white;padding:4px 8px;border-radius:10px;font-size:12px;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;white-space:nowrap;">${pinIcon} ${place.name}</div>`,
      yAnchor: 2.2
    });
    targetOverlay.setMap(map);
    AppState.categoryMarkers.push(targetOverlay);

    // 두 지점(우리집 ➔ 선택장소)이 한눈에 쏙 들어오도록 자동 줌 레벨 맞춤 (과도한 줌아웃 제한으로 촘촘함 방지)
    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(homePos);
    bounds.extend(targetPos);
    map.setBounds(bounds);
    setTimeout(() => {
      if (map && map.getLevel() > 4) {
        map.setLevel(4); // 최대 레벨 4로 제한하여 주변 골목과 단지가 시원하게 보이도록 보장
      }
      map.relayout();
    }, 120);

  } else if (AppState.leafletCategoryMap) {
    // Leaflet인 경우
    const map = AppState.leafletCategoryMap;

    const homeIcon = L.divIcon({
      className: 'custom-home-pin',
      html: '<div style="background:#0f172a;color:white;padding:4px 8px;border-radius:10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid #ffffff;">🏡 우리 집 (내 위치)</div>',
      iconSize: [60, 24],
      iconAnchor: [30, 12]
    });
    const hm = L.marker([AppState.location.lat, AppState.location.lon], { icon: homeIcon }).addTo(map);
    AppState.categoryMarkers.push(hm);

    const pinBg = isPharm ? '#10b981' : (isRestaurant ? '#f97316' : '#3b82f6');
    const pinIcon = isPharm ? '💊' : (isRestaurant ? '🍽️' : '🏥');
    const targetIcon = L.divIcon({
      className: 'cat-marker-pin',
      html: `<div style="background:${pinBg};color:white;padding:4px 8px;border-radius:10px;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.3);border:2px solid #ffffff;">${pinIcon} ${place.name}</div>`,
      iconSize: [80, 26],
      iconAnchor: [40, 13]
    });
    const tm = L.marker([pLat, pLon], { icon: targetIcon }).addTo(map);
    AppState.categoryMarkers.push(tm);

    const group = L.featureGroup([hm, tm]);
    map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 16 });
  }

  // 집 ➔ 목적지 네온 경로선 렌더링
  drawRouteFromHome(pLat, pLon, place.name);

  // 상단 안내창에 단일 포커스 안내 및 전체 핀 복원 버튼 노출
  const helperEl = document.getElementById("mapHelperText");
  if (helperEl) {
    helperEl.innerHTML = `📍 <b>${place.name}</b> 위치 포커스됨 (🏡 우리 집에서 경로선 표시) <button onclick="showAllCategoryMarkers()" style="border:none;background:#f1f5f9;color:#0284c7;font-weight:700;padding:2px 7px;border-radius:6px;font-size:11px;cursor:pointer;margin-left:6px;">📍 전체 핀 보기</button>`;
  }

  // 바텀 카드 열기
  openSelectedPlaceCard({
    category: isPharm ? "약국" : (isRestaurant ? "식당" : "병원"),
    categoryTitle: isPharm ? "💊 안심 약국" : (isRestaurant ? "🍽️ 추천 맛집" : "🏥 안심 병원"),
    categoryClass: isPharm ? "pharmacy" : (isRestaurant ? "restaurant" : "hospital"),
    name: place.name,
    address: place.address || "경기도 남양주시 평내동",
    phone: place.phone,
    status_info: place.status_badge || "영업중",
    lat: pLat,
    lon: pLon,
    extraHtml: `<div style="color: ${isPharm ? '#059669' : (isRestaurant ? '#ea580c' : '#2563eb')}; font-weight: 700;">${place.weekend_info || place.status_badge || '영업 정보'}</div>`
  });
}

// 약국/병원 이름 기반 단일 핀 포커스 (검색 및 필터 시 인덱스 불일치 완벽 방지)
function focusHospitalByName(name) {
  const h = (AppState.cachedHospitals || []).find(item => item.name === name);
  if (h) {
    focusSinglePlaceOnMap(h, h.type);
  }
}
window.focusHospitalByName = focusHospitalByName;

// 식당 이름 기반 단일 핀 포커스
function focusRestaurantByName(name) {
  const p = (AppState.cachedPlaces || []).find(item => item.name === name);
  if (p) {
    focusSinglePlaceOnMap(p, "식당");
  }
}
window.focusRestaurantByName = focusRestaurantByName;

// 약국/병원 목록에서 선택 시 지도로 즉시 전환 & 단일 핀 포커스 & 즐겨찾기 체크
function focusHospitalOnMap(idx) {
  const h = (AppState.cachedHospitals || [])[idx];
  if (!h) return;
  focusSinglePlaceOnMap(h, h.type);
}

// 식당 목록에서 선택 시 지도로 즉시 전환 & 단일 핀 포커스
function focusRestaurantOnMap(idx) {
  const p = (AppState.cachedPlaces || [])[idx];
  if (!p) return;
  focusSinglePlaceOnMap(p, "식당");
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
  const distBox = document.getElementById("selPlaceDistanceBox");
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

  // 집 ➔ 목적지 거리 & 도보/차량 예상 시간 표출 및 경로선 긋기 (식당, 병원, 약국)
  if (distBox) {
    if (data.lat && data.lon && (data.categoryClass === "restaurant" || data.categoryClass === "hospital" || data.categoryClass === "pharmacy")) {
      const distInfo = getDistanceFromHome(data.lat, data.lon);
      distBox.style.display = "flex";
      distBox.innerHTML = `
        <span class="dist-pill">🏡 <b>우리 집(평내유진마젤란)</b>에서 <b>${distInfo.dText}</b></span>
        <span class="time-pill">🚶 도보 약 ${distInfo.walkMin}분</span>
        <span class="time-pill">🚗 차량 약 ${distInfo.carMin}분</span>
      `;
      drawRouteFromHome(data.lat, data.lon, data.name);
    } else {
      distBox.style.display = "none";
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

  // 화면 크기에 따라 하단 버튼이 잘리지 않도록 자동 스크롤
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
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
  clearCategoryRouteLine();
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

// 버스 정류소 핀 클릭 시 실시간 도착 정보 조회 및 자동 출발지/도착지 즐겨찾기 연동 (명칭 일치 보장)
async function selectBusStopOnMap(stop, customDirection = null) {
  const sLat = Number(stop.lat || stop.latitude || (AppState.location.lat + 0.001));
  const sLon = Number(stop.lon || stop.longitude || (AppState.location.lon - 0.001));
  const curDir = customDirection || stop.direction || AppState.selectedBusStopDirection || "hopyeong";
  AppState.selectedBusStopDirection = curDir;

  // 만약 2단계 루트 빌더에서 출발지가 이미 지정된 상태라면 -> 즉시 도착지로 매핑 & 바로 즐겨찾기 저장 뷰 오픈!
  if (AppState.transitRouteBuilder.origin && !AppState.transitRouteBuilder.destination) {
    setTransitDestination({
      name: stop.name,
      lat: sLat,
      lon: sLon,
      address: stop.address || `남양주시 평내동 정류소`
    });
    return;
  }

  // 출발지가 없는 상태에서 정류장 선택 시 -> 자동으로 출발지로 즉시 세팅 & 지도 안내
  setTransitOrigin({
    name: stop.name,
    lat: sLat,
    lon: sLon,
    address: stop.address || `남양주시 평내동 정류소`
  });

  // 지도 위 오버레이 깃발과 하단 시트에서 100% 동일하게 사용할 단일 표준 명칭
  const standardName = (AppState.transitRouteBuilder.origin && AppState.transitRouteBuilder.origin.name) || stop.name;

  if (AppState.mapEngine === "kakao" && AppState.kakaoCategoryMap) {
    AppState.kakaoCategoryMap.panTo(new kakao.maps.LatLng(sLat, sLon));
  } else if (AppState.leafletCategoryMap) {
    AppState.leafletCategoryMap.panTo([sLat, sLon]);
  }

  const isHopyeong = curDir === "hopyeong";
  const defaultNextDir = isHopyeong ? "평내신명.대주.금호아파트 방면" : "평내동주민센터.남양주소방서 방면";
  const defaultArsId = isHopyeong ? "23453" : "23454";

  openSelectedPlaceCard({
    category: "교통",
    categoryTitle: "🚏 출발 정류소 선택됨",
    categoryClass: "transit",
    name: standardName,
    address: `남양주시 평내동 (집에서 약 ${stop.distance || 120}m)`,
    phone: "",
    status_info: `출발지 지정됨 · ${isHopyeong ? '호평동·평내호평역 방면' : '청량리·잠실·서울 방면'}`,
    lat: sLat,
    lon: sLon,
    extraHtml: `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px; margin-bottom: 10px;">
        <div style="font-weight: 800; color: #166534; font-size: 13.5px; margin-bottom: 4px;">🚩 출발지: <b>${standardName}</b></div>
        <div style="font-size: 11.5px; color: #334155; line-height: 1.4; margin-bottom: 8px;">
          👉 지도에서 <b>도착할 정류소(또는 위치)</b>를 터치하시면 <b>'출발지 ➔ 도착지'</b> 루트가 자동 생성되어 원클릭으로 즐겨찾기 저장할 수 있습니다.
        </div>

        <!-- 🏢 호평동 방면 vs 🏙️ 서울 방면 양방향 원클릭 전환 탭 바 -->
        <div style="display: flex; gap: 6px; margin: 8px 0; background: #e2e8f0; padding: 4px; border-radius: 10px;">
          <button style="flex: 1; padding: 8px 4px; font-size: 11.5px; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; ${isHopyeong ? 'background: #0284c7; color: white; box-shadow: 0 2px 5px rgba(2,132,199,0.3);' : 'background: white; color: #475569;'}" onclick="switchStationDirection('${standardName}', 'hopyeong')">
            🏢 호평동·수진사 방면
          </button>
          <button style="flex: 1; padding: 8px 4px; font-size: 11.5px; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; ${!isHopyeong ? 'background: #0284c7; color: white; box-shadow: 0 2px 5px rgba(2,132,199,0.3);' : 'background: white; color: #475569;'}" onclick="switchStationDirection('${standardName}', 'seoul')">
            🏙️ 서울·잠실·청량리 방면
          </button>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="btn-primary" style="flex: 2; padding: 10px; font-size: 12px; font-weight: 800; background: #0284c7;" onclick="saveTransitRouteDirect('${standardName}', '${isHopyeong ? '호평동·수진사 방면' : '청량리·잠실 서울 방면'}')">
            ⭐ [${standardName}] ${isHopyeong ? '호평동 방면' : '서울 방면'} 즐겨찾기 저장
          </button>
          <button class="btn-secondary" style="flex: 1; padding: 10px; font-size: 11px;" onclick="resetTransitRouteBuilder()">
            🔄 초기화
          </button>
        </div>
      </div>
      <div style="color: #64748b; padding: 4px; font-size: 12px;">🚏 실시간 도착 예정 버스 조회 중... 🚌</div>
    `
  });

  try {
    const res = await fetch(`/api/transit/station-arrivals?station_name=${encodeURIComponent(standardName)}&direction=${curDir}`);
    const data = await res.json();
    const arrivals = data.arrivals || [];
    const nextDir = data.next_direction || defaultNextDir;
    const arsId = data.ars_id || defaultArsId;

    let extraHtml = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 12px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div style="font-weight: 800; color: #166534; font-size: 13.5px;">🚩 출발지: <b>${standardName}</b></div>
          <span style="font-size: 11px; background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 6px; font-weight: 700;">정류소 번호: ${arsId}</span>
        </div>

        <!-- 카카오버스 공식 방면 정보 배너 -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 7px 10px; margin: 6px 0; font-size: 12px; color: #1e40af; font-weight: 700; display: flex; align-items: center; gap: 6px;">
          <span>👉</span>
          <span>다음 방면: <b>${nextDir}</b></span>
        </div>

        <div style="font-size: 11.5px; color: #334155; line-height: 1.4; margin-bottom: 6px;">
          지도에서 <b>도착할 정류소</b>를 터치하시면 <b>'출발지 ➔ 도착지'</b> 루트가 자동 완성됩니다!
        </div>

        <!-- 🏢 호평동 방면 vs 🏙️ 서울 방면 양방향 원클릭 전환 탭 바 -->
        <div style="display: flex; gap: 6px; margin: 8px 0; background: #e2e8f0; padding: 4px; border-radius: 10px;">
          <button style="flex: 1; padding: 8px 4px; font-size: 11.5px; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; ${isHopyeong ? 'background: #0284c7; color: white; box-shadow: 0 2px 5px rgba(2,132,199,0.3);' : 'background: white; color: #475569;'}" onclick="switchStationDirection('${standardName}', 'hopyeong')">
            🏢 호평동·수진사 방면
          </button>
          <button style="flex: 1; padding: 8px 4px; font-size: 11.5px; font-weight: 800; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; ${!isHopyeong ? 'background: #0284c7; color: white; box-shadow: 0 2px 5px rgba(2,132,199,0.3);' : 'background: white; color: #475569;'}" onclick="switchStationDirection('${standardName}', 'seoul')">
            🏙️ 서울·잠실·청량리 방면
          </button>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="btn-primary" style="flex: 2; padding: 10px; font-size: 12px; font-weight: 800; background: #0284c7;" onclick="saveTransitRouteDirect('${standardName}', '${isHopyeong ? '호평동·수진사 방면' : '청량리·잠실 서울 방면'}')">
            ⭐ [${standardName}] ${isHopyeong ? '호평동 방면' : '서울 방면'} 즐겨찾기 저장
          </button>
          <button class="btn-secondary" style="flex: 1; padding: 10px; font-size: 11px;" onclick="resetTransitRouteBuilder()">
            🔄 초기화
          </button>
        </div>
      </div>
    `;

    if (arrivals.length > 0) {
      extraHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 800; color: #0369a1; font-size: 12px;">🚌 실시간 도착 예정 버스 (${arrivals.length}대 - ${isHopyeong ? '호평동 방면' : '서울 방면'})</span>
          <span style="font-size: 11px; color: #64748b;">🔔 터치 시 10/5/3분 알림</span>
        </div>
        <div class="station-arrival-list">
          ${arrivals.map(a => {
            const hasAlarm = AppState.busAlerts.some(al => al.routeNo === a.route_no && al.stationName === standardName);
            return `
              <div class="station-arrival-item" style="cursor: pointer;" onclick="openBusAlarmModal({ route_no: '${a.route_no}', station_name: '${standardName}', destination: '${a.destination}', remain_time: '${a.remain_time}' })">
                <div>
                  <span class="bus-num-pill" style="background: ${a.badge_color};">${a.route_no}</span>
                  <span style="font-weight: 700; margin-left: 6px; color: #334155; font-size: 12px;">➔ ${a.destination}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="text-align: right;">
                    <div style="font-weight: 800; color: #e11d48; font-size: 12px;">${a.remain_time}</div>
                    <div style="font-size: 10px; color: #64748b;">${a.remain_stops}</div>
                  </div>
                  <button class="btn-alarm-set ${hasAlarm ? 'active' : ''}" onclick="event.stopPropagation(); openBusAlarmModal({ route_no: '${a.route_no}', station_name: '${standardName}', destination: '${a.destination}', remain_time: '${a.remain_time}' })">
                    ${hasAlarm ? '🔔 예약됨' : '🔔 알림'}
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;
    } else {
      extraHtml += `
        <div style="color: #64748b; font-size: 11px;">현재 운행 중인 도착 예정 버스가 없습니다.</div>
      `;
    }

    const extraBox = document.getElementById("selPlaceExtraBox");
    if (extraBox && AppState.selectedPlace && AppState.selectedPlace.name === standardName) {
      extraBox.innerHTML = extraHtml;
    }
  } catch (e) {
    console.warn("fetch station arrivals error:", e);
  }
}

// 정류소 상세 시트에서 [호평동 방면] ⇄ [서울 방면] 방향 즉시 전환 함수
function switchStationDirection(stationName, newDirection) {
  AppState.selectedBusStopDirection = newDirection;
  let targetStop = (AppState.cachedTransitStops || []).find(s => s.name === stationName);
  if (!targetStop && AppState.selectedPlace) {
    targetStop = {
      name: stationName,
      lat: AppState.selectedPlace.lat,
      lon: AppState.selectedPlace.lon,
      direction: newDirection
    };
  } else if (targetStop) {
    targetStop = Object.assign({}, targetStop, { direction: newDirection });
  }
  if (targetStop) {
    selectBusStopOnMap(targetStop, newDirection);
  }
}
window.switchStationDirection = switchStationDirection;

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

  // 1. 현재 활성화된 버스 알림 예약 현황 바
  let activeAlarmsHtml = "";
  if (AppState.busAlerts && AppState.busAlerts.length > 0) {
    activeAlarmsHtml = `
      <div class="active-bus-alarms-bar">
        <div class="active-bus-alarms-header">
          <span>🔔 실시간 도착 알림 대기 중 (${AppState.busAlerts.length}대)</span>
          <span style="font-size: 10.5px; color: #15803d; font-weight: 700;">10분/5분/3분 전 알림</span>
        </div>
        <div class="active-bus-alarms-list">
          ${AppState.busAlerts.map(al => `
            <div class="active-bus-alarm-chip">
              <div>
                <span class="bus-num-pill" style="font-size: 11px; padding: 2px 7px;">${al.routeNo}번</span>
                <strong style="margin-left: 4px; color: #334155;">${al.stationName}</strong>
                <span style="font-size: 10.5px; color: #0284c7; margin-left: 4px;">(${al.stages.join(", ")}분 전)</span>
              </div>
              <button style="border:none; background:#fee2e2; color:#b91c1c; border-radius:6px; padding:3px 8px; font-size:10.5px; font-weight:700; cursor:pointer;" onclick="removeBusAlarm('${al.id}')">
                ✕ 해제
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  el.innerHTML = `
    ${activeAlarmsHtml}

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
      <span style="font-size: 13px; font-weight: 800;">🚌 내 즐겨찾기 구간 및 운행 버스 시간표</span>
      <span style="font-size: 11px; color: #0284c7; font-weight: 700;">상단 🗺️ 지도 탭에서도 정류소 선택 가능</span>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${routes.map(r => {
        const allBuses = r.all_buses || [];
        return `
          <div class="item-card" style="padding: 12px;">
            <div class="item-card-top" style="align-items: center;">
              <div>
                <span class="item-name" style="font-size: 13px; color: #0f172a;">${r.title || (r.station_name + ' ➔ ' + (r.dest_station_name || r.destination))}</span>
                <div class="item-desc" style="margin-top: 2px;">📍 ${r.station_name} ➔ ${r.dest_station_name || r.destination || '시내방면'}</div>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="item-badge" style="background: ${r.badge_color}; color: white;">${r.remain_time}</span>
                <button style="border:none; background:#fee2e2; color:#b91c1c; border-radius:6px; padding:3px 7px; font-size:11px; cursor:pointer;" title="즐겨찾기 삭제" onclick="deleteTransitRoute(${r.id})">🗑️</button>
              </div>
            </div>

            <!-- 구간 내 운행 버스 전체 실시간 시간표 -->
            <div class="route-all-buses-box">
              <div class="route-all-buses-header">
                <span>🚌 이 구간 운행 버스 전체 시간표 (${allBuses.length}대)</span>
                <span style="font-size: 10px; color: #0284c7;">🔔 터치 시 10/5/3분 도착 알림</span>
              </div>
              ${allBuses.length > 0 ? allBuses.map(b => {
                const hasAlarm = AppState.busAlerts.some(al => al.routeNo === b.route_no && al.stationName === r.station_name);
                return `
                  <div class="bus-row-item">
                    <div class="bus-row-left">
                      <span class="bus-num-pill" style="background: ${b.badge_color}; font-size: 11px;">${b.route_no}</span>
                      <div>
                        <div style="font-weight: 700; font-size: 11.5px; color: #334155;">➔ ${b.destination}</div>
                        <div style="font-size: 10px; color: #64748b;">${b.type_desc || '일반'} · ${b.remain_stops}</div>
                      </div>
                    </div>
                    <div class="bus-row-right">
                      <span style="font-weight: 800; color: #e11d48; font-size: 12px;">${b.remain_time}</span>
                      <button class="btn-alarm-set ${hasAlarm ? 'active' : ''}" onclick="openBusAlarmModal({ route_no: '${b.route_no}', station_name: '${r.station_name}', destination: '${b.destination}', remain_time: '${b.remain_time}' })">
                        ${hasAlarm ? '🔔 예약됨' : '🔔 알림'}
                      </button>
                    </div>
                  </div>
                `;
              }).join("") : `
                <div style="font-size: 11px; color: #64748b; padding: 6px;">현재 운행 중인 다른 노선 버스가 없습니다.</div>
              `}
            </div>
          </div>
        `;
      }).join("")}
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
            ${arrivals.map(a => {
              const hasAlarm = AppState.busAlerts.some(al => al.routeNo === a.route_no && al.stationName === stationName);
              return `
                <div class="station-arrival-item" style="cursor: pointer;" onclick="openBusAlarmModal({ route_no: '${a.route_no}', station_name: '${stationName}', destination: '${a.destination}', remain_time: '${a.remain_time}' })">
                  <div>
                    <span class="bus-num-pill" style="background: ${a.badge_color};">${a.route_no}</span>
                    <span style="font-weight: 700; margin-left: 6px; color: #334155;">➔ ${a.destination}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="text-align: right;">
                      <span style="font-weight: 800; color: #e11d48;">${a.remain_time}</span>
                      <span style="font-size: 10px; color: #64748b; margin-left: 4px;">(${a.remain_stops})</span>
                    </div>
                    <button class="btn-alarm-set ${hasAlarm ? 'active' : ''}" onclick="event.stopPropagation(); openBusAlarmModal({ route_no: '${a.route_no}', station_name: '${stationName}', destination: '${a.destination}', remain_time: '${a.remain_time}' })">
                      ${hasAlarm ? '🔔 예약됨' : '🔔 알림'}
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
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
  AppState.currentHospitalFilter = "ALL";
  renderHospitalDetailContent(el, "ALL", "");
}

function renderHospitalDetailContent(el, currentFilter = "ALL", searchQuery = "") {
  AppState.currentHospitalFilter = currentFilter;
  let items = AppState.cachedHospitals || [];
  if (searchQuery) {
    const qLower = searchQuery.toLowerCase();
    items = items.filter(h =>
      (h.name && h.name.toLowerCase().includes(qLower)) ||
      (h.address && h.address.toLowerCase().includes(qLower)) ||
      (h.badge && h.badge.toLowerCase().includes(qLower))
    );
  }
  const favList = AppState.favoritePlaces || [];

  el.innerHTML = `
    <!-- 약국 / 병원 검색창 -->
    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <input type="text" id="inputSearchHospitalQuery" placeholder="약국명 또는 병원 검색 (예: 평내약국, 소아과)" value="${searchQuery}" style="flex: 1; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 13px; outline: none;" onkeypress="if(event.key==='Enter') executeHospitalSearch()">
      <button class="btn-primary" style="padding: 9px 14px; font-size: 12px; font-weight: 800; border-radius: 10px; background: #0284c7;" onclick="executeHospitalSearch()">검색</button>
    </div>

    <div style="display: flex; gap: 6px; margin-bottom: 10px;">
      <button class="btn-mini ${currentFilter === 'ALL' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'ALL' ? '#0284c7' : '#e2e8f0'}; color: ${currentFilter === 'ALL' ? 'white' : '#334155'};" onclick="filterHospitalList('ALL')">전체</button>
      <button class="btn-mini ${currentFilter === 'PHARMACY' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'PHARMACY' ? '#10b981' : '#ecfdf5'}; color: ${currentFilter === 'PHARMACY' ? 'white' : '#059669'};" onclick="filterHospitalList('PHARMACY')">약국만</button>
      <button class="btn-mini ${currentFilter === 'CHILDREN' ? 'btn-fav' : ''}" style="background: ${currentFilter === 'CHILDREN' ? '#db2777' : '#fdf2f8'}; color: ${currentFilter === 'CHILDREN' ? 'white' : '#db2777'};" onclick="filterHospitalList('CHILDREN')">소아과/달빛</button>
    </div>

    <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 8px;">
      💡 약국이나 병원을 터치하면 <b>지도 위치로 이동하고 단 1곳만 핀이 꽂혀 즐겨찾기를 바로 체크</b>할 수 있습니다!
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${items.length === 0 ? `
        <div style="text-align: center; padding: 24px; color: #64748b; font-size: 12.5px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
          '<b>${searchQuery}</b>' 검색 결과가 없습니다.
        </div>
      ` : items.map((h, idx) => {
        const isFav = favList.some(p => p.name === h.name);
        const safeName = (h.name || '').replace(/'/g, "\\'");
        return `
          <div class="item-card" style="cursor: pointer;" onclick="focusHospitalByName('${safeName}')">
            <div class="item-card-top">
              <span class="item-name" style="color: #0f172a;">${h.name}</span>
              <span class="item-badge" style="background: ${h.badge_color}; color: white;">${h.badge}</span>
            </div>
            <div class="item-desc">주말: ${h.weekend_info}</div>
            <div class="item-desc" style="color: #64748b; font-size: 11px;">📍 ${h.address}</div>
            <div class="item-action-row" onclick="event.stopPropagation()">
              <button class="btn-mini btn-fav" style="background: #e0f2fe; color: #0369a1;" onclick="focusHospitalByName('${safeName}')">🗺️ 지도 위치 보기</button>
              <button class="btn-mini btn-fav ${isFav ? 'is-fav' : ''}" style="background: ${isFav ? '#fffbeb' : '#ecfdf5'}; color: ${isFav ? '#b45309' : '#047857'}; border: 1px solid ${isFav ? '#fde68a' : '#a7f3d0'};" onclick="quickAddFavoriteHospitalByName('${safeName}')">
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

function executeHospitalSearch() {
  const inp = document.getElementById("inputSearchHospitalQuery");
  const q = inp ? inp.value.trim() : "";
  const contentEl = document.getElementById("categoryDetailContent") || document.getElementById("sheetContent");
  if (contentEl) {
    renderHospitalDetailContent(contentEl, AppState.currentHospitalFilter || "ALL", q);
  }
}
window.executeHospitalSearch = executeHospitalSearch;

function quickAddFavoriteHospitalByName(name) {
  const h = (AppState.cachedHospitals || []).find(item => item.name === name);
  if (!h) return;
  quickAddFavoritePlace(h.type, h.name, h.address, h.phone, h.status_badge);
}
window.quickAddFavoriteHospitalByName = quickAddFavoriteHospitalByName;

function quickAddFavoriteHospitalById(idx) {
  const h = (AppState.cachedHospitals || [])[idx];
  if (!h) return;
  quickAddFavoritePlace(h.type, h.name, h.address, h.phone, h.status_badge);
}
window.quickAddFavoriteHospitalById = quickAddFavoriteHospitalById;

function quickAddFavoriteRestaurantByName(name) {
  const p = (AppState.cachedPlaces || []).find(item => item.name === name);
  if (!p) return;
  quickAddFavoritePlace('식당', p.name, p.address, p.phone || '', p.status_badge || p.category || '');
}
window.quickAddFavoriteRestaurantByName = quickAddFavoriteRestaurantByName;

function quickAddFavoriteRestaurantById(idx) {
  const p = (AppState.cachedPlaces || [])[idx];
  if (!p) return;
  quickAddFavoritePlace('식당', p.name, p.address, p.phone, p.status_badge);
}
window.quickAddFavoriteRestaurantById = quickAddFavoriteRestaurantById;

async function filterHospitalList(filterType) {
  const contentEl = document.getElementById("categoryDetailContent") || document.getElementById("sheetContent");
  if (!contentEl) return;
  try {
    const res = await fetch(`/api/hospital?filter_type=${filterType}`);
    const data = await res.json();
    AppState.cachedHospitals = data.items || [];
    renderHospitalDetailContent(contentEl, filterType, "");
    if (AppState.detailViewMode === "map") {
      if (AppState.mapEngine === "kakao") renderKakaoCategoryMarkers();
      else if (AppState.leafletCategoryMap) renderLeafletCategoryMarkers(AppState.leafletCategoryMap);
    }
  } catch (e) {
    console.error("Filter hospital error:", e);
  }
}

async function renderRestaurantDetail(el) {
  const lat = AppState.location.lat;
  const lon = AppState.location.lon;
  const res = await fetch(`/api/restaurant/search?query=맛집&lat=${lat}&lon=${lon}`);
  const places = await res.json();
  AppState.cachedPlaces = places || [];

  el.innerHTML = `
    <!-- 식당/메뉴 검색창 -->
    <div style="display: flex; gap: 6px; margin-bottom: 8px;">
      <input type="text" id="inputSearchRestQuery" placeholder="식당, 카페, 메뉴 검색 (예: 순대국, 파스타, 고기)" style="flex: 1; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #cbd5e1; font-size: 13px;" onkeydown="if(event.key==='Enter') executeRestSearch()">
      <button onclick="executeRestSearch()" class="btn-primary" style="padding: 10px 16px; font-weight: 800; font-size: 13px; background: #0284c7;">검색</button>
    </div>

    <!-- 빠른 키워드 필터 알약 -->
    <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 10px;">
      <button class="btn-filter-pill" onclick="quickRestSearch('한식')">🍲 한식</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('중식')">🥟 중식</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('일식')">🍣 일식/초밥</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('고기')">🥩 고기/구이</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('카페')">☕ 카페/디저트</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('분식')">🍢 분식</button>
      <button class="btn-filter-pill" onclick="quickRestSearch('치킨')">🍗 치킨</button>
    </div>

    <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 8px;">
      💡 식당 카드를 터치하면 <b>지도 위치로 이동하여 단 1곳만 강조 핀</b>으로 표시되고 우리 집에서의 거리/경로선이 그려집니다!
    </div>

    <div id="restaurantListContainer" style="display: flex; flex-direction: column; gap: 8px;">
      ${buildRestaurantListHtml(AppState.cachedPlaces)}
    </div>
  `;
}

function quickRestSearch(k) {
  const inp = document.getElementById("inputSearchRestQuery");
  if (inp) inp.value = k;
  executeRestSearch();
}

async function executeRestSearch() {
  const inp = document.getElementById("inputSearchRestQuery");
  const q = inp ? inp.value.trim() : "";
  if (!q) {
    if (typeof showToast === 'function') showToast("검색할 식당명이나 메뉴를 입력해 주세요.", "info");
    return;
  }

  const container = document.getElementById("restaurantListContainer");
  if (container) {
    container.innerHTML = `<div style="text-align: center; padding: 24px; color: #64748b; font-size: 12.5px;">🔍 '<b>${q}</b>' 식당 검색 중입니다... 🍽️</div>`;
  }

  try {
    const lat = (AppState.location && AppState.location.lat) ? AppState.location.lat : 37.643421;
    const lon = (AppState.location && AppState.location.lon) ? AppState.location.lon : 127.236018;
    const res = await fetch(`/api/restaurant/search?query=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("API 응답 실패: " + res.status);
    const places = await res.json();
    AppState.cachedPlaces = places || [];

    if (container) {
      if (AppState.cachedPlaces.length > 0) {
        container.innerHTML = buildRestaurantListHtml(AppState.cachedPlaces);
        if (typeof showToast === 'function') {
          showToast(`🍽️ '${q}' 관련 식당 ${AppState.cachedPlaces.length}곳을 찾았습니다!`, "info");
        }
      } else {
        container.innerHTML = `
          <div style="text-align: center; padding: 30px 16px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <div style="font-size: 24px; margin-bottom: 6px;">🍽️</div>
            <div style="font-size: 13px; font-weight: 800; color: #334155; margin-bottom: 4px;">'${q}' 검색 결과가 없습니다.</div>
            <div style="font-size: 11.5px; color: #64748b;">주변 지역 맛집 또는 다른 키워드(예: 순대국, 파스타, 카페)로 검색해 보세요.</div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("executeRestSearch error:", err);
    if (container) {
      container.innerHTML = `<div style="padding: 16px; color: #ef4444; font-size: 12px; text-align: center;">검색 통신 중 오류가 발생했습니다.<br><span style="font-size: 11px; color: #94a3b8;">${err.message || ''}</span></div>`;
    }
  }
}

function buildRestaurantListHtml(places) {
  const favList = AppState.favoritePlaces || [];
  return places.map((p, idx) => {
    const isFav = favList.some(f => f.name === p.name);
    const safeName = (p.name || '').replace(/'/g, "\\'");
    return `
      <div class="item-card" style="cursor: pointer;" onclick="focusRestaurantByName('${safeName}')">
        <div class="item-card-top">
          <span class="item-name" style="font-size: 13px;">${p.name}</span>
          <span class="item-badge" style="background: #ffedd5; color: #c2410c;">${p.category}</span>
        </div>
        <div class="item-desc">📍 ${p.address} (${p.distance})</div>
        <div class="item-action-row" onclick="event.stopPropagation()">
          <button class="btn-mini btn-fav" style="background: #e0f2fe; color: #0369a1; font-weight: 700;" onclick="focusRestaurantByName('${safeName}')">🗺️ 지도 위치 보기</button>
          <button class="btn-mini btn-fav" style="background: ${isFav ? '#fffbeb' : '#ecfdf5'}; color: ${isFav ? '#b45309' : '#047857'}; border: 1px solid ${isFav ? '#fde68a' : '#a7f3d0'};" onclick="quickAddFavoriteRestaurantByName('${safeName}')">
            ${isFav ? '★ 단골 취소' : '⭐ 단골 등록'}
          </button>
          ${p.phone && p.phone !== '정보없음' ? `<a href="tel:${p.phone}" class="btn-mini btn-call">📞 ${p.phone}</a>` : ''}
        </div>
      </div>
    `;
  }).join("");
}

async function switchCultureScope(scope) {
  const el = document.getElementById("sheetContent");
  if (el) {
    await renderCultureDetail(el, scope);
  }
}
window.switchCultureScope = switchCultureScope;

function quickAddFavoriteFestivalById(idx) {
  const f = (window._currentFestivals || [])[idx];
  if (!f) return;
  quickAddFavoritePlace('축제', f.title, f.location, '', f.period);
}
window.quickAddFavoriteFestivalById = quickAddFavoriteFestivalById;

async function renderCultureDetail(el, currentScope = "local") {
  el.innerHTML = '<div style="padding: 24px; text-align: center; color: #64748b;">🎪 축제 및 나들이 정보를 불러오는 중입니다...</div>';

  try {
    const res = await fetch(`/api/culture?scope=${currentScope}&lat=${AppState.location.lat}&lon=${AppState.location.lon}`);
    const data = await res.json();
    const festivals = data.festivals || [];
    window._currentFestivals = festivals;

    el.innerHTML = `
      <!-- 지역 한정 vs 전국 확대 탭 토글 바 -->
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button type="button" class="btn-mini" style="flex: 1; padding: 11px 8px; font-weight: 800; font-size: 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; background: ${currentScope === 'local' ? '#0284c7' : '#f1f5f9'}; color: ${currentScope === 'local' ? 'white' : '#475569'}; border: 1.5px solid ${currentScope === 'local' ? '#0284c7' : '#cbd5e1'};" onclick="switchCultureScope('local')">
          📍 내 주변 (경기/수도권 축제)
        </button>
        <button type="button" class="btn-mini" style="flex: 1; padding: 11px 8px; font-weight: 800; font-size: 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; background: ${currentScope === 'all' ? '#0284c7' : '#f1f5f9'}; color: ${currentScope === 'all' ? 'white' : '#475569'}; border: 1.5px solid ${currentScope === 'all' ? '#0284c7' : '#cbd5e1'};" onclick="switchCultureScope('all')">
          🌐 전국 축제 전체보기
        </button>
      </div>

      <div style="font-size: 13px; font-weight: 800; margin-bottom: 8px;">🚦 주말 핫스팟 붐빔 예측 신호등</div>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
        ${(data.crowd_spots || []).map(s => `
          <div class="weekly-row">
            <span style="font-size: 12px; font-weight: 800;">${s.spot_name}</span>
            <span style="font-size: 11px; font-weight: 700;">${s.level_badge}</span>
          </div>
        `).join("")}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 800;">🎪 ${data.scope_desc || (currentScope === 'local' ? '내 주변 경기/수도권 축제' : '전국 축제')} (${festivals.length}곳)</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${festivals.map((f, idx) => `
          <div class="item-card">
            <div class="item-card-top">
              <span class="item-name" style="font-size: 13px;">${f.title}</span>
              <span class="item-badge" style="background: #fef3c7; color: #b45309;">${f.expected_crowd}</span>
            </div>
            <div class="item-desc">📅 기간: ${f.period}</div>
            <div class="item-desc" style="color: #64748b; font-size: 11px;">📍 ${f.location}</div>
            <div class="item-action-row">
              <button class="btn-mini btn-fav" onclick="quickAddFavoriteFestivalById(${idx})">⭐ 축제 찜하기</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    el.innerHTML = '<div style="padding: 16px; color: #ef4444;">축제 정보를 불러오는 중 오류가 발생했습니다.</div>';
  }
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
function openRouteModal(defaultStationName = "", defaultRouteNo = "", defaultDest = "", defaultTitle = "") {
  document.getElementById("modalAddRoute").className = "modal-overlay active";
  const stInput = document.getElementById("inputStationName");
  const titleInput = document.getElementById("inputRouteTitle");
  const routeInput = document.getElementById("inputRouteNo");
  const destInput = document.getElementById("inputDestination");

  if (defaultStationName && stInput) stInput.value = defaultStationName;
  if (defaultDest && destInput) destInput.value = defaultDest;

  if (titleInput) {
    if (defaultTitle) {
      titleInput.value = defaultTitle;
    } else if (defaultStationName && defaultDest) {
      titleInput.value = `${defaultStationName} ➔ ${defaultDest}`;
    } else if (defaultStationName) {
      titleInput.value = `${defaultStationName} 출발`;
    }
  }

  if (defaultRouteNo && routeInput) {
    routeInput.value = defaultRouteNo;
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

// 번거로운 입력창 없이 출발지 ➔ 도착지 선택 시 즉시 즐겨찾기 원클릭 저장
async function saveTransitRouteDirect(originName, destName, routeNo = "전체노선") {
  if (!originName || !destName) return;

  const title = `${originName} ➔ ${destName}`;
  try {
    const res = await fetch("/api/transit/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        transit_type: "BUS",
        station_name: originName,
        dest_station_name: destName,
        route_no: routeNo,
        target_destination: destName,
        user_username: AppState.currentUser ? AppState.currentUser.username : "미니미니"
      })
    });

    playBusAlertChime();
    showToast(`⭐ '${title}' 구간이 즐겨찾기에 즉시 저장되었습니다!`, "info");

    resetTransitRouteBuilder();
    closeSelectedPlaceCard();
    loadFavorites();

    if (AppState.currentCategory === "transit") {
      const el = document.getElementById("sheetContent") || document.getElementById("categoryDetailContent");
      if (el) renderTransitDetail(el);
    }
  } catch (e) {
    alert("즐겨찾기 저장 중 오류가 발생했습니다.");
  }
}

// 즐겨찾기 루트 삭제
async function deleteTransitRoute(routeId) {
  if (!confirm("이 버스 즐겨찾기 구간을 삭제하시겠습니까?")) return;
  try {
    const res = await fetch(`/api/transit/${routeId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    showToast("🗑️ 즐겨찾기 구간이 삭제되었습니다.", "info");
    loadFavorites();
    if (AppState.currentCategory === "transit") {
      const el = document.getElementById("sheetContent") || document.getElementById("categoryDetailContent");
      if (el) renderTransitDetail(el);
    }
  } catch (e) {
    console.error("deleteTransitRoute error:", e);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// 즐겨찾기 장소 삭제
async function deleteFavoritePlace(placeId) {
  if (!confirm("이 즐겨찾기 장소를 삭제하시겠습니까?")) return;
  try {
    const res = await fetch(`/api/places/favorite/${placeId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    showToast("🗑️ 즐겨찾기 장소가 삭제되었습니다.", "info");
    loadFavorites();
  } catch (e) {
    console.error("deleteFavoritePlace error:", e);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

// 단골 식당 삭제
async function deleteFavoriteRestaurant(restId) {
  if (!confirm("이 단골 식당 즐겨찾기를 삭제하시겠습니까?")) return;
  try {
    const res = await fetch(`/api/restaurant/${restId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    showToast("🗑️ 단골 식당이 즐겨찾기에서 삭제되었습니다.", "info");
    loadFavorites();
  } catch (e) {
    console.error("deleteFavoriteRestaurant error:", e);
    alert("식당 삭제 중 오류가 발생했습니다.");
  }
}

// 즐겨찾기 ID 기반 모달 열기 헬퍼 (인라인 JSON 이스케이프 결함 원천 방지)
function openEditPlaceModalById(placeId) {
  const item = (AppState.loadedPlaces || AppState.favoritePlaces || []).find(p => String(p.id) === String(placeId));
  if (item) openEditPlaceModal(item);
}

function openEditTransitModalById(routeId) {
  const item = (AppState.loadedTransit || []).find(t => String(t.id) === String(routeId));
  if (item) openEditTransitModal(item);
}

function openEditRestaurantModalById(restId) {
  const item = (AppState.loadedRestaurants || []).find(r => String(r.id) === String(restId));
  if (item) openEditRestaurantModal(item);
}

// 즐겨찾기 장소 수정 모달 열기
function openEditPlaceModal(favItem) {
  if (!favItem) return;
  const modal = document.getElementById("modalEditFavorite");
  if (!modal) return;
  document.getElementById("editFavType").value = "place";
  document.getElementById("editFavId").value = favItem.id;
  document.getElementById("editFavName").value = favItem.name || "";
  document.getElementById("editFavSub").value = favItem.phone || favItem.status_info || "";
  document.getElementById("editFavSubLabel").innerText = "전화번호 / 상태 정보";
  document.getElementById("editFavMemo").value = favItem.memo || "";
  modal.className = "modal-overlay active";
}

// 즐겨찾기 버스 루트 수정 모달 열기
function openEditTransitModal(routeItem) {
  if (!routeItem) return;
  const modal = document.getElementById("modalEditFavorite");
  if (!modal) return;
  document.getElementById("editFavType").value = "transit";
  document.getElementById("editFavId").value = routeItem.id;
  document.getElementById("editFavName").value = routeItem.title || "";
  document.getElementById("editFavSub").value = routeItem.route_no || "";
  document.getElementById("editFavSubLabel").innerText = "버스 노선 번호 (예: 165, 1000)";
  document.getElementById("editFavMemo").value = routeItem.destination || routeItem.dest_station_name || "";
  modal.className = "modal-overlay active";
}

// 단골 식당 수정 모달 열기
function openEditRestaurantModal(restItem) {
  if (!restItem) return;
  const modal = document.getElementById("modalEditFavorite");
  if (!modal) return;
  document.getElementById("editFavType").value = "restaurant";
  document.getElementById("editFavId").value = restItem.id;
  document.getElementById("editFavName").value = restItem.name || "";
  document.getElementById("editFavSub").value = restItem.phone || restItem.category || "";
  document.getElementById("editFavSubLabel").innerText = "전화번호 / 카테고리";
  document.getElementById("editFavMemo").value = restItem.family_note || "";
  modal.className = "modal-overlay active";
}

function closeEditFavoriteModal(event) {
  if (event && event.target && event.target.id !== "modalEditFavorite" && !event.target.classList.contains("sheet-close-btn") && event.target.tagName !== "BUTTON") {
    return;
  }
  const modal = document.getElementById("modalEditFavorite");
  if (modal) modal.className = "modal-overlay";
}

async function saveFavoriteEdit() {
  const favType = document.getElementById("editFavType").value;
  const favId = document.getElementById("editFavId").value;
  const name = document.getElementById("editFavName").value.trim();
  const sub = document.getElementById("editFavSub").value.trim();
  const memo = document.getElementById("editFavMemo").value.trim();

  if (!name) {
    alert("이름 또는 명칭을 입력해 주세요.");
    return;
  }

  try {
    if (favType === "place") {
      await fetch(`/api/places/favorite/${favId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: sub, memo })
      });
      showToast("✏️ 즐겨찾기 장소 정보가 수정되었습니다!", "info");
    } else if (favType === "restaurant") {
      await fetch(`/api/restaurant/${favId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: sub, memo })
      });
      showToast("✏️ 단골 식당 정보가 수정되었습니다!", "info");
    } else {
      await fetch(`/api/transit/${favId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: name, route_no: sub, target_destination: memo, dest_station_name: memo })
      });
      showToast("✏️ 즐겨찾기 버스 루트 정보가 수정되었습니다!", "info");
    }

    closeEditFavoriteModal();
    loadFavorites();

    if (AppState.currentCategory === "transit") {
      const el = document.getElementById("sheetContent") || document.getElementById("categoryDetailContent");
      if (el) renderTransitDetail(el);
    }
  } catch (e) {
    console.error("saveFavoriteEdit error:", e);
    alert("수정 저장 중 오류가 발생했습니다.");
  }
}

// ==========================================
// 8-1. 버스 도착 10분/5분/3분 알림 시스템 (Web Notification + Audio 차임벨 + 진동)
// ==========================================
function initBusAlertSystem() {
  if (AppState.busAlertLoopTimer) clearInterval(AppState.busAlertLoopTimer);
  checkBusArrivalAlerts();
  AppState.busAlertLoopTimer = setInterval(() => {
    checkBusArrivalAlerts();
  }, 15000);
}

function playBusAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (맑은 3화음 차임벨)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const startT = ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.2, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + 0.4);
    });
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

function openBusAlarmModal(busData) {
  AppState.currentAlarmTarget = busData;
  const modal = document.getElementById("modalBusAlarm");
  if (!modal) return;

  const noEl = document.getElementById("alarmModalBusNo");
  const timeEl = document.getElementById("alarmModalRemainTime");
  const stEl = document.getElementById("alarmModalStationInfo");

  if (noEl) noEl.innerText = `${busData.route_no}번`;
  if (timeEl) timeEl.innerText = busData.remain_time || "운행 중";
  if (stEl) stEl.innerText = `🚏 ${busData.station_name || "정류소"} ➔ ${busData.destination || "시내방면"}`;

  const existing = AppState.busAlerts.find(a => a.routeNo === busData.route_no && a.stationName === busData.station_name);
  const stages = existing ? existing.stages : [10, 5, 3];

  const chk10 = document.getElementById("chkAlarm10");
  const chk5 = document.getElementById("chkAlarm5");
  const chk3 = document.getElementById("chkAlarm3");
  const chk1 = document.getElementById("chkAlarm1");

  if (chk10) chk10.checked = stages.includes(10);
  if (chk5) chk5.checked = stages.includes(5);
  if (chk3) chk3.checked = stages.includes(3);
  if (chk1) chk1.checked = stages.includes(1);

  modal.className = "modal-overlay active";

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function closeBusAlarmModal(event) {
  if (event && event.target && event.target.id !== "modalBusAlarm" && !event.target.classList.contains("sheet-close-btn") && event.target.tagName !== "BUTTON") {
    return;
  }
  const modal = document.getElementById("modalBusAlarm");
  if (modal) modal.className = "modal-overlay";
  AppState.currentAlarmTarget = null;
}

function saveBusAlarmSetting() {
  if (!AppState.currentAlarmTarget) return;

  const target = AppState.currentAlarmTarget;
  const stages = [];
  if (document.getElementById("chkAlarm10")?.checked) stages.push(10);
  if (document.getElementById("chkAlarm5")?.checked) stages.push(5);
  if (document.getElementById("chkAlarm3")?.checked) stages.push(3);
  if (document.getElementById("chkAlarm1")?.checked) stages.push(1);

  if (stages.length === 0) {
    alert("알림을 받을 시간을 최소 1개 이상 선택해 주세요. (예: 5분 전, 3분 전)");
    return;
  }

  AppState.busAlerts = AppState.busAlerts.filter(a => !(a.routeNo === target.route_no && a.stationName === target.station_name));

  const newAlert = {
    id: "alert_" + Date.now(),
    routeNo: target.route_no,
    stationName: target.station_name || "정류소",
    destination: target.destination || "시내방면",
    stages: stages.sort((a, b) => b - a),
    notifiedStages: [],
    createdAt: new Date().toISOString()
  };

  AppState.busAlerts.push(newAlert);
  localStorage.setItem("family_bus_alerts", JSON.stringify(AppState.busAlerts));

  closeBusAlarmModal();
  playBusAlertChime();
  showToast(`🔔 [${target.route_no}번 버스] ${stages.join("분, ")}분 전 도착 알림이 예약되었습니다!`, "info");

  if (AppState.currentCategory === "transit") {
    const el = document.getElementById("sheetContent") || document.getElementById("categoryDetailContent");
    if (el) renderTransitDetail(el);
  }
}

function removeBusAlarm(alertId) {
  AppState.busAlerts = AppState.busAlerts.filter(a => a.id !== alertId);
  localStorage.setItem("family_bus_alerts", JSON.stringify(AppState.busAlerts));
  showToast("🔕 버스 도착 알림 예약이 해제되었습니다.", "info");

  if (AppState.currentCategory === "transit") {
    const el = document.getElementById("sheetContent") || document.getElementById("categoryDetailContent");
    if (el) renderTransitDetail(el);
  }
}

async function checkBusArrivalAlerts() {
  if (!AppState.busAlerts || AppState.busAlerts.length === 0) return;

  const stations = [...new Set(AppState.busAlerts.map(a => a.stationName))];

  for (const stName of stations) {
    try {
      const res = await fetch(`/api/transit/station-arrivals?station_name=${encodeURIComponent(stName)}`);
      const data = await res.json();
      const arrivals = data.arrivals || [];

      for (const alertItem of AppState.busAlerts.filter(a => a.stationName === stName)) {
        const matched = arrivals.find(b => b.route_no === alertItem.routeNo);
        if (!matched) continue;

        const matchDigits = (matched.remain_time || "").match(/\d+/);
        const minsLeft = matchDigits ? parseInt(matchDigits[0], 10) : 0;

        for (const stage of alertItem.stages) {
          if (minsLeft <= stage && !alertItem.notifiedStages.includes(stage)) {
            triggerBusArrivalNotification(alertItem, stage, minsLeft, matched);
            alertItem.notifiedStages.push(stage);
            localStorage.setItem("family_bus_alerts", JSON.stringify(AppState.busAlerts));
          }
        }
      }
    } catch (e) {
      console.warn("checkBusArrivalAlerts error:", e);
    }
  }

  const now = Date.now();
  AppState.busAlerts = AppState.busAlerts.filter(a => {
    const ageMins = (now - new Date(a.createdAt).getTime()) / (1000 * 60);
    return ageMins < 35;
  });
  localStorage.setItem("family_bus_alerts", JSON.stringify(AppState.busAlerts));
}

function triggerBusArrivalNotification(alertItem, stage, minsLeft, matchedBus) {
  const title = `🚌 [${alertItem.routeNo}번 버스] 도착 ${stage}분 전!`;
  const body = `🚏 ${alertItem.stationName}에 약 ${minsLeft}분 후 도착합니다! (${matchedBus.remain_stops || "운행 중"})\n지금 정류장으로 이동하세요!`;

  playBusAlertChime();

  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  const banner = document.getElementById("busArrivalFloatingBanner");
  const bannerTitle = document.getElementById("busAlertBannerTitle");
  const bannerDesc = document.getElementById("busAlertBannerDesc");
  if (banner && bannerTitle && bannerDesc) {
    bannerTitle.innerText = title;
    bannerDesc.innerText = body.replace("\n", " ");
    banner.style.display = "flex";
    setTimeout(() => {
      banner.style.display = "none";
    }, 8000);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: "/static/icons/icon-192.png",
        badge: "/static/icons/icon-192.png",
        tag: `bus_${alertItem.routeNo}_${stage}`,
        renotify: true
      });
    } catch (e) {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body: body,
            icon: "/static/icons/icon-192.png",
            tag: `bus_${alertItem.routeNo}_${stage}`
          });
        });
      }
    }
  }

  showToast(title + " - " + body.replace("\n", " "), "info");
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

// 전역 함수 안전 바인딩 (HTML 인라인 이벤트 핸들러 보장)
window.deleteTransitRoute = deleteTransitRoute;
window.deleteFavoritePlace = deleteFavoritePlace;
window.deleteFavoriteRestaurant = deleteFavoriteRestaurant;
window.openEditPlaceModalById = openEditPlaceModalById;
window.openEditTransitModalById = openEditTransitModalById;
window.openEditRestaurantModalById = openEditRestaurantModalById;
window.openEditRestaurantModal = openEditRestaurantModal;
window.closeEditFavoriteModal = closeEditFavoriteModal;
window.saveFavoriteEdit = saveFavoriteEdit;
window.switchCultureScope = switchCultureScope;
window.quickAddFavoriteRestaurantById = quickAddFavoriteRestaurantById;
window.quickAddFavoriteFestivalById = quickAddFavoriteFestivalById;
window.executeHospitalSearch = executeHospitalSearch;
window.quickAddFavoriteHospitalById = quickAddFavoriteHospitalById;
window.focusHospitalOnMap = focusHospitalOnMap;
window.focusRestaurantOnMap = focusRestaurantOnMap;
window.selectBusStopOnMapById = selectBusStopOnMapById;
window.showAllCategoryMarkers = showAllCategoryMarkers;
window.refreshMyLocation = refreshMyLocation;

