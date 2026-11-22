# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 26 files · ~65,960 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 562 nodes · 1388 edges · 37 communities (34 shown, 3 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 261 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec223de8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- auth.py
- setTransitOrigin
- initPinchToZoomEngine
- loadFavorites
- hospital.py
- app.js
- family-care
- manifest.json
- focusSinglePlaceOnMap
- initSafetyKakaoMap
- send_message
- get_db_connection
- showToastNotice
- coords.py
- [사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]
- add_favorite_place
- 🌿 우리가족챙기기 (Family Care)
- showToast
- sw.js
- quickAddFavoritePlace
- initSheetGestures
- set_cached_data
- restaurant.py
- 3) 조치 및 해결 내역 (Remediation)
- 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)
- 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)
- 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결
- touch_user_heartbeat
- 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)
- 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)
- 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)
- 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)
- 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)
- 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)

## God Nodes (most connected - your core abstractions)
1. `📅 프로젝트 기본 정보` - 44 edges
2. `get_db_connection()` - 35 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 32 edges
4. `showToast()` - 26 edges
5. `📌 목차` - 24 edges
6. `loadFavorites()` - 23 edges
7. `set_cached_data()` - 20 edges
8. `focusSinglePlaceOnMap()` - 19 edges
9. `openCategoryDetail()` - 17 edges
10. `async_http_get_json()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `📅 프로젝트 기본 정보` --references--> `init_db()`  [INFERRED]
  제작히스토리.md → backend/database.py
- `📅 프로젝트 기본 정보` --references--> `set_cached_data()`  [INFERRED]
  제작히스토리.md → backend/database.py

## Import Cycles
- None detected.

## Communities (37 total, 3 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.09
Nodes (24): get_audit_logs(), api_admin_audit_logs(), api_auth_family(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_hospital() (+16 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.14
Nodes (13): 1. 개요 및 프로젝트 목표, 29.1 구현 개요 및 주요 배경, 29. 버스 정류소 서울/호평 방면 100% 지리 실측 교정 및 즐겨찾기 양방향 메뉴 최상단 배치 UX 고도화 (v1.4.9), 2. 시스템 아키텍처 및 핵심 설계 패턴, 30.1 구현 개요 및 주요 배경, 30. 가족 채팅 실시간 위치 공유 핀 원클릭 대화형 지도 뷰어 탑재 (v1.5.0), 31. Phase 1 종합 코드 감사 핵심 안정성·정확성 핫픽스 (v1.5.1), 33. Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱 & 코어 모듈화 고도화 (v1.7.0) (+5 more)

### Community 2 - "auth.py"
Cohesion: 0.11
Nodes (22): write_audit_log(), add_security_headers(), api_auth_login(), api_auth_logout(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate() (+14 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.10
Nodes (41): search_nearby_bus_stops(), calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), focusFavoriteTransitRouteById(), formatFriendlyPlaceName(), getDistanceFromHome() (+33 more)

### Community 4 - "initPinchToZoomEngine"
Cohesion: 0.18
Nodes (13): applyPageZoom(), checkChildSafetySummary(), closeManualLocationModal(), getTouchDistance(), initApp(), initPinchToZoomEngine(), loadWeather(), renderWeatherTimelines() (+5 more)

### Community 5 - "loadFavorites"
Cohesion: 0.18
Nodes (17): buildRestaurantListHtml(), clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), isHospitalCategory(), isRestaurantCategory() (+9 more)

### Community 6 - "hospital.py"
Cohesion: 0.14
Nodes (19): get_cached_data(), async_http_get_bytes(), async_http_get_json(), async_http_post_json(), _sync_get_bytes(), _sync_post_json(), get_simulated_culture(), get_simulated_hospitals() (+11 more)

### Community 7 - "app.js"
Cohesion: 0.06
Nodes (31): AppState, checkPwaDisplayMode(), closeRouteModal(), dismissPwaBanner(), executeHospitalSearch(), handleChatKeyDown(), initClock(), loadChatMessages() (+23 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "focusSinglePlaceOnMap"
Cohesion: 0.25
Nodes (18): clearCategoryMarkers(), filterHospitalList(), focusHospitalByName(), focusHospitalOnMap(), focusRestaurantByName(), focusRestaurantOnMap(), focusSinglePlaceOnMap(), initCategoryKakaoMap() (+10 more)

### Community 11 - "initSafetyKakaoMap"
Cohesion: 0.14
Nodes (15): closeSafetyModal(), fetchFamilyLocations(), getKakaoJsKey(), initSafetyKakaoMap(), loadKakaoSdk(), openChatMessageLocationMap(), openChatMessageLocationMapById(), openKakaoKeyModal() (+7 more)

### Community 12 - "send_message"
Cohesion: 0.19
Nodes (10): serve_favicon(), serve_index(), serve_manifest(), serve_sw(), send_message(), request_child_ping(), checkWhatsNewPopup(), openWhatsNewModal() (+2 more)

### Community 13 - "get_db_connection"
Cohesion: 0.27
Nodes (12): delete_cached_data(), get_db_connection(), api_places_favorite_update(), api_restaurant_update(), api_transit_update(), remove_favorite_place(), update_favorite_place(), update_favorite_restaurant() (+4 more)

### Community 14 - "showToastNotice"
Cohesion: 0.15
Nodes (14): applyUserTextSizePreference(), closeKakaoKeyModal(), closeLoginModal(), closeWhatsNewModal(), dismissWhatsNewForever(), logoutFamily(), saveKakaoJsKey(), sendChildLocationPing() (+6 more)

### Community 15 - "coords.py"
Cohesion: 0.31
Nodes (4): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), determine_landmark()

### Community 16 - "[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]"
Cohesion: 0.12
Nodes (24): api_auth_me(), _extract_bearer_token(), optional_auth(), require_admin(), require_auth(), require_parent(), get_user_by_token(), autoDetectUserLocation() (+16 more)

### Community 18 - "add_favorite_place"
Cohesion: 0.07
Nodes (31): api_places_favorite_add(), add_favorite_place(), toggle_favorite_place(), checkAppVersionUpdate(), isServerVersionNewer(), openRouteModal(), selectStartStation(), setupMobileLifecycle() (+23 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.11
Nodes (28): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), executeRestSearch(), initBusAlertSystem() (+20 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 24 - "set_cached_data"
Cohesion: 0.33
Nodes (11): init_db(), set_cached_data(), get_family_locations(), get_transit_routes(), initKakaoSafetyMap(), initLeafletSafetyMap(), 1) 개요 및 사용자 요구사항, 23. 자동 생성 버스 즐겨찾기 영구 삭제 & 우리아이 안심 위치 실시간 핀 전원 표출 패치 (v1.4.4) (+3 more)

### Community 25 - "restaurant.py"
Cohesion: 0.24
Nodes (7): api_restaurant(), api_restaurant_search(), add_favorite_restaurant(), delete_favorite_restaurant(), _dynamic_restaurant_status(), get_favorite_restaurants(), search_places_kakao()

### Community 26 - "3) 조치 및 해결 내역 (Remediation)"
Cohesion: 0.31
Nodes (9): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 조치 및 해결 내역 (Remediation) (+1 more)

### Community 27 - "25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

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

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `setTransitOrigin` to `main.py`, `initPinchToZoomEngine`, `loadFavorites`, `app.js`, `focusSinglePlaceOnMap`, `send_message`, `get_db_connection`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `add_favorite_place`, `showToast`, `initSheetGestures`, `set_cached_data`, `restaurant.py`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0915915915915916 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)`, `20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)`, `28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)`, `setTransitOrigin`, `19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)`, `6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `add_favorite_place`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`, `set_cached_data`, `3) 조치 및 해결 내역 (Remediation)`, `25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)`, `7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)`, `10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결`, `17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `set_cached_data` to `main.py`, `setTransitOrigin`, `hospital.py`, `get_db_connection`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `database.py`, `restaurant.py`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._