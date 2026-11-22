# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~64,309 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 541 nodes · 1346 edges · 21 communities (20 shown, 1 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 238 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4316643d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- auth.py
- setTransitOrigin
- refreshData
- loadFavorites
- app.js
- family-care
- manifest.json
- focusSinglePlaceOnMap
- loadChatMessages
- coords.py
- 📅 프로젝트 기본 정보
- add_favorite_place
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- 📌 목차
- executeRestSearch

## God Nodes (most connected - your core abstractions)
1. `📅 프로젝트 기본 정보` - 42 edges
2. `get_db_connection()` - 36 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 31 edges
4. `showToast()` - 27 edges
5. `📌 목차` - 23 edges
6. `loadFavorites()` - 21 edges
7. `set_cached_data()` - 20 edges
8. `focusSinglePlaceOnMap()` - 19 edges
9. `openCategoryDetail()` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제` --references--> `renderCultureDetail()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템` --references--> `checkBusArrivalAlerts()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py

## Import Cycles
- None detected.

## Communities (21 total, 1 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.06
Nodes (62): get_audit_logs(), get_cached_data(), get_db_connection(), init_db(), set_cached_data(), api_admin_audit_logs(), api_auth_family(), api_auth_heartbeat() (+54 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (42): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1) 개요 및 사용자 요구사항, 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom), 1) 결함 현상 (Symptom), 1) 결함 현상 (Symptom) (+34 more)

### Community 2 - "auth.py"
Cohesion: 0.11
Nodes (22): write_audit_log(), add_security_headers(), api_auth_login(), api_auth_logout(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate() (+14 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.15
Nodes (30): get_station_arrivals(), calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome(), handleCategoryMapClick() (+22 more)

### Community 4 - "refreshData"
Cohesion: 0.16
Nodes (16): applyUserTextSizePreference(), checkChildSafetySummary(), closeLoginModal(), closeManualLocationModal(), initApp(), loadWeather(), logoutFamily(), refreshData() (+8 more)

### Community 5 - "loadFavorites"
Cohesion: 0.19
Nodes (17): clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById(), isHospitalCategory(), isRestaurantCategory() (+9 more)

### Community 7 - "app.js"
Cohesion: 0.06
Nodes (39): AppState, checkBusArrivalAlerts(), checkPwaDisplayMode(), closeKakaoKeyModal(), closeSafetyModal(), closeWhatsNewModal(), dismissPwaBanner(), dismissWhatsNewForever() (+31 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "focusSinglePlaceOnMap"
Cohesion: 0.25
Nodes (18): clearCategoryMarkers(), filterHospitalList(), focusHospitalByName(), focusHospitalOnMap(), focusRestaurantByName(), focusRestaurantOnMap(), focusSinglePlaceOnMap(), initCategoryKakaoMap() (+10 more)

### Community 11 - "loadChatMessages"
Cohesion: 0.15
Nodes (15): closeRouteModal(), handleChatKeyDown(), loadChatMessages(), openChatDrawer(), openLoginModal(), renderFamilyLoginGrid(), requestNotificationPermission(), requireFamilyLogin() (+7 more)

### Community 15 - "coords.py"
Cohesion: 0.31
Nodes (4): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), determine_landmark()

### Community 16 - "📅 프로젝트 기본 정보"
Cohesion: 0.08
Nodes (35): delete_cached_data(), api_auth_me(), api_places_favorite_update(), api_transit_update(), _extract_bearer_token(), optional_auth(), require_admin(), require_auth() (+27 more)

### Community 18 - "add_favorite_place"
Cohesion: 0.06
Nodes (35): api_places_favorite_add(), add_favorite_place(), toggle_favorite_place(), checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal() (+27 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.17
Nodes (19): closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), playBusAlertChime(), removeBusAlarm(), renderTransitDetail() (+11 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 27 - "📌 목차"
Cohesion: 0.11
Nodes (23): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), renderCultureDetail(), resetPageZoom(), startChildLocationTracker(), reportPos(), triggerImmediatePing() (+15 more)

### Community 28 - "executeRestSearch"
Cohesion: 0.15
Nodes (13): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail(), 15. 사용자 버그레포트 6종 정밀 해결 및 핀/검색/즐겨찾기 고도화 (v1.3.7) (+5 more)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `main.py`, `setTransitOrigin`, `loadFavorites`, `app.js`, `focusSinglePlaceOnMap`, `loadChatMessages`, `add_favorite_place`, `showToast`, `initSheetGestures`, `📌 목차`, `executeRestSearch`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **Are the 41 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06222222222222222 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `main.py`, `setTransitOrigin`, `📅 프로젝트 기본 정보`, `add_favorite_place`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`, `📌 목차`, `executeRestSearch`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `main.py` to `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._