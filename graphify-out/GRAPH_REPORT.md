# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~58,581 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 503 nodes · 1211 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 201 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b9ef607`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- openSafetyModal
- setTransitOrigin
- refreshData
- 📅 프로젝트 기본 정보
- openLoginModal
- app.js
- family-care
- manifest.json
- initClock
- showToastNotice
- update_user_location
- api_route
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- initPinchToZoomEngine
- ⏱️ 단계별 개발 타임라인

## God Nodes (most connected - your core abstractions)
1. `get_db_connection()` - 33 edges
2. `📅 프로젝트 기본 정보` - 32 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 27 edges
4. `showToast()` - 25 edges
5. `loadFavorites()` - 20 edges
6. `set_cached_data()` - 20 edges
7. `focusSinglePlaceOnMap()` - 19 edges
8. `📌 목차` - 19 edges
9. `openCategoryDetail()` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py
- `8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진` --references--> `checkAppVersionUpdate()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `사례 17: 기상청 초단기실황 45분 과거 고착(minute < 45 버그) 및 산악 관측소 센서 편차로 인한 실시간 날씨 왜곡(-7.2℃ vs 실제 -2.2℃) RCA 및 날씨알리미 동네예보 보간 동기화` --references--> `loadWeather()`  [INFERRED]
  트러블슈팅.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `사례 13: 약국·병원 즐겨찾기 단일 장소 고착 및 버스 삭제 캐시 잔존 결함, 하루퀴즈 비밀번호 실시간 연동 로그인 고도화` --references--> `authenticate_user()`  [INFERRED]
  트러블슈팅.md → backend/services/auth.py

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.06
Nodes (70): delete_cached_data(), get_cached_data(), get_db_connection(), set_cached_data(), api_auth_family(), api_auth_me(), api_chat_messages(), api_chat_rooms() (+62 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.05
Nodes (42): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 1) 개요 및 사용자 요구사항, 1. 개요 및 프로젝트 목표, 1) 결함 현상 (Symptom), 1) 결함 현상 (Symptom), 1) 기술적 배경 및 개요, 1) 카카오 디벨로퍼스 2024~2026 신규 UI 도메인 등록 완결 (+34 more)

### Community 2 - "openSafetyModal"
Cohesion: 0.25
Nodes (9): closeManualLocationModal(), closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling() (+1 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.10
Nodes (52): calcDistanceKm(), clearCategoryMarkers(), clearCategoryRouteLine(), clearTransitRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), dropCustomTransitPin(), filterHospitalList() (+44 more)

### Community 4 - "refreshData"
Cohesion: 0.17
Nodes (16): checkChildSafetySummary(), closeLoginModal(), initApp(), loadWeather(), logoutFamily(), refreshData(), refreshMyLocation(), renderWeatherTimelines() (+8 more)

### Community 5 - "📅 프로젝트 기본 정보"
Cohesion: 0.10
Nodes (29): init_db(), api_location_family(), get_family_locations(), add_favorite_place(), toggle_favorite_place(), autoDetectUserLocation(), buildRestaurantListHtml(), executeRestSearch() (+21 more)

### Community 6 - "openLoginModal"
Cohesion: 0.40
Nodes (5): openLoginModal(), renderFamilyLoginGrid(), selectLoginAccount(), updateLoginModalFooter(), 2) 근본 원인 분석 (RCA - Root Cause Analysis)

### Community 7 - "app.js"
Cohesion: 0.07
Nodes (25): AppState, checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), getKakaoJsKey(), handleChatKeyDown(), loadChatMessages() (+17 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 14 - "showToastNotice"
Cohesion: 0.18
Nodes (11): applyUserTextSizePreference(), checkAppVersionUpdate(), closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), isServerVersionNewer(), saveKakaoJsKey(), sendChildLocationPing() (+3 more)

### Community 15 - "update_user_location"
Cohesion: 0.12
Nodes (11): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), api_auth_heartbeat(), api_auth_login(), api_location_manual_set(), api_location_test_simulate(), api_location_update() (+3 more)

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.06
Nodes (51): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), executeHospitalSearch(), focusFavoritePlaceById() (+43 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.19
Nodes (15): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), toggleFavoritePlace() (+7 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.27
Nodes (10): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA) (+2 more)

### Community 28 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.10
Nodes (21): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), openRouteModal(), selectStartStation(), 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6) (+13 more)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `📅 프로젝트 기본 정보` to `main.py`, `setTransitOrigin`, `showToast`, `initSheetGestures`, `initPinchToZoomEngine`, `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 31 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05625790139064475 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `📅 프로젝트 기본 정보`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`, `initPinchToZoomEngine`, `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `main.py` to `📅 프로젝트 기본 정보`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._