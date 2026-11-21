# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~46,427 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 444 nodes · 1053 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 139 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8edd9431`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- focusSinglePlaceOnMap
- setTransitOrigin
- showToast
- 📅 프로젝트 기본 정보
- update_user_location
- app.js
- family-care
- manifest.json
- submitFamilyLogin
- 3) 조치 및 해결 내역 (Remediation)
- quickAddFavoritePlace
- refreshData
- showToastNotice
- loadChatMessages
- api_route
- openSafetyModal
- initSafetyKakaoMap
- 🌿 우리가족챙기기 (Family Care)
- initClock

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 32 edges
2. `📅 프로젝트 기본 정보` - 24 edges
3. `showToast()` - 23 edges
4. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 21 edges
5. `loadFavorites()` - 17 edges
6. `focusSinglePlaceOnMap()` - 17 edges
7. `get_cached_data()` - 16 edges
8. `set_cached_data()` - 16 edges
9. `openCategoryDetail()` - 16 edges
10. `setTransitOrigin()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `📅 프로젝트 기본 정보` --references--> `update_favorite_place()`  [INFERRED]
  제작히스토리.md → backend/services/places.py
- `사례 5: 인라인 JSON 이스케이프 구문 오류 및 식당 CRUD 부재 결함` --references--> `delete_favorite_restaurant()`  [INFERRED]
  트러블슈팅.md → backend/services/restaurant.py
- `사례 5: 인라인 JSON 이스케이프 구문 오류 및 식당 CRUD 부재 결함` --references--> `update_favorite_restaurant()`  [INFERRED]
  트러블슈팅.md → backend/services/restaurant.py

## Import Cycles
- None detected.

## Communities (22 total, 2 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.06
Nodes (67): get_cached_data(), get_db_connection(), init_db(), set_cached_data(), api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms() (+59 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (39): openRouteModal(), selectStartStation(), 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom) (+31 more)

### Community 2 - "focusSinglePlaceOnMap"
Cohesion: 0.12
Nodes (38): clearCategoryMarkers(), clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), filterHospitalList(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById() (+30 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.13
Nodes (32): api_transit_station_arrivals(), get_station_arrivals(), calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome() (+24 more)

### Community 4 - "showToast"
Cohesion: 0.10
Nodes (29): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), executeHospitalSearch(), initBusAlertSystem() (+21 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.08
Nodes (26): add_favorite_place(), toggle_favorite_place(), autoDetectUserLocation(), buildRestaurantListHtml(), executeRestSearch(), quickRestSearch(), renderRestaurantDetail(), switchStationDirection() (+18 more)

### Community 6 - "update_user_location"
Cohesion: 0.11
Nodes (12): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), api_auth_heartbeat(), api_auth_login(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate() (+4 more)

### Community 7 - "app.js"
Cohesion: 0.11
Nodes (12): AppState, checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), openEditRestaurantModal(), openEditRestaurantModalById(), openPwaGuideModal() (+4 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "submitFamilyLogin"
Cohesion: 0.18
Nodes (11): checkAppVersionUpdate(), closeLoginModal(), isServerVersionNewer(), loadStoredSession(), sendUserHeartbeat(), setupMobileLifecycle(), startChildLocationTracker(), submitFamilyLogin() (+3 more)

### Community 11 - "3) 조치 및 해결 내역 (Remediation)"
Cohesion: 0.27
Nodes (10): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), openLoginModal(), 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis) (+2 more)

### Community 12 - "quickAddFavoritePlace"
Cohesion: 0.22
Nodes (9): quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), toggleFavoritePlace(), toggleSelectedPlaceFavorite() (+1 more)

### Community 13 - "refreshData"
Cohesion: 0.29
Nodes (8): checkChildSafetySummary(), initApp(), loadWeather(), refreshData(), refreshMyLocation(), renderFamilyLoginGrid(), renderWeatherTimelines(), selectLoginAccount()

### Community 14 - "showToastNotice"
Cohesion: 0.25
Nodes (8): closeKakaoKeyModal(), closeManualLocationModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), showToastNotice(), submitManualLocation()

### Community 15 - "loadChatMessages"
Cohesion: 0.25
Nodes (8): handleChatKeyDown(), loadChatMessages(), openChatDrawer(), requestNotificationPermission(), sendChatMessage(), sendLocationInChat(), switchChatRoom(), triggerMessageNotification()

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 17 - "openSafetyModal"
Cohesion: 0.33
Nodes (7): closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling()

### Community 18 - "initSafetyKakaoMap"
Cohesion: 0.29
Nodes (7): getKakaoJsKey(), initKakaoSafetyMap(), initLeafletSafetyMap(), initSafetyKakaoMap(), loadKakaoSdk(), openKakaoKeyModal(), updateMapEngineBadge()

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `main.py`, `focusSinglePlaceOnMap`, `setTransitOrigin`, `showToast`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `add_favorite_place()` and `toggle_favorite_place()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05901696088611977 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `3) 조치 및 해결 내역 (Remediation)`, `showToast`, `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `search_nearby_bus_stops()` connect `main.py` to `setTransitOrigin`, `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._