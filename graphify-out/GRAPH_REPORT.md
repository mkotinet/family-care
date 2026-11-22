# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~52,258 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 476 nodes · 1166 edges · 26 communities (25 shown, 1 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 191 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41816a40`
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
- 📌 목차
- get_family_locations
- database.py
- refreshData
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

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `📅 프로젝트 기본 정보` - 31 edges
3. `showToast()` - 25 edges
4. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 24 edges
5. `set_cached_data()` - 20 edges
6. `loadFavorites()` - 19 edges
7. `focusSinglePlaceOnMap()` - 19 edges
8. `openCategoryDetail()` - 17 edges
9. `📌 목차` - 16 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진` --references--> `checkAppVersionUpdate()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제` --references--> `renderCultureDetail()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `📅 프로젝트 기본 정보` --references--> `autoDetectUserLocation()`  [INFERRED]
  제작히스토리.md → frontend/static/app.js

## Import Cycles
- None detected.

## Communities (26 total, 1 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.10
Nodes (25): api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_location_family(), api_places_favorite_remove() (+17 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (39): openRouteModal(), selectStartStation(), 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom) (+31 more)

### Community 2 - "focusSinglePlaceOnMap"
Cohesion: 0.11
Nodes (39): clearCategoryMarkers(), clearCategoryRouteLine(), deleteFavoriteRestaurant(), drawRouteFromHome(), executeHospitalSearch(), filterHospitalList(), focusFavoritePlaceById(), focusFavoriteRestaurantById() (+31 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.15
Nodes (33): search_nearby_bus_stops(), calcDistanceKm(), clearTransitRouteLine(), closeSelectedPlaceCard(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome() (+25 more)

### Community 4 - "refreshData"
Cohesion: 0.25
Nodes (10): closeLoginModal(), loadStoredSession(), logoutFamily(), refreshData(), refreshMyLocation(), sendUserHeartbeat(), setupMobileLifecycle(), startChildLocationTracker() (+2 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.10
Nodes (23): add_favorite_place(), toggle_favorite_place(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6), 1) 결함 현상 (Symptom) (+15 more)

### Community 6 - "coords.py"
Cohesion: 0.36
Nodes (3): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid()

### Community 7 - "app.js"
Cohesion: 0.08
Nodes (27): AppState, buildRestaurantListHtml(), checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), getKakaoJsKey(), handleChatKeyDown() (+19 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "📌 목차"
Cohesion: 0.09
Nodes (20): api_transit_station_arrivals(), get_station_arrivals(), executeRestSearch(), quickRestSearch(), renderCultureDetail(), switchCultureScope(), 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동 (+12 more)

### Community 11 - "get_family_locations"
Cohesion: 0.27
Nodes (12): init_db(), get_family_locations(), autoDetectUserLocation(), initKakaoSafetyMap(), initLeafletSafetyMap(), initSafetyKakaoMap(), updateMapEngineBadge(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 12 - "database.py"
Cohesion: 0.23
Nodes (12): get_cached_data(), set_cached_data(), get_simulated_culture(), get_simulated_health_alerts(), get_simulated_weather(), math_sin_hour(), get_culture_and_crowd(), get_health_alerts() (+4 more)

### Community 13 - "refreshData"
Cohesion: 0.18
Nodes (11): checkChildSafetySummary(), closeManualLocationModal(), initApp(), loadWeather(), openLoginModal(), renderFamilyLoginGrid(), renderWeatherTimelines(), selectLoginAccount() (+3 more)

### Community 14 - "showToastNotice"
Cohesion: 0.18
Nodes (11): applyUserTextSizePreference(), checkAppVersionUpdate(), closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), isServerVersionNewer(), saveKakaoJsKey(), sendChildLocationPing() (+3 more)

### Community 15 - "update_user_location"
Cohesion: 0.12
Nodes (13): api_auth_heartbeat(), api_auth_login(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate(), api_location_update(), api_places_favorite_add() (+5 more)

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 17 - "openSafetyModal"
Cohesion: 0.33
Nodes (7): closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling()

### Community 18 - "get_db_connection"
Cohesion: 0.19
Nodes (16): delete_cached_data(), get_db_connection(), api_places_favorite_update(), api_restaurant_update(), api_transit(), api_transit_update(), get_simulated_transit(), remove_favorite_place() (+8 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.18
Nodes (18): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteTransitRoute(), initBusAlertSystem(), playBusAlertChime(), removeBusAlarm() (+10 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.20
Nodes (14): quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), toggleFavoritePlace(), toggleSelectedPlaceFavorite() (+6 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 24 - "auth.py"
Cohesion: 0.31
Nodes (5): authenticate_user(), generate_token(), hash_password(), touch_user_heartbeat(), verify_with_haru_quiz()

### Community 25 - "hospital.py"
Cohesion: 0.48
Nodes (5): api_hospital(), get_simulated_hospitals(), format_time_str(), get_hospital_pharmacy_info(), resolve_hospital_coords()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `setTransitOrigin` to `focusSinglePlaceOnMap`, `📅 프로젝트 기본 정보`, `📌 목차`, `get_family_locations`, `database.py`, `get_db_connection`, `showToast`, `initSheetGestures`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Are the 30 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09682539682539683 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `focusSinglePlaceOnMap`, `setTransitOrigin`, `📅 프로젝트 기본 정보`, `📌 목차`, `get_family_locations`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `database.py` to `get_family_locations`, `hospital.py`, `get_db_connection`, `setTransitOrigin`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._