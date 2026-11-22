# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~59,818 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 506 nodes · 1219 edges · 33 communities (32 shown, 1 thin omitted)
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 207 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4310efc8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- openSafetyModal
- setTransitOrigin
- refreshData
- executeRestSearch
- initApp
- app.js
- family-care
- manifest.json
- openCategoryDetail
- renderCultureDetail
- 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)
- 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결
- showToastNotice
- update_user_location
- api_route
- 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편
- startChildLocationTracker
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)
- 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)
- 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)
- initPinchToZoomEngine
- ⏱️ 단계별 개발 타임라인
- 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)
- 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)
- 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)
- 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)

## God Nodes (most connected - your core abstractions)
1. `📅 프로젝트 기본 정보` - 33 edges
2. `get_db_connection()` - 33 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 28 edges
4. `showToast()` - 25 edges
5. `loadFavorites()` - 20 edges
6. `📌 목차` - 20 edges
7. `set_cached_data()` - 20 edges
8. `focusSinglePlaceOnMap()` - 19 edges
9. `openCategoryDetail()` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템` --references--> `checkBusArrivalAlerts()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `2) 근본 원인 분석 (RCA - Root Cause Analysis)` --references--> `search_nearby_bus_stops()`  [INFERRED]
  기술레포트.md → backend/services/transit.py

## Import Cycles
- None detected.

## Communities (33 total, 1 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.05
Nodes (79): delete_cached_data(), get_cached_data(), get_db_connection(), init_db(), set_cached_data(), api_auth_family(), api_auth_me(), api_chat_messages() (+71 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.18
Nodes (10): 12. v1.3.4 고도화: 버스 지도 자동 정류장명 연동, 구간 전체 버스 시간표 및 도착 10분/5분/3분 알림 시스템, 1. 개요 및 프로젝트 목표, 29. 버스 정류소 서울/호평 방면 100% 지리 실측 교정 및 즐겨찾기 양방향 메뉴 최상단 배치 UX 고도화 (v1.4.9), 2. 시스템 아키텍처 및 핵심 설계 패턴, 30. 결론 및 종합 검증 결과, 3. 6대 기능별 상세 구현 명세, 3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템, 4. 공통 개발 지침 준수 결과 (+2 more)

### Community 2 - "openSafetyModal"
Cohesion: 0.18
Nodes (12): closeSafetyModal(), fetchFamilyLocations(), getKakaoJsKey(), initSafetyKakaoMap(), loadKakaoSdk(), openKakaoKeyModal(), openSafetyModal(), requestChildLocationRefresh() (+4 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.11
Nodes (48): calcDistanceKm(), clearCategoryMarkers(), clearCategoryRouteLine(), clearTransitRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), dropCustomTransitPin(), filterHospitalList() (+40 more)

### Community 4 - "refreshData"
Cohesion: 0.31
Nodes (9): applyUserTextSizePreference(), closeLoginModal(), logoutFamily(), refreshData(), refreshMyLocation(), sendUserHeartbeat(), setupMobileLifecycle(), submitFamilyLogin() (+1 more)

### Community 5 - "executeRestSearch"
Cohesion: 0.22
Nodes (9): buildRestaurantListHtml(), executeHospitalSearch(), executeRestSearch(), quickRestSearch(), renderHospitalDetail(), renderHospitalDetailContent(), renderRestaurantDetail(), 3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다") (+1 more)

### Community 6 - "initApp"
Cohesion: 0.18
Nodes (11): checkChildSafetySummary(), closeManualLocationModal(), initApp(), loadWeather(), openLoginModal(), renderFamilyLoginGrid(), renderWeatherTimelines(), selectLoginAccount() (+3 more)

### Community 7 - "app.js"
Cohesion: 0.06
Nodes (29): AppState, checkBusArrivalAlerts(), checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), focusHospitalOnMap(), focusRestaurantOnMap() (+21 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "openCategoryDetail"
Cohesion: 0.22
Nodes (14): focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById(), isHospitalCategory(), isRestaurantCategory(), isTransitCategory(), openCategoryDetail(), renderHealthDetail() (+6 more)

### Community 11 - "renderCultureDetail"
Cohesion: 0.33
Nodes (6): renderCultureDetail(), switchCultureScope(), 4) 버그 4: 전국 축제보기 메뉴 버튼이 실행되지 않는 문제, 사례 4: 바텀 시트 컨테이너 DOM ID 불일치로 인한 탭 전환 먹통 결함 (TypeError: null.innerHTML), 🛠️ [트러블슈팅 및 오류검증 기술노트] 우리가족챙기기 (Family Care), 📋 핵심 체크리스트 (Gotcha Summary for Developers)

### Community 12 - "7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)"
Cohesion: 0.33
Nodes (6): 7.1 하루퀴즈 회원 DB 연동 및 4인 가족 계정 체계, 7.2 날씨 카드 3단 타임라인 뷰 (`hourly` / `three_hourly` / `weekly`), 7.3 카카오맵 인터랙티브 지도 뷰 & 교통 출발/도착 선택, 7.4 자녀 실시간 GPS 안심 위치 추적 시스템 (`/api/location/*`), 7.5 가족 전용 실시간 채팅방 (`/api/chat/*`), 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)

### Community 13 - "10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결"
Cohesion: 0.40
Nodes (5): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 1) 카카오 디벨로퍼스 2024~2026 신규 UI 도메인 등록 완결, 2) 약국/식당 목록-지도 핀 원터치 연동 및 즐겨찾기 점검, 3) 버스 지도 직접 핀 꽂기 & 나만의 버스 루트 생성, 4) 모바일 브라우저별 PWA 및 실시간 알림 가이드 완비

### Community 14 - "showToastNotice"
Cohesion: 0.25
Nodes (8): closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), setTextSizeMode(), showToastNotice(), toggleTextSize()

### Community 15 - "update_user_location"
Cohesion: 0.09
Nodes (16): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), api_auth_heartbeat(), api_auth_login(), api_location_manual_set(), api_location_test_simulate(), api_location_update() (+8 more)

### Community 16 - "api_route"
Cohesion: 0.29
Nodes (4): serve_favicon(), serve_index(), serve_manifest(), serve_sw()

### Community 17 - "13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편"
Cohesion: 0.40
Nodes (5): 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동, 3) 축제 나들이 카드 내 위치(경기/수도권) 한정 & 전국 확대, 4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화, 5) 식당 검색 엔진 고도화

### Community 18 - "startChildLocationTracker"
Cohesion: 0.67
Nodes (4): startChildLocationTracker(), reportPos(), triggerImmediatePing(), 사례 18: 버스 즐겨찾기 양방향(오는 길) 정보 부재 및 이마트 평내행 정류소 누락 결함, 로그인 창 예시 비번 노출 및 자녀 백그라운드 상주 세션 판정(sqlite3.Row AttributeError) RCA·해결

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.15
Nodes (23): closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), loadFavorites(), playBusAlertChime(), removeBusAlarm() (+15 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 24 - "17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)"
Cohesion: 0.50
Nodes (4): 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 25 - "25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 26 - "26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.47
Nodes (6): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 사례 16: 모바일 뷰포트 확대 차단(user-scalable=no) 결함 및 두 손가락 핀치 줌(Pinch-to-Zoom) 엔진·원클릭 리셋 구현

### Community 28 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.07
Nodes (33): add_favorite_place(), toggle_favorite_place(), checkAppVersionUpdate(), isServerVersionNewer(), openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById() (+25 more)

### Community 29 - "20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)"
Cohesion: 0.50
Nodes (4): 1) 결함 현상 (Symptom), 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 30 - "28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)"
Cohesion: 0.50
Nodes (4): 1) 기술적 배경 및 개요, 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8), 2) 결함 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 31 - "19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)"
Cohesion: 0.67
Nodes (3): 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis)

### Community 32 - "6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)"
Cohesion: 0.67
Nodes (3): 6.1 연동된 6대 실시간 공공 API 명세 및 검증, 6.2 보안 및 무중단 배포 검증, 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `main.py` to `setTransitOrigin`, `executeRestSearch`, `app.js`, `openCategoryDetail`, `renderCultureDetail`, `showToast`, `initSheetGestures`, `initPinchToZoomEngine`, `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05369605469306367 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `main.py`, `6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)`, `setTransitOrigin`, `7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)`, `10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결`, `13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편`, `showToast`, `quickAddFavoritePlace`, `initSheetGestures`, `17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)`, `25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)`, `26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)`, `⏱️ 단계별 개발 타임라인`, `20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)`, `28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)`, `19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `setTransitOrigin` be split into smaller, more focused modules?**
  _Cohesion score 0.10904255319148937 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._