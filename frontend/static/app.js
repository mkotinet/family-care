/**
 * 우리가족챙기기 (Family Care) - Frontend App Engine
 * 모바일 최적화, KST 일관 적용, BFCache 대응, 독립 비동기 위젯 로딩
 */

// 전역 상태
const state = {
  currentLat: 37.6434558,
  currentLon: 127.2311716,
  address: "경기도 남양주시 평내동 평내유진마젤란",
  activeMember: 0, // 0: 전체, 1: 아빠, 2: 엄마, 3: 아이
  lastDateStr: "",
  isWeekend: false
};

// KST 날짜 헬퍼 (공통 개발 지침 준수)
function getKSTDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

function getKSTTimeString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  return formatter.format(date);
}

// 실시간 KST 시계 구동
function startKSTClock() {
  const clockEl = document.getElementById("kstClock");
  setInterval(() => {
    const timeStr = getKSTTimeString();
    if (clockEl) {
      clockEl.innerText = `${timeStr} KST`;
    }
  }, 1000);
}

// 모바일 백그라운드 복귀 & 자정 롤오버 감지기 (BFCache 대응)
function setupMobileLifecycle() {
  state.lastDateStr = getKSTDateString();

  const handleResume = () => {
    const currentDateStr = getKSTDateString();
    if (currentDateStr !== state.lastDateStr) {
      console.log(`[Lifecycle] 자정 롤오버 감지: ${state.lastDateStr} -> ${currentDateStr}. 전체 데이터 자동 갱신.`);
      state.lastDateStr = currentDateStr;
      loadAllWidgets();
    } else {
      console.log("[Lifecycle] 모바일 화면 복귀 감지. 실시간 교통/날씨 갱신.");
      loadWeatherWidget();
      loadTransitWidget();
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      handleResume();
    }
  });

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      console.log("[Lifecycle] BFCache에서 복원됨.");
      handleResume();
    }
  });

  window.addEventListener("focus", handleResume);
}

// 앱 초기화
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

      // 주말이면 상단 배지 강조
      if (data.is_weekend) {
        document.getElementById("hospitalWeekendBadge").innerText = "🚨 주말 당번약국 & 소아과 집중 모드";
      }
    }
  } catch (e) {
    console.warn("Init API 에러, 기본 위치 사용:", e);
  }

  // 6대 위젯 독립 비동기 로딩 (서로 지연을 주지 않음)
  loadAllWidgets();
  setupEventHandlers();
  applyContextPriority();
}

function loadAllWidgets() {
  loadWeatherWidget();
  loadTransitWidget();
  loadHospitalWidget("ALL");
  loadRestaurantWidget();
  loadHealthAlertWidget();
  loadCultureWidget();
}

// 시간대/상황별 카드 순서 자동 재배치 (Context-Aware UX)
function applyContextPriority() {
  const hour = new Date().getHours();
  const container = document.querySelector(".app-container");
  const weatherCard = document.getElementById("cardWeather");
  const transitCard = document.getElementById("cardTransit");
  const hospitalCard = document.getElementById("cardHospital");
  const restaurantCard = document.getElementById("cardRestaurant");
  const cultureCard = document.getElementById("cardCulture");

  // 평일 아침 06:30 ~ 09:30: 출근/등교 교통 루트를 최우선 노출
  if (!state.isWeekend && hour >= 6 && hour < 10) {
    container.insertBefore(transitCard, weatherCard);
  }
  // 주말: 나들이 & 병원/약국 카드를 상위로 이동
  else if (state.isWeekend) {
    container.insertBefore(hospitalCard, transitCard);
    container.insertBefore(cultureCard, restaurantCard);
  }
}

// 1. 날씨 & 옷차림 위젯 로드
async function loadWeatherWidget() {
  try {
    const res = await fetch(`/api/weather?lat=${state.currentLat}&lon=${state.currentLon}`);
    if (!res.ok) throw new Error("Weather error");
    const data = await res.json();

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
    document.getElementById("weatherUpdated").innerText = `${data.updated_at} 갱신`;
  } catch (e) {
    console.error("Weather load fail:", e);
    document.getElementById("outfitText").innerText = "날씨 정보를 불러오는 중입니다.";
  }
}

// 2. 교통 루트 위젯 로드
async function loadTransitWidget() {
  const listEl = document.getElementById("transitList");
  try {
    const res = await fetch("/api/transit");
    if (!res.ok) throw new Error("Transit error");
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">등록된 루트가 없습니다. [+ 루트 추가]를 눌러보세요.</div>`;
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div class="route-item">
        <div class="route-left">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="route-badge-num" style="background: ${item.badge_color || '#3b82f6'};">
              ${item.route_no}
            </span>
            <span style="font-size: 13px; font-weight: 700; color: #1e293b;">${item.title}</span>
          </div>
          <div class="route-station">
            📍 ${item.station_name} ➔ ${item.destination || '행선지'}
          </div>
        </div>
        <div class="route-right">
          <div class="route-time">${item.remain_time}</div>
          <div class="route-stops">${item.remain_stops} (${item.crowded_level || '여유'})</div>
        </div>
      </div>
    `).join("");
  } catch (e) {
    listEl.innerHTML = `<div style="color: #ef4444; padding: 12px; font-size: 13px;">교통 도착정보 일시 조회 지연 중입니다.</div>`;
  }
}

// 3. 병원 & 당번약국 위젯 로드
async function loadHospitalWidget(filterType = "ALL") {
  const listEl = document.getElementById("hospitalList");
  try {
    const res = await fetch(`/api/hospital?lat=${state.currentLat}&lon=${state.currentLon}&filter_type=${filterType}`);
    if (!res.ok) throw new Error("Hospital error");
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">해당 조건의 운영 중인 의료기관이 없습니다.</div>`;
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div class="hospital-item">
        <div>
          <div class="hosp-name">
            <span>${item.type === '약국' ? '💊' : '🏥'}</span>
            <span>${item.name}</span>
            <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
              ${item.badge || item.type}
            </span>
          </div>
          <div class="hosp-hours">
            ⏰ ${item.today_hours}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${item.distance} | ${item.address}
          </div>
        </div>
        <a href="tel:${item.phone}" class="hosp-call-btn" title="전화걸기">
          📞
        </a>
      </div>
    `).join("");
  } catch (e) {
    listEl.innerHTML = `<div style="color: #ef4444; padding: 12px; font-size: 13px;">의료기관 조회 실패</div>`;
  }
}

// 4. 단골 식당 위젯 로드
async function loadRestaurantWidget() {
  const listEl = document.getElementById("restaurantList");
  try {
    const res = await fetch("/api/restaurant");
    if (!res.ok) throw new Error("Restaurant error");
    const items = await res.json();

    if (!items || items.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">등록된 단골 식당이 없습니다.</div>`;
      return;
    }

    listEl.innerHTML = items.map(item => `
      <div class="restaurant-card">
        <div class="rest-title">
          <span>🍴 ${item.name} <span style="font-size: 12px; color: #64748b; font-weight: normal;">(${item.category})</span></span>
          <span style="font-size: 12px; color: #10b981;">${item.status_badge || '영업중'}</span>
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          ⏰ <b>영업시간:</b> ${item.business_hours} (${item.closed_days})
        </div>
        ${item.family_note ? `<div class="rest-note">📝 <b>가족메모:</b> ${item.family_note}</div>` : ''}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="font-size: 11px; color: #94a3b8;">${item.address}</span>
          <a href="tel:${item.phone}" style="font-size: 12px; color: #0284c7; text-decoration: none; font-weight: 700;">전화문의 📞</a>
        </div>
      </div>
    `).join("");
  } catch (e) {
    listEl.innerHTML = `<div style="color: #ef4444; padding: 12px;">식당 목록 로드 지연</div>`;
  }
}

// 5. 알레르기/질병 예보 위젯 로드
async function loadHealthAlertWidget() {
  const listEl = document.getElementById("healthAlertList");
  try {
    const res = await fetch(`/api/health?lat=${state.currentLat}&lon=${state.currentLon}`);
    const data = await res.json();
    const alerts = data.alerts || [];

    listEl.innerHTML = alerts.map(a => `
      <div style="background: rgba(248, 250, 252, 0.85); border-radius: 12px; padding: 12px; margin-bottom: 8px; border-left: 4px solid ${a.color};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 800; color: #1e293b;">${a.disease}</span>
          <span style="font-size: 11px; font-weight: 700; color: white; background: ${a.color}; padding: 2px 8px; border-radius: 999px;">
            ${a.level}
          </span>
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 4px;">
          💡 ${a.tip}
        </div>
      </div>
    `).join("");
  } catch (e) {
    listEl.innerHTML = `<div style="color: #94a3b8; font-size: 12px;">질병 예보 조회 중...</div>`;
  }
}

// 6. 주말 나들이 & 축제/혼잡도 위젯 로드
async function loadCultureWidget() {
  const listEl = document.getElementById("cultureList");
  try {
    const res = await fetch(`/api/culture?lat=${state.currentLat}&lon=${state.currentLon}`);
    const data = await res.json();
    const items = data.festivals || [];

    listEl.innerHTML = items.map(f => `
      <div class="culture-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; font-weight: 800; color: #1e293b;">🎪 ${f.title}</span>
          <span class="crowd-indicator" style="background: #fef3c7; color: #b45309;">
            혼잡도: ${f.crowd_status}
          </span>
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          📍 ${f.location} (${f.distance}) | 📅 ${f.period}
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #059669; margin-top: 6px;">
          👉 ${f.recommendation}
        </div>
      </div>
    `).join("");
  } catch (e) {
    listEl.innerHTML = `<div style="color: #94a3b8; font-size: 12px;">행사 정보 조회 중...</div>`;
  }
}

// 이벤트 핸들러 바인딩
function setupEventHandlers() {
  // GPS 위치 새로고침 버튼
  document.getElementById("btnRefreshLoc").addEventListener("click", () => {
    if ("geolocation" in navigator) {
      document.getElementById("currentLocText").innerText = "현재 GPS 위치 확인 중...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          state.currentLat = pos.coords.latitude;
          state.currentLon = pos.coords.longitude;
          document.getElementById("currentLocText").innerText = `내 위치 (${state.currentLat.toFixed(3)}, ${state.currentLon.toFixed(3)})`;
          loadAllWidgets();
        },
        (err) => {
          alert("GPS 위치 확인 권한이 없거나 꺼져 있어 기본 위치(남양주시 평내유진마젤란)를 유지합니다.");
          document.getElementById("currentLocText").innerText = state.address;
        },
        { timeout: 5000 }
      );
    } else {
      alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
    }
  });

  // 가족 멤버 선택 탭
  const tabs = document.querySelectorAll(".member-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      state.activeMember = parseInt(tab.dataset.member);
      console.log(`가족 멤버 전환: ${state.activeMember}`);
      loadTransitWidget();
    });
  });

  // 병원 필터 칩
  const chips = document.querySelectorAll(".chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      loadHospitalWidget(chip.dataset.filter);
    });
  });

  // 모달 제어 (루트 추가)
  const modalRoute = document.getElementById("modalAddRoute");
  document.getElementById("btnOpenAddRoute").addEventListener("click", () => modalRoute.style.display = "flex");
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
    loadTransitWidget();
  });

  // 모달 제어 (단골 식당 등록)
  const modalRest = document.getElementById("modalAddRestaurant");
  document.getElementById("btnOpenAddRestaurant").addEventListener("click", () => modalRest.style.display = "flex");
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
    loadRestaurantWidget();
  });
}

// 부드러운 스크롤 이동
function scrollToCard(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 돔 로드 완료 시 구동
document.addEventListener("DOMContentLoaded", initApp);
