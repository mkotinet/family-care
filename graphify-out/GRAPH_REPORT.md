# Graph Report - family-care  (2026-11-22)

## Corpus Check
- 24 files · ~62,361 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 515 nodes · 1240 edges · 35 communities (33 shown, 2 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 220 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `08e4d6d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- openSafetyModal
- setTransitOrigin
- refreshData
- 8. v1.1.0 자동 업데이트 & 무장애 하이브리드 지도 고도화 (2026-11-21)
- initApp
- app.js
- family-care
- manifest.json
- 📌 목차
- loadChatMessages
- 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)
- 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결
- showToastNotice
- coords.py
- request_child_ping
- loadKakaoSdk
- 3) 조치 및 해결 내역 (Remediation)
- 🌿 우리가족챙기기 (Family Care)
- showToast
- quickAddFavoritePlace
- initSheetGestures
- 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)
- openRouteModal
- 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)
- initPinchToZoomEngine
- ⏱️ 단계별 개발 타임라인
- 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)
- 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)
- 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)
- 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)
- 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)
- initClock

## God Nodes (most connected - your core abstractions)
1. `📅 프로젝트 기본 정보` - 36 edges
2. `get_db_connection()` - 33 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 30 edges
4. `showToast()` - 26 edges
5. `📌 목차` - 22 edges
6. `loadFavorites()` - 20 edges
7. `set_cached_data()` - 20 edges
8. `focusSinglePlaceOnMap()` - 19 edges
9. `openCategoryDetail()` - 17 edges
10. `get_cached_data()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py
- `1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동` --references--> `clearCategoryMarkers()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `3) 버스 도착 10분 전 / 5분 전 / 3분 전 지능형 알림 시스템` --references--> `checkBusArrivalAlerts()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `📅 프로젝트 기본 정보` --references--> `serve_index()`  [INFERRED]
  제작히스토리.md → backend/main.py
- `📅 프로젝트 기본 정보` --references--> `request_child_ping()`  [INFERRED]
  제작히스토리.md → backend/services/location.py

## Import Cycles
- None detected.

## Communities (35 total, 2 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.05
Nodes (73): delete_cached_data(), get_cached_data(), get_db_connection(), set_cached_data(), api_auth_family(), api_auth_heartbeat(), api_auth_login(), api_auth_me() (+65 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.20
Nodes (9): 1. 개요 및 프로젝트 목표, 2. 시스템 아키텍처 및 핵심 설계 패턴, 30.1 구현 개요 및 주요 배경, 30. 가족 채팅 실시간 위치 공유 핀 원클릭 대화형 지도 뷰어 탑재 (v1.5.0), 32. 결론 및 종합 검증 결과, 3. 6대 기능별 상세 구현 명세, 4. 공통 개발 지침 준수 결과, 5. 결론 및 향후 계획 (+1 more)

### Community 2 - "openSafetyModal"
Cohesion: 0.33
Nodes (7): closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling()

### Community 3 - "setTransitOrigin"
Cohesion: 0.13
Nodes (31): api_transit_station_arrivals(), get_station_arrivals(), calcDistanceKm(), clearTransitRouteLine(), dropCustomTransitPin(), findNearestBusStop(), formatFriendlyPlaceName(), getDistanceFromHome() (+23 more)

### Community 4 - "refreshData"
Cohesion: 0.22
Nodes (13): applyUserTextSizePreference(), closeLoginModal(), logoutFamily(), refreshData(), refreshMyLocation(), sendUserHeartbeat(), setupMobileLifecycle(), startChildLocationTracker() (+5 more)

### Community 5 - "8. v1.1.0 자동 업데이트 & 무장애 하이브리드 지도 고도화 (2026-11-21)"
Cohesion: 0.25
Nodes (8): checkAppVersionUpdate(), isServerVersionNewer(), 8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진, 8.2 카카오맵 SDK 로딩 지연 원인 규명(RCA) 및 무장애 하이브리드 지도 엔진 구축, 8.3 우리 아이 안심 위치 시스템 대규모 고도화 및 무결성 검증 (v1.2.0), 8.4 안드로이드 PWA 앱 설치(A2HS) 및 아이들 실시간 로그인 모니터링 연동 (v1.3.0), 8. v1.1.0 자동 업데이트 & 무장애 하이브리드 지도 고도화 (2026-11-21), [2026-11-21] 1단계: 프로젝트 환경 세팅, 상큼한 UI 뼈대 및 도커 배포 구성 완료

### Community 6 - "initApp"
Cohesion: 0.18
Nodes (11): checkChildSafetySummary(), closeManualLocationModal(), initApp(), loadWeather(), openLoginModal(), renderFamilyLoginGrid(), renderWeatherTimelines(), selectLoginAccount() (+3 more)

### Community 7 - "app.js"
Cohesion: 0.09
Nodes (15): AppState, checkPwaDisplayMode(), closeRouteModal(), dismissPwaBanner(), LOCAL_HOSPITAL_COORDS_TABLE, openEditRestaurantModal(), openEditRestaurantModalById(), openPwaGuideModal() (+7 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "📌 목차"
Cohesion: 0.06
Nodes (62): clearCategoryMarkers(), clearCategoryRouteLine(), closeSelectedPlaceCard(), drawRouteFromHome(), executeHospitalSearch(), filterHospitalList(), focusFavoritePlaceById(), focusFavoriteRestaurantById() (+54 more)

### Community 11 - "loadChatMessages"
Cohesion: 0.25
Nodes (8): handleChatKeyDown(), loadChatMessages(), openChatDrawer(), requestNotificationPermission(), sendChatMessage(), sendLocationInChat(), switchChatRoom(), triggerMessageNotification()

### Community 12 - "7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)"
Cohesion: 0.33
Nodes (6): 7.1 하루퀴즈 회원 DB 연동 및 4인 가족 계정 체계, 7.2 날씨 카드 3단 타임라인 뷰 (`hourly` / `three_hourly` / `weekly`), 7.3 카카오맵 인터랙티브 지도 뷰 & 교통 출발/도착 선택, 7.4 자녀 실시간 GPS 안심 위치 추적 시스템 (`/api/location/*`), 7.5 가족 전용 실시간 채팅방 (`/api/chat/*`), 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)

### Community 13 - "10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결"
Cohesion: 0.40
Nodes (5): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 1) 카카오 디벨로퍼스 2024~2026 신규 UI 도메인 등록 완결, 2) 약국/식당 목록-지도 핀 원터치 연동 및 즐겨찾기 점검, 3) 버스 지도 직접 핀 꽂기 & 나만의 버스 루트 생성, 4) 모바일 브라우저별 PWA 및 실시간 알림 가이드 완비

### Community 14 - "showToastNotice"
Cohesion: 0.25
Nodes (8): closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), setTextSizeMode(), showToastNotice(), toggleTextSize()

### Community 15 - "coords.py"
Cohesion: 0.36
Nodes (3): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid()

### Community 16 - "request_child_ping"
Cohesion: 0.14
Nodes (11): api_location_request_ping(), serve_favicon(), serve_index(), serve_manifest(), serve_sw(), request_child_ping(), checkWhatsNewPopup(), openWhatsNewModal() (+3 more)

### Community 17 - "loadKakaoSdk"
Cohesion: 0.33
Nodes (6): getKakaoJsKey(), loadKakaoSdk(), openChatMessageLocationMap(), openChatMessageLocationMapById(), openKakaoKeyModal(), [사례 20: 가족 채팅 실시간 위치 공유 메시지 핀 터치 시 인터랙티브 지도 뷰어 팝업 연동 (v1.5.0)]

### Community 18 - "3) 조치 및 해결 내역 (Remediation)"
Cohesion: 0.31
Nodes (9): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 조치 및 해결 내역 (Remediation) (+1 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.20
Nodes (14): checkBusArrivalAlerts(), closeBusAlarmModal(), closeEditFavoriteModal(), deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), initBusAlertSystem(), playBusAlertChime() (+6 more)

### Community 22 - "quickAddFavoritePlace"
Cohesion: 0.26
Nodes (12): loadStoredSession(), quickAddFavoriteFestivalById(), quickAddFavoriteHospitalById(), quickAddFavoriteHospitalByName(), quickAddFavoritePlace(), quickAddFavoriteRestaurantById(), quickAddFavoriteRestaurantByName(), 1) 개요 및 사용자 요구사항 (+4 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.26
Nodes (11): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5) (+3 more)

### Community 24 - "17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)"
Cohesion: 0.50
Nodes (4): 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 25 - "openRouteModal"
Cohesion: 0.29
Nodes (7): openRouteModal(), selectStartStation(), 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 1) 버스 지도 2단계 (출발지 ➔ 도착지) 인터랙티브 루트 빌더 구현, 2) 다른 지도(식당, 카페, 약국, 병원) 집 ➔ 목적지 거리 & 경로선(Polyline) 시각화, 3) 모바일 화면 크기 및 브라우저 주소창에 따른 팝업창 하단 버튼 잘림 원천 해결, 2026-11-22 (v1.3.3) - 버스 2단계 출발-도착 루트 빌더 & 집-식당/약국 거리·경로선 표시 & 모바일 팝업 뷰포트 최적화

### Community 26 - "26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.47
Nodes (6): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 사례 16: 모바일 뷰포트 확대 차단(user-scalable=no) 결함 및 두 손가락 핀치 줌(Pinch-to-Zoom) 엔진·원클릭 리셋 구현

### Community 28 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.09
Nodes (31): init_db(), api_location_family(), get_family_locations(), add_favorite_place(), toggle_favorite_place(), autoDetectUserLocation(), buildRestaurantListHtml(), executeRestSearch() (+23 more)

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

### Community 33 - "25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `⏱️ 단계별 개발 타임라인` to `main.py`, `setTransitOrigin`, `📌 목차`, `request_child_ping`, `showToast`, `initSheetGestures`, `initPinchToZoomEngine`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05287556135013762 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)`, `25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6)`, `setTransitOrigin`, `8. v1.1.0 자동 업데이트 & 무장애 하이브리드 지도 고도화 (2026-11-21)`, `📌 목차`, `7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)`, `10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결`, `request_child_ping`, `3) 조치 및 해결 내역 (Remediation)`, `quickAddFavoritePlace`, `initSheetGestures`, `17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)`, `openRouteModal`, `26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)`, `⏱️ 단계별 개발 타임라인`, `20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)`, `28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)`, `19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `setTransitOrigin` be split into smaller, more focused modules?**
  _Cohesion score 0.13257575757575757 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `main.py` to `⏱️ 단계별 개발 타임라인`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._