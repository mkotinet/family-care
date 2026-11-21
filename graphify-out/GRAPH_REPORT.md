# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~48,928 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 456 nodes · 1101 edges · 22 communities (21 shown, 1 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2594c758`
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
- 📅 프로젝트 기본 정보
- 15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7)
- refreshData
- showToastNotice
- loadChatMessages
- api_route
- openSafetyModal
- initSafetyKakaoMap
- 🌿 우리가족챙기기 (Family Care)
- saveBusAlarmSetting

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `showToast()` - 25 edges
3. `📅 프로젝트 기본 정보` - 25 edges
4. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 22 edges
5. `loadFavorites()` - 19 edges
6. `focusSinglePlaceOnMap()` - 19 edges
7. `get_cached_data()` - 16 edges
8. `set_cached_data()` - 16 edges
9. `openCategoryDetail()` - 16 edges
10. `setTransitOrigin()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `사례 13: 약국·병원 즐겨찾기 단일 장소 고착 및 버스 삭제 캐시 잔존 결함, 하루퀴즈 비밀번호 실시간 연동 로그인 고도화` --references--> `delete_cached_data()`  [INFERRED]
  트러블슈팅.md → backend/database.py
- `사례 13: 약국·병원 즐겨찾기 단일 장소 고착 및 버스 삭제 캐시 잔존 결함, 하루퀴즈 비밀번호 실시간 연동 로그인 고도화` --references--> `authenticate_user()`  [INFERRED]
  트러블슈팅.md → backend/services/auth.py
- `📅 프로젝트 기본 정보` --references--> `add_favorite_place()`  [INFERRED]
  제작히스토리.md → backend/services/places.py

## Import Cycles
- None detected.

## Communities (22 total, 1 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.06
Nodes (65): get_cached_data(), get_db_connection(), init_db(), set_cached_data(), api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms() (+57 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (39): openRouteModal(), selectStartStation(), 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom) (+31 more)

### Community 2 - "focusSinglePlaceOnMap"
Cohesion: 0.12
Nodes (37): clearCategoryMarkers(), clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), filterHospitalList(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById() (+29 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.14
Nodes (34): calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome(), handleCategoryMapClick(), initCategoryKakaoMap() (+26 more)

### Community 4 - "showToast"
Cohesion: 0.26
Nodes (13): closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), loadFavorites(), removeBusAlarm(), saveFavoriteEdit(), showToast() (+5 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.09
Nodes (26): add_favorite_place(), toggle_favorite_place(), checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById() (+18 more)

### Community 6 - "update_user_location"
Cohesion: 0.12
Nodes (11): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), api_auth_heartbeat(), api_auth_login(), api_location_manual_set(), api_location_test_simulate(), api_location_update() (+3 more)

### Community 7 - "app.js"
Cohesion: 0.08
Nodes (20): AppState, buildRestaurantListHtml(), checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), focusHospitalOnMap(), focusRestaurantOnMap() (+12 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "submitFamilyLogin"
Cohesion: 0.29
Nodes (9): closeLoginModal(), logoutFamily(), refreshData(), refreshMyLocation(), sendUserHeartbeat(), setupMobileLifecycle(), startChildLocationTracker(), submitFamilyLogin() (+1 more)

### Community 11 - "📅 프로젝트 기본 정보"
Cohesion: 0.08
Nodes (31): delete_cached_data(), api_places_favorite_update(), api_transit_station_arrivals(), api_transit_update(), update_favorite_place(), delete_favorite_route(), get_station_arrivals(), update_favorite_route() (+23 more)

### Community 12 - "15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7)"
Cohesion: 0.25
Nodes (8): renderCultureDetail(), switchCultureScope(), 15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7), 4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제, 5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제, 사례 4: 바텀 시트 컨테이너 DOM ID 불일치로 인한 탭 전환 먹통 결함 (TypeError: null.innerHTML), 🛠️ [트러블슈팅 및 오류검증 기술노트] 우리가족챙기기 (Family Care), 📋 핵심 체크리스트 (Gotcha Summary for Developers)

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

### Community 18 - "initSafetyKakaoMap"
Cohesion: 0.29
Nodes (7): getKakaoJsKey(), initKakaoSafetyMap(), initLeafletSafetyMap(), initSafetyKakaoMap(), loadKakaoSdk(), openKakaoKeyModal(), updateMapEngineBadge()

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "saveBusAlarmSetting"
Cohesion: 0.50
Nodes (4): closeBusAlarmModal(), playBusAlertChime(), saveBusAlarmSetting(), triggerBusArrivalNotification()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `main.py`, `focusSinglePlaceOnMap`, `setTransitOrigin`, `showToast`, `📅 프로젝트 기본 정보`, `15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7)`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.058896138247222715 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `focusSinglePlaceOnMap`, `setTransitOrigin`, `📅 프로젝트 기본 정보`, `📅 프로젝트 기본 정보`, `15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7)`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `add_favorite_place()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `search_nearby_bus_stops()` connect `main.py` to `📅 프로젝트 기본 정보`, `setTransitOrigin`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._