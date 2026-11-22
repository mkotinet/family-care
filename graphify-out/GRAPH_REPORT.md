# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~55,258 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 492 nodes · 1194 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 197 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6011676d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- delete_favorite_restaurant
- setTransitOrigin
- refreshData
- 📅 프로젝트 기본 정보
- app.js
- family-care
- manifest.json
- loadFavorites
- database.py
- showToastNotice
- update_user_location
- api_route
- get_db_connection
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- auth.py
- hospital.py
- executeRestSearch
- initPinchToZoomEngine
- ⏱️ 단계별 개발 타임라인

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `📅 프로젝트 기본 정보` - 32 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 26 edges
4. `showToast()` - 25 edges
5. `set_cached_data()` - 20 edges
6. `loadFavorites()` - 19 edges
7. `focusSinglePlaceOnMap()` - 19 edges
8. `📌 목차` - 18 edges
9. `openCategoryDetail()` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제` --references--> `renderCultureDetail()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진` --references--> `checkAppVersionUpdate()`  [INFERRED]
  기술레포트.md → frontend/static/app.js

## Import Cycles
- None detected.

## Communities (25 total, 1 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.10
Nodes (26): api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_places_favorite_update(), api_places_favorites() (+18 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.04
Nodes (45): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1) 개요 및 사용자 요구사항, 1) 개요 및 사용자 요구사항, 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom) (+37 more)

### Community 2 - "delete_favorite_restaurant"
Cohesion: 0.40
Nodes (4): api_places_favorite_remove(), api_restaurant_delete(), api_transit_delete(), delete_favorite_restaurant()

### Community 3 - "setTransitOrigin"
Cohesion: 0.11
Nodes (45): search_nearby_bus_stops(), calcDistanceKm(), clearCategoryMarkers(), clearTransitRouteLine(), dropCustomTransitPin(), filterHospitalList(), findNearestBusStop(), focusHospitalByName() (+37 more)

### Community 4 - "refreshData"
Cohesion: 0.18
Nodes (14): checkChildSafetySummary(), closeLoginModal(), initApp(), loadWeather(), logoutFamily(), refreshData(), refreshMyLocation(), renderWeatherTimelines() (+6 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.17
Nodes (18): init_db(), api_location_family(), get_family_locations(), add_favorite_place(), toggle_favorite_place(), autoDetectUserLocation(), initKakaoSafetyMap(), initLeafletSafetyMap() (+10 more)

### Community 7 - "app.js"
Cohesion: 0.07
Nodes (33): AppState, checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), getKakaoJsKey(), handleChatKeyDown(), initClock() (+25 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 11 - "loadFavorites"
Cohesion: 0.23
Nodes (16): clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById(), isHospitalCategory(), isRestaurantCategory() (+8 more)

### Community 12 - "database.py"
Cohesion: 0.22
Nodes (15): wgs84_to_kma_grid(), get_cached_data(), set_cached_data(), get_simulated_culture(), get_simulated_health_alerts(), get_simulated_transit(), get_simulated_weather(), math_sin_hour() (+7 more)

### Community 14 - "showToastNotice"
Cohesion: 0.12
Nodes (18): applyUserTextSizePreference(), closeKakaoKeyModal(), closeManualLocationModal(), closeSafetyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), fetchFamilyLocations(), openSafetyModal() (+10 more)

### Community 15 - "update_user_location"
Cohesion: 0.11
Nodes (14): calculate_distance_km(), haversine_distance(), api_auth_login(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate(), api_location_update() (+6 more)

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 18 - "get_db_connection"
Cohesion: 0.27
Nodes (8): delete_cached_data(), get_db_connection(), remove_favorite_place(), update_favorite_place(), add_favorite_route(), delete_favorite_route(), update_favorite_route(), 2) 즐겨찾기 수정 및 원클릭 삭제 기능

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.16
Nodes (21): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), initBusAlertSystem(), playBusAlertChime() (+13 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.10
Nodes (23): api_transit_station_arrivals(), get_station_arrivals(), closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), renderCultureDetail() (+15 more)

### Community 24 - "auth.py"
Cohesion: 0.24
Nodes (6): api_auth_heartbeat(), authenticate_user(), generate_token(), hash_password(), touch_user_heartbeat(), verify_with_haru_quiz()

### Community 25 - "hospital.py"
Cohesion: 0.48
Nodes (5): api_hospital(), get_simulated_hospitals(), format_time_str(), get_hospital_pharmacy_info(), resolve_hospital_coords()

### Community 26 - "executeRestSearch"
Cohesion: 0.17
Nodes (12): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail(), 15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7) (+4 more)

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.47
Nodes (6): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 사례 16: 모바일 뷰포트 확대 차단(user-scalable=no) 결함 및 두 손가락 핀치 줌(Pinch-to-Zoom) 엔진·원클릭 리셋 구현

### Community 28 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.07
Nodes (29): checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), openRouteModal(), selectStartStation() (+21 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `setTransitOrigin`, `database.py`, `get_db_connection`, `showToast`, `initSheetGestures`, `executeRestSearch`, `initPinchToZoomEngine`, `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.201) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `📅 프로젝트 기본 정보`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`, `executeRestSearch`, `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `database.py` to `hospital.py`, `get_db_connection`, `setTransitOrigin`, `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._