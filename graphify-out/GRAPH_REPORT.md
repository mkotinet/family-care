# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~53,952 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 487 nodes · 1188 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e881a6c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- focusSinglePlaceOnMap
- setTransitOrigin
- refreshData
- 📅 프로젝트 기본 정보
- coords.py
- app.js
- family-care
- manifest.json
- get_station_arrivals
- loadFavorites
- database.py
- database.py
- showToastNotice
- update_user_location
- api_route
- openSafetyModal
- get_db_connection
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- auth.py
- hospital.py
- executeRestSearch
- initPinchToZoomEngine
- 3) 조치 및 해결 내역 (Remediation)

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `📅 프로젝트 기본 정보` - 32 edges
3. `showToast()` - 25 edges
4. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 25 edges
5. `set_cached_data()` - 20 edges
6. `loadFavorites()` - 19 edges
7. `focusSinglePlaceOnMap()` - 19 edges
8. `openCategoryDetail()` - 17 edges
9. `📌 목차` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진` --references--> `checkAppVersionUpdate()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` --references--> `showToast()`  [INFERRED]
  기술레포트.md → frontend/static/app.js

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.12
Nodes (20): api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_places_favorites(), api_restaurant() (+12 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.04
Nodes (44): openRouteModal(), selectStartStation(), 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1. 개요 및 프로젝트 목표 (+36 more)

### Community 2 - "focusSinglePlaceOnMap"
Cohesion: 0.22
Nodes (20): clearCategoryMarkers(), clearCategoryRouteLine(), drawRouteFromHome(), focusHospitalByName(), focusHospitalOnMap(), focusRestaurantByName(), focusRestaurantOnMap(), focusSinglePlaceOnMap() (+12 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.20
Nodes (25): calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome(), handleCategoryMapClick(), openSelectedPlaceCard() (+17 more)

### Community 4 - "refreshData"
Cohesion: 0.17
Nodes (15): checkChildSafetySummary(), closeLoginModal(), closeManualLocationModal(), initApp(), loadWeather(), logoutFamily(), refreshData(), refreshMyLocation() (+7 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.09
Nodes (31): init_db(), api_location_family(), get_family_locations(), add_favorite_place(), toggle_favorite_place(), autoDetectUserLocation(), checkAppVersionUpdate(), initKakaoSafetyMap() (+23 more)

### Community 6 - "coords.py"
Cohesion: 0.36
Nodes (3): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid()

### Community 7 - "app.js"
Cohesion: 0.07
Nodes (29): AppState, checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), getKakaoJsKey(), handleChatKeyDown(), initClock() (+21 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "get_station_arrivals"
Cohesion: 0.20
Nodes (8): api_transit_station_arrivals(), get_station_arrivals(), checkBusArrivalAlerts(), initBusAlertSystem(), 12. v1.3.4 고도화: 버스 지도 자동 정류장명 연동, 구간 전체 버스 시간표 및 도착 10분/5분/3분 알림 시스템, 2) 즐겨찾기 구간별 운행 버스 전체 실시간 시간표 (타임테이블), 3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템, 사례 9: 버스 정류소 명칭 왜곡 및 호평동 vs 서울 운행 방향 반대 노출 결함 (카카오버스 100% 정답 일치) (v1.3.9)

### Community 11 - "loadFavorites"
Cohesion: 0.24
Nodes (15): closeSelectedPlaceCard(), deleteFavoriteRestaurant(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById(), isHospitalCategory(), isRestaurantCategory(), isTransitCategory() (+7 more)

### Community 12 - "database.py"
Cohesion: 0.22
Nodes (16): get_cached_data(), set_cached_data(), api_weather(), get_simulated_culture(), get_simulated_health_alerts(), get_simulated_transit(), get_simulated_weather(), math_sin_hour() (+8 more)

### Community 14 - "showToastNotice"
Cohesion: 0.22
Nodes (9): applyUserTextSizePreference(), closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), setTextSizeMode(), showToastNotice() (+1 more)

### Community 15 - "update_user_location"
Cohesion: 0.15
Nodes (10): api_auth_login(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate(), api_location_update(), api_places_favorite_add(), api_transit_add() (+2 more)

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 17 - "openSafetyModal"
Cohesion: 0.15
Nodes (14): closeSafetyModal(), fetchFamilyLocations(), openLoginModal(), openSafetyModal(), renderFamilyLoginGrid(), requestChildLocationRefresh(), selectLoginAccount(), simulateChildLocation() (+6 more)

### Community 18 - "get_db_connection"
Cohesion: 0.15
Nodes (17): delete_cached_data(), get_db_connection(), api_places_favorite_remove(), api_places_favorite_update(), api_restaurant_delete(), api_restaurant_update(), api_transit_delete(), api_transit_update() (+9 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.24
Nodes (15): closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteTransitRoute(), playBusAlertChime(), removeBusAlarm(), renderTransitDetail(), resetTransitRouteBuilder() (+7 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.12
Nodes (21): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), renderCultureDetail(), switchCultureScope(), toggleSheetExpand() (+13 more)

### Community 24 - "auth.py"
Cohesion: 0.24
Nodes (6): api_auth_heartbeat(), authenticate_user(), generate_token(), hash_password(), touch_user_heartbeat(), verify_with_haru_quiz()

### Community 25 - "hospital.py"
Cohesion: 0.48
Nodes (5): api_hospital(), get_simulated_hospitals(), format_time_str(), get_hospital_pharmacy_info(), resolve_hospital_coords()

### Community 26 - "executeRestSearch"
Cohesion: 0.17
Nodes (12): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), filterHospitalList(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail() (+4 more)

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.27
Nodes (10): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA) (+2 more)

### Community 28 - "3) 조치 및 해결 내역 (Remediation)"
Cohesion: 0.53
Nodes (6): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), 3) 조치 및 해결 내역 (Remediation), 2026-11-22 (v1.3.6 긴급 핫픽스: 전체 메뉴 터치/동작 무반응 결함 완벽 해결)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `focusSinglePlaceOnMap`, `setTransitOrigin`, `get_station_arrivals`, `database.py`, `get_db_connection`, `showToast`, `initSheetGestures`, `executeRestSearch`, `initPinchToZoomEngine`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12315270935960591 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `📅 프로젝트 기본 정보`, `get_station_arrivals`, `openSafetyModal`, `quickAddFavoritePlace`, `initSheetGestures`, `executeRestSearch`, `initPinchToZoomEngine`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `database.py` to `hospital.py`, `get_db_connection`, `📅 프로젝트 기본 정보`, `database.py`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._