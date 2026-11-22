/**
 * 우리가족챙기기 (Family Care) - 핵심 보안·시간대·네트워크·접근성 코어 모듈 (v1.7.0)
 * 책임: XSS 이스케이프, KST 시간대 헬퍼(지침 제4조), 거리 계산, 인증 Fetch 인터셉터(지침 제9조), 키보드 접근성(Esc 닫기)
 */

// 1. HTML 특수문자 이스케이프 (Stored XSS 원천 차단)
function escapeHtml(val) {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
window.escapeHtml = escapeHtml;

// 2. 한국 표준시(KST, Asia/Seoul) 기준 날짜·시각 헬퍼 (지침 제4조: UTC toISOString 금지)
function getKSTDateString(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(dateObj);
  const y = parts.find(p => p.type === "year")?.value || "2026";
  const m = parts.find(p => p.type === "month")?.value || "01";
  const d = parts.find(p => p.type === "day")?.value || "01";
  return `${y}-${m}-${d}`;
}

function getKSTDateTimeString(dateObj = new Date()) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(dateObj);
  const get = (t) => parts.find(p => p.type === t)?.value || "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+09:00`;
}
window.getKSTDateString = getKSTDateString;
window.getKSTDateTimeString = getKSTDateTimeString;

// 3. 두 WGS84 좌표 간 거리 계산 (미터)
function calcHaversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
window.calcHaversineMeters = calcHaversineMeters;

// 4. 비로그인 상태 보호 기능 접근 가드 (임의 계정 사칭 방지)
function requireFamilyLogin(actionLabel = "이 기능") {
  if (typeof AppState !== "undefined" && AppState.currentUser && AppState.token) return true;
  if (typeof showToast === "function") {
    showToast(`🔐 ${actionLabel}은(는) 가족 로그인 후 이용할 수 있습니다.`, "info");
  }
  if (typeof openLoginModal === "function") {
    openLoginModal();
  }
  return false;
}
window.requireFamilyLogin = requireFamilyLogin;

// 5. 전역 /api/* Authorization 자동 주입 + 명시적 401 세션 보호 (지침 제9조)
(function installAuthFetchInterceptor() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : (input && input.url ? input.url : "");
    const isSameOriginApi = url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/");
    const nextInit = Object.assign({}, init);

    if (isSameOriginApi) {
      const token = (typeof AppState !== "undefined" && AppState.token) || localStorage.getItem("fc_token");
      if (token) {
        const headers = new Headers(nextInit.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        nextInit.headers = headers;
      }
    }

    const res = await nativeFetch(input, nextInit);

    // 제9조 준수: 오직 명시적 401 Unauthorized 수신 시에만 만료 토큰 정리 (오프라인/5xx는 세션 유지)
    if (
      isSameOriginApi &&
      res.status === 401 &&
      !url.includes("/api/auth/login") &&
      !url.includes("/api/auth/me") &&
      typeof AppState !== "undefined" &&
      AppState.token
    ) {
      localStorage.removeItem("fc_token");
      localStorage.removeItem("fc_user");
      AppState.token = null;
      AppState.currentUser = null;
      if (typeof updateHeaderUserUI === "function") updateHeaderUserUI();
      if (typeof showToast === "function") {
        showToast("🔐 로그인 세션이 만료되었습니다. 다시 로그인해주세요.", "info");
      }
    }
    return res;
  };
})();

// 6. 접근성(WCAG 2.1 AA): 모달 ARIA 역할 자동 보강 & 전역 Escape 키 닫기 지원
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-overlay").forEach((el) => {
    if (!el.hasAttribute("role")) el.setAttribute("role", "dialog");
    if (!el.hasAttribute("aria-modal")) el.setAttribute("aria-modal", "true");
  });
  document.querySelectorAll(".sheet-close-btn").forEach((btn) => {
    if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", "창 닫기");
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  // 최상위 열려있는 모달부터 우선 닫기
  const openModals = Array.from(document.querySelectorAll(".modal-overlay.active"));
  if (openModals.length > 0) {
    const topModal = openModals[openModals.length - 1];
    topModal.className = "modal-overlay";
    return;
  }

  // 채팅 드로어 닫기
  const chatBackdrop = document.getElementById("chatDrawerBackdrop");
  if (chatBackdrop && chatBackdrop.classList.contains("active") && typeof closeChatDrawer === "function") {
    closeChatDrawer();
    return;
  }

  // 바텀 시트 닫기
  const sheetBackdrop = document.getElementById("sheetBackdrop");
  if (sheetBackdrop && sheetBackdrop.classList.contains("active") && typeof closeCategoryDetail === "function") {
    closeCategoryDetail();
  }
});
