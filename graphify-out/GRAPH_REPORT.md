# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~50,554 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 461 nodes · 1130 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 179 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `16946fb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- focusSinglePlaceOnMap
- setTransitOrigin
- showToast
- 📅 프로젝트 기본 정보
- coords.py
- app.js
- family-care
- manifest.json
- executeRestSearch
- 📅 프로젝트 기본 정보
- initClock
- refreshData
- showToastNotice
- loadChatMessages
- api_route
- openSafetyModal
- 🌿 우리가족챙기기 (Family Care)
- saveBusAlarmSetting

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `📅 프로젝트 기본 정보` - 30 edges
3. `showToast()` - 25 edges
4. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 23 edges
5. `set_cached_data()` - 20 edges
6. `loadFavorites()` - 19 edges
7. `focusSinglePlaceOnMap()` - 19 edges
8. `get_cached_data()` - 16 edges
9. `openCategoryDetail()` - 16 edges
10. `setTransitOrigin()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템` --references--> `checkBusArrivalAlerts()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `2) 근본 원인 분석 (RCA)` --references--> `set_cached_data()`  [INFERRED]
  기술레포트.md → backend/database.py
- `3) 해결 조치 (Remediation)` --references--> `set_cached_data()`  [INFERRED]
  기술레포트.md → backend/database.py

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.05
Nodes (68): get_cached_data(), get_db_connection(), set_cached_data(), api_auth_family(), api_auth_heartbeat(), api_auth_login(), api_auth_me(), api_chat_messages() (+60 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (38): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 12. v1.3.4 고도화: 버스 지도 자동 정류장명 연동, 구간 전체 버스 시간표 및 도착 10분/5분/3분 알림 시스템, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom), 1) 결함 현상 (Symptom) (+30 more)

### Community 2 - "focusSinglePlaceOnMap"
Cohesion: 0.09
Nodes (44): clearCategoryMarkers(), clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), filterHospitalList(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById() (+36 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.10
Nodes (42): calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome(), handleCategoryMapClick(), initKakaoCategoryMap() (+34 more)

### Community 4 - "showToast"
Cohesion: 0.18
Nodes (19): closeEditFavoriteModal(), closeLoginModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), loadFavorites(), logoutFamily(), refreshData() (+11 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.08
Nodes (27): add_favorite_place(), toggle_favorite_place(), checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById() (+19 more)

### Community 6 - "coords.py"
Cohesion: 0.36
Nodes (3): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid()

### Community 7 - "app.js"
Cohesion: 0.08
Nodes (21): AppState, checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), getKakaoJsKey(), loadKakaoSdk(), LOCAL_HOSPITAL_COORDS_TABLE (+13 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "executeRestSearch"
Cohesion: 0.22
Nodes (9): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail(), 3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다") (+1 more)

### Community 11 - "📅 프로젝트 기본 정보"
Cohesion: 0.10
Nodes (31): delete_cached_data(), init_db(), api_location_family(), api_places_favorite_update(), api_transit_station_arrivals(), api_transit_update(), get_family_locations(), update_favorite_place() (+23 more)

### Community 13 - "refreshData"
Cohesion: 0.20
Nodes (10): checkChildSafetySummary(), closeManualLocationModal(), initApp(), loadWeather(), openLoginModal(), renderFamilyLoginGrid(), renderWeatherTimelines(), selectLoginAccount() (+2 more)

### Community 14 - "showToastNotice"
Cohesion: 0.33
Nodes (6): closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), showToastNotice()

### Community 15 - "loadChatMessages"
Cohesion: 0.25
Nodes (8): handleChatKeyDown(), loadChatMessages(), openChatDrawer(), requestNotificationPermission(), sendChatMessage(), sendLocationInChat(), switchChatRoom(), triggerMessageNotification()

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 17 - "openSafetyModal"
Cohesion: 0.33
Nodes (7): closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling()

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "saveBusAlarmSetting"
Cohesion: 0.33
Nodes (6): checkBusArrivalAlerts(), closeBusAlarmModal(), initBusAlertSystem(), playBusAlertChime(), saveBusAlarmSetting(), triggerBusArrivalNotification()

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `main.py`, `focusSinglePlaceOnMap`, `setTransitOrigin`, `showToast`, `📅 프로젝트 기본 정보`, `executeRestSearch`, `saveBusAlarmSetting`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05420353982300885 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `focusSinglePlaceOnMap`, `📅 프로젝트 기본 정보`, `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `main.py` to `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._