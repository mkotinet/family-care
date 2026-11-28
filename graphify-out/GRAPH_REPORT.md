# Graph Report - family-care  (2026-11-28)

## Corpus Check
- 27 files · ~76,235 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 651 nodes · 1682 edges · 45 communities (39 shown, 6 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 278 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d7a4878f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- write_audit_log
- setTransitOrigin
- autoDetectUserLocation
- loadFavorites
- hospital.py
- app.js
- family-care
- manifest.json
- submitFamilyLogin
- showToastNotice
- api_route
- delete_favorite_restaurant
- autoDetectUserLocation
- set_cached_data
- [사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]
- showToast
- ⏱️ 단계별 개발 타임라인
- 🌿 우리가족챙기기 (Family Care)
- executeRestSearch
- sw.js
- auth.py
- 📌 목차
- set_cached_data
- get_db_connection
- 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편
- initPinchToZoomEngine
- 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)
- 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결
- touch_user_heartbeat
- 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)
- 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)
- 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)
- 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)
- 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)
- 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)
- restaurant.py
- location.py
- add_security_headers
- quickAddFavoritePlace
- transit.py
- api_location_status
- add_favorite_route
- verify_shortcut_key

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 45 edges
2. `📅 프로젝트 기본 정보` - 44 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 34 edges
4. `showToast()` - 28 edges
5. `📌 목차` - 26 edges
6. `loadFavorites()` - 23 edges
7. `async_http_get_json()` - 23 edges
8. `set_cached_data()` - 22 edges
9. `reverse_geocode()` - 20 edges
10. `autoDetectUserLocation()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `19. 초기 화면 위치 고정 및 타 지역 교통·병원·약국·식당 평내 고착 해결 (`v1.8.0`)` --references--> `autoDetectUserLocation()`  [INFERRED]
  트러블슈팅.md → frontend/static/app.js
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제` --references--> `renderCultureDetail()`  [INFERRED]
  기술레포트.md → frontend/static/app.js

## Import Cycles
- None detected.

## Communities (45 total, 6 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.07
Nodes (29): api_admin_audit_logs(), api_auth_family(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_location_history(), api_location_reverse_geocode() (+21 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.14
Nodes (13): 1. 개요 및 프로젝트 목표, 29.1 구현 개요 및 주요 배경, 29. 버스 정류소 서울/호평 방면 100% 지리 실측 교정 및 즐겨찾기 양방향 메뉴 최상단 배치 UX 고도화 (v1.4.9), 2. 시스템 아키텍처 및 핵심 설계 패턴, 30.1 구현 개요 및 주요 배경, 30. 가족 채팅 실시간 위치 공유 핀 원클릭 대화형 지도 뷰어 탑재 (v1.5.0), 34.1 현황 진단 및 근본 원인(RCA), 34. 내 위치 기반 전 카테고리(초기화면·교통·병원·약국·식당·날씨) 완전 동적화 고도화 (`v1.8.0` - 2026-11-23) (+5 more)

### Community 2 - "write_audit_log"
Cohesion: 0.18
Nodes (17): write_audit_log(), api_auth_login(), api_auth_logout(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_shortcut_rotate(), api_location_shortcut_webhook() (+9 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.09
Nodes (56): calcDistanceKm(), clearCategoryMarkers(), clearCategoryRouteLine(), clearTransitRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), dropCustomTransitPin(), filterHospitalList() (+48 more)

### Community 4 - "autoDetectUserLocation"
Cohesion: 0.18
Nodes (13): checkChildSafetySummary(), initApp(), loadWeather(), openLoginModal(), refreshData(), refreshMyLocation(), reloadOpenCategorySheet(), renderFamilyLoginGrid() (+5 more)

### Community 5 - "loadFavorites"
Cohesion: 0.22
Nodes (11): closeRouteModal(), deleteFavoriteRestaurant(), focusFavoritePlaceById(), isHospitalCategory(), isRestaurantCategory(), isTransitCategory(), loadFavorites(), saveTransitRoute() (+3 more)

### Community 6 - "hospital.py"
Cohesion: 0.13
Nodes (20): async_http_get_bytes(), async_http_get_json(), _sync_get_bytes(), api_hospital(), get_simulated_hospitals(), _fmt_dist(), format_time_str(), get_hospital_pharmacy_info() (+12 more)

### Community 7 - "app.js"
Cohesion: 0.06
Nodes (39): AppState, checkPwaDisplayMode(), dismissPwaBanner(), focusHospitalOnMap(), focusRestaurantOnMap(), getKakaoJsKey(), handleChatKeyDown(), handleUrlActionParams() (+31 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "submitFamilyLogin"
Cohesion: 0.25
Nodes (9): applyUserTextSizePreference(), closeLoginModal(), loadStoredSession(), logoutFamily(), sendUserHeartbeat(), setTextSizeMode(), submitFamilyLogin(), toggleTextSize() (+1 more)

### Community 11 - "showToastNotice"
Cohesion: 0.13
Nodes (18): closeKakaoKeyModal(), closeManualLocationModal(), closeSafetyModal(), copyShortcutText(), fetchFamilyLocations(), initSafetyKakaoMap(), openSafetyModal(), renderTrailOnSafetyMap() (+10 more)

### Community 12 - "api_route"
Cohesion: 0.33
Nodes (3): serve_favicon(), serve_manifest(), serve_sw()

### Community 13 - "delete_favorite_restaurant"
Cohesion: 0.29
Nodes (6): api_places_favorite_update(), api_restaurant_update(), api_transit_update(), delete_favorite_restaurant(), update_favorite_restaurant(), 사례 5: 인라인 JSON 이스케이프 구문 오류 및 식당 CRUD 부재 결함

### Community 14 - "autoDetectUserLocation"
Cohesion: 0.22
Nodes (19): acquireBestPosition(), autoDetectUserLocation(), closeWhatsNewModal(), dismissWhatsNewForever(), isChildUser(), isInAppBrowser(), queryGeoPermissionState(), reportChildLocationToServer() (+11 more)

### Community 15 - "set_cached_data"
Cohesion: 0.26
Nodes (11): get_cached_data(), set_cached_data(), get_simulated_culture(), get_simulated_weather(), math_sin_hour(), get_culture_and_crowd(), get_health_alerts(), reverse_geocode() (+3 more)

### Community 16 - "[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]"
Cohesion: 0.12
Nodes (28): delete_cached_data(), api_auth_me(), _extract_bearer_token(), optional_auth(), require_admin(), require_auth(), require_parent(), get_user_by_token() (+20 more)

### Community 17 - "showToast"
Cohesion: 0.16
Nodes (19): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteTransitRoute(), initBusAlertSystem(), playBusAlertChime(), removeBusAlarm() (+11 more)

### Community 18 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.07
Nodes (30): checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), openRouteModal(), selectStartStation() (+22 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "executeRestSearch"
Cohesion: 0.20
Nodes (10): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), getOriginShortName(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail() (+2 more)

### Community 22 - "auth.py"
Cohesion: 0.25
Nodes (8): async_http_post_json(), authenticate_user(), _check_rate_limit(), _clear_login_failures(), generate_token(), hash_password(), _record_login_failure(), verify_with_haru_quiz()

### Community 23 - "📌 목차"
Cohesion: 0.09
Nodes (29): serve_index(), request_child_ping(), checkWhatsNewPopup(), closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd() (+21 more)

### Community 24 - "set_cached_data"
Cohesion: 0.39
Nodes (9): init_db(), initKakaoSafetyMap(), initLeafletSafetyMap(), 1) 개요 및 사용자 요구사항, 23. 자동 생성 버스 즐겨찾기 영구 삭제 & 우리아이 안심 위치 실시간 핀 전원 표출 패치 (v1.4.4), 2) 근본 원인 분석 (RCA), 34.2 아키텍처 개선 및 구현 내역, 3) 해결 조치 (Remediation) (+1 more)

### Community 25 - "get_db_connection"
Cohesion: 0.11
Nodes (14): get_audit_logs(), get_db_connection(), _sync_post_json(), get_chat_rooms(), get_messages(), send_message(), get_favorite_places(), get_or_create_vapid_keys() (+6 more)

### Community 26 - "13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편"
Cohesion: 0.40
Nodes (5): 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동, 3) 축제 나들이 카드 내 위치(경기/수도권) 한정 & 전국 확대, 4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화, 5) 식당 검색 엔진 고도화

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.27
Nodes (10): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA) (+2 more)

### Community 28 - "7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)"
Cohesion: 0.33
Nodes (6): 7.1 하루퀴즈 회원 DB 연동 및 4인 가족 계정 체계, 7.2 날씨 카드 3단 타임라인 뷰 (`hourly` / `three_hourly` / `weekly`), 7.3 카카오맵 인터랙티브 지도 뷰 & 교통 출발/도착 선택, 7.4 자녀 실시간 GPS 안심 위치 추적 시스템 (`/api/location/*`), 7.5 가족 전용 실시간 채팅방 (`/api/chat/*`), 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)

### Community 29 - "10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결"
Cohesion: 0.40
Nodes (5): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 1) 카카오 디벨로퍼스 2024~2026 신규 UI 도메인 등록 완결, 2) 약국/식당 목록-지도 핀 원터치 연동 및 즐겨찾기 점검, 3) 버스 지도 직접 핀 꽂기 & 나만의 버스 루트 생성, 4) 모바일 브라우저별 PWA 및 실시간 알림 가이드 완비

### Community 31 - "17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)"
Cohesion: 0.50
Nodes (4): 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 32 - "26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 33 - "20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)"
Cohesion: 0.50
Nodes (4): 1) 결함 현상 (Symptom), 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 34 - "28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)"
Cohesion: 0.50
Nodes (4): 1) 기술적 배경 및 개요, 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8), 2) 결함 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 35 - "19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)"
Cohesion: 0.67
Nodes (3): 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis)

### Community 36 - "6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)"
Cohesion: 0.67
Nodes (3): 6.1 연동된 6대 실시간 공공 API 명세 및 검증, 6.2 보안 및 무중단 배포 검증, 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)

### Community 37 - "restaurant.py"
Cohesion: 0.24
Nodes (6): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), _dynamic_restaurant_status(), get_favorite_restaurants(), search_places_kakao()

### Community 38 - "location.py"
Cohesion: 0.17
Nodes (8): api_location_family(), determine_landmark(), get_family_locations(), get_location_history(), get_shortcut_configs(), _normalize_sido_short(), _parse_kst_dt(), update_gps_permission_status()

### Community 40 - "quickAddFavoritePlace"
Cohesion: 0.27
Nodes (11): quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항, 22. 하루퀴즈 비밀번호 실시간 연동 로그인 고도화 및 약국·병원 실측 좌표·버스 삭제 무결성 패치 (v1.4.3) (+3 more)

### Community 41 - "transit.py"
Cohesion: 0.38
Nodes (4): get_simulated_transit(), get_station_arrivals(), get_transit_routes(), 사례 9: 버스 정류소 명칭 왜곡 및 호평동 vs 서울 운행 방향 반대 노출 결함 (카카오버스 100% 정답 일치) (v1.3.9)

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]` to `setTransitOrigin`, `autoDetectUserLocation`, `restaurant.py`, `location.py`, `hospital.py`, `loadFavorites`, `transit.py`, `autoDetectUserLocation`, `set_cached_data`, `showToast`, `⏱️ 단계별 개발 타임라인`, `executeRestSearch`, `📌 목차`, `set_cached_data`, `initPinchToZoomEngine`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)`, `20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)`, `28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)`, `setTransitOrigin`, `19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)`, `6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)`, `quickAddFavoritePlace`, `autoDetectUserLocation`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `showToast`, `⏱️ 단계별 개발 타임라인`, `📌 목차`, `set_cached_data`, `13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편`, `initPinchToZoomEngine`, `7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)`, `10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결`, `17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `set_cached_data` to `restaurant.py`, `location.py`, `hospital.py`, `transit.py`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `set_cached_data`, `get_db_connection`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._