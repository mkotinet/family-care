# Graph Report - family-care  (2026-11-23)

## Corpus Check
- 26 files · ~70,014 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .example 1, .db-shm 1)

## Summary
- 590 nodes · 1497 edges · 40 communities (36 shown, 4 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 267 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1467dec9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.py
- 🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서
- write_audit_log
- setTransitOrigin
- autoDetectUserLocation
- loadFavorites
- get_db_connection
- app.js
- family-care
- manifest.json
- submitFamilyLogin
- openSafetyModal
- api_route
- delete_favorite_restaurant
- showToastNotice
- loadChatMessages
- [사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]
- checkBusArrivalAlerts
- ⏱️ 단계별 개발 타임라인
- 🌿 우리가족챙기기 (Family Care)
- showToast
- sw.js
- auth.py
- initSheetGestures
- set_cached_data
- send_message
- 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편
- initPinchToZoomEngine
- 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)
- 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결
- touch_user_heartbeat
- 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)
- 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)
- 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)
- 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)
- 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)
- 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)
- update_user_location
- 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5)
- add_security_headers

## God Nodes (most connected - your core abstractions)
1. `📅 프로젝트 기본 정보` - 44 edges
2. `get_db_connection()` - 35 edges
3. `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` - 33 edges
4. `showToast()` - 28 edges
5. `📌 목차` - 25 edges
6. `loadFavorites()` - 23 edges
7. `async_http_get_json()` - 23 edges
8. `set_cached_data()` - 22 edges
9. `reverse_geocode()` - 20 edges
10. `focusSinglePlaceOnMap()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `3) 해결 조치 (Remediation)` --references--> `get_transit_routes()`  [INFERRED]
  기술레포트.md → backend/services/transit.py
- `4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화` --references--> `autoDetectUserLocation()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `19. 초기 화면 위치 고정 및 타 지역 교통·병원·약국·식당 평내 고착 해결 (`v1.8.0`)` --references--> `autoDetectUserLocation()`  [INFERRED]
  트러블슈팅.md → frontend/static/app.js
- `8.1 하루퀴즈 포맷 자동 버전 감지 및 업데이트 소식창 엔진` --references--> `checkAppVersionUpdate()`  [INFERRED]
  기술레포트.md → frontend/static/app.js
- `5) 버그 5: 메인 즐겨찾기 목록에서 식당의 수정(✏️) 및 삭제(🗑️) 미표시 문제` --references--> `loadFavorites()`  [INFERRED]
  기술레포트.md → frontend/static/app.js

## Import Cycles
- None detected.

## Communities (40 total, 4 thin omitted)

### Community 0 - "main.py"
Cohesion: 0.11
Nodes (18): api_admin_audit_logs(), api_auth_family(), api_chat_messages(), api_chat_rooms(), api_culture(), api_health(), api_location_reverse_geocode(), api_places_favorites() (+10 more)

### Community 1 - "🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서"
Cohesion: 0.15
Nodes (12): 1. 개요 및 프로젝트 목표, 2. 시스템 아키텍처 및 핵심 설계 패턴, 30.1 구현 개요 및 주요 배경, 30. 가족 채팅 실시간 위치 공유 핀 원클릭 대화형 지도 뷰어 탑재 (v1.5.0), 31. Phase 1 종합 코드 감사 핵심 안정성·정확성 핫픽스 (v1.5.1), 32. Phase 2 엔터프라이즈급 보안·인증·RBAC·XSS 방어 & 감사 로깅 하드닝 (v1.6.0), 33. Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱 & 코어 모듈화 고도화 (v1.7.0), 35. 결론 및 종합 검증 결과 (+4 more)

### Community 2 - "write_audit_log"
Cohesion: 0.20
Nodes (14): write_audit_log(), api_auth_login(), api_auth_logout(), api_chat_send(), api_location_manual_set(), api_location_request_ping(), api_location_test_simulate(), api_places_favorite_add() (+6 more)

### Community 3 - "setTransitOrigin"
Cohesion: 0.10
Nodes (51): calcDistanceKm(), clearCategoryMarkers(), clearCategoryRouteLine(), clearTransitRouteLine(), drawRouteFromHome(), dropCustomTransitPin(), filterHospitalList(), findNearestBusStop() (+43 more)

### Community 4 - "autoDetectUserLocation"
Cohesion: 0.21
Nodes (14): autoDetectUserLocation(), checkChildSafetySummary(), closeManualLocationModal(), initApp(), loadWeather(), refreshData(), refreshMyLocation(), reloadOpenCategorySheet() (+6 more)

### Community 5 - "loadFavorites"
Cohesion: 0.14
Nodes (24): closeEditFavoriteModal(), closeSelectedPlaceCard(), focusFavoritePlaceById(), focusFavoriteRestaurantById(), focusFavoriteTransitRouteById(), isHospitalCategory(), isRestaurantCategory(), isTransitCategory() (+16 more)

### Community 6 - "get_db_connection"
Cohesion: 0.07
Nodes (55): calculate_distance_km(), haversine_distance(), wgs84_to_kma_grid(), delete_cached_data(), get_audit_logs(), get_cached_data(), get_db_connection(), set_cached_data() (+47 more)

### Community 7 - "app.js"
Cohesion: 0.06
Nodes (30): AppState, buildRestaurantListHtml(), checkPwaDisplayMode(), checkWhatsNewPopup(), closeRouteModal(), dismissPwaBanner(), executeHospitalSearch(), getOriginShortName() (+22 more)

### Community 8 - "family-care"
Cohesion: 0.10
Nodes (20): context, dockerfile, build, container_name, name, environment, healthcheck, image (+12 more)

### Community 9 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, display_override, icons, id, name (+5 more)

### Community 10 - "submitFamilyLogin"
Cohesion: 0.18
Nodes (14): checkAppVersionUpdate(), closeLoginModal(), isServerVersionNewer(), loadStoredSession(), logoutFamily(), sendUserHeartbeat(), setupMobileLifecycle(), startChildLocationTracker() (+6 more)

### Community 11 - "openSafetyModal"
Cohesion: 0.33
Nodes (7): closeSafetyModal(), fetchFamilyLocations(), openSafetyModal(), requestChildLocationRefresh(), simulateChildLocation(), startSafetyPolling(), stopSafetyPolling()

### Community 12 - "api_route"
Cohesion: 0.33
Nodes (3): serve_favicon(), serve_manifest(), serve_sw()

### Community 13 - "delete_favorite_restaurant"
Cohesion: 0.29
Nodes (6): api_places_favorite_update(), api_restaurant_update(), api_transit_update(), delete_favorite_restaurant(), update_favorite_restaurant(), 사례 5: 인라인 JSON 이스케이프 구문 오류 및 식당 CRUD 부재 결함

### Community 14 - "showToastNotice"
Cohesion: 0.22
Nodes (9): applyUserTextSizePreference(), closeKakaoKeyModal(), closeWhatsNewModal(), dismissWhatsNewForever(), saveKakaoJsKey(), sendChildLocationPing(), setTextSizeMode(), showToastNotice() (+1 more)

### Community 15 - "loadChatMessages"
Cohesion: 0.14
Nodes (14): getKakaoJsKey(), handleChatKeyDown(), loadChatMessages(), loadKakaoSdk(), openChatDrawer(), openChatMessageLocationMap(), openChatMessageLocationMapById(), openKakaoKeyModal() (+6 more)

### Community 16 - "[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]"
Cohesion: 0.11
Nodes (27): api_auth_me(), _extract_bearer_token(), optional_auth(), require_admin(), require_auth(), require_parent(), get_user_by_token(), _is_open_between() (+19 more)

### Community 17 - "checkBusArrivalAlerts"
Cohesion: 0.22
Nodes (9): checkBusArrivalAlerts(), closeBusAlarmModal(), initBusAlertSystem(), playBusAlertChime(), saveBusAlarmSetting(), triggerBusArrivalNotification(), 12. v1.3.4 고도화: 버스 지도 자동 정류장명 연동, 구간 전체 버스 시간표 및 도착 10분/5분/3분 알림 시스템, 2) 즐겨찾기 구간별 운행 버스 전체 실시간 시간표 (타임테이블) (+1 more)

### Community 18 - "⏱️ 단계별 개발 타임라인"
Cohesion: 0.10
Nodes (22): openEditPlaceModal(), openEditPlaceModalById(), openEditTransitModal(), openEditTransitModalById(), openRouteModal(), selectStartStation(), 11. v1.3.3 고도화: 버스 2단계 출발-도착 루트 빌더, 집-목적지 경로선·거리 연동, 모바일 팝업 뷰포트 최적화, 14. 화면 터치 및 메뉴 동작 무반응 긴급 결함 RCA 및 핫픽스 (v1.3.6) (+14 more)

### Community 19 - "🌿 우리가족챙기기 (Family Care)"
Cohesion: 0.33
Nodes (5): 🐳 Docker & Synology Portainer 배포, 🎨 UX/UI 디자인 컨셉, 🚀 빠른 시작 (Local Test), 🌿 우리가족챙기기 (Family Care), 🌟 주요 핵심 기능 (6대 위젯)

### Community 20 - "showToast"
Cohesion: 0.15
Nodes (18): deleteFavoritePlace(), deleteFavoriteRestaurant(), deleteTransitRoute(), executeRestSearch(), quickRestSearch(), renderCultureDetail(), showToast(), switchCultureScope() (+10 more)

### Community 22 - "auth.py"
Cohesion: 0.13
Nodes (19): async_http_post_json(), authenticate_user(), _check_rate_limit(), _clear_login_failures(), generate_token(), hash_password(), _record_login_failure(), verify_with_haru_quiz() (+11 more)

### Community 23 - "initSheetGestures"
Cohesion: 0.38
Nodes (8): closeCategoryDetail(), collapseSheet(), expandSheet(), initSheetGestures(), onTouchEnd(), toggleSheetExpand(), 3) 해결 조치 (Remediation), 사례 15: 바텀 시트 하프/풀스크린 스와이프 제스처 인터랙션 부재 및 부모님(엄마/아빠) 가독성 큰 글씨 모드 구현

### Community 24 - "set_cached_data"
Cohesion: 0.20
Nodes (15): init_db(), api_location_family(), get_family_locations(), initKakaoSafetyMap(), initLeafletSafetyMap(), initSafetyKakaoMap(), updateMapEngineBadge(), 1) 개요 및 사용자 요구사항 (+7 more)

### Community 25 - "send_message"
Cohesion: 0.53
Nodes (5): serve_index(), send_message(), request_child_ping(), 31.1 감사 배경 및 주요 조치 내역, [사례 21: Phase 1 종합 코드 감사 핫픽스 — 60초 무한 리로드 루프, 위치요청 톡 인자 뒤틀림, 450m 구좌표 Env 잔존, 기상청 +10분 경계 및 백엔드 크래시 일괄 해결 (v1.5.1)]

### Community 26 - "13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편"
Cohesion: 0.40
Nodes (5): 13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편, 1) 목록 선택 시 단일 핀 강조 포커스 & 우리 집(내 위치) 마커 연동, 3) 축제 나들이 카드 내 위치(경기/수도권) 한정 & 전국 확대, 4) 앱 실행 시 내 위치 자동 감지 및 날씨/지역 자동 동기화, 5) 식당 검색 엔진 고도화

### Community 27 - "initPinchToZoomEngine"
Cohesion: 0.27
Nodes (10): applyPageZoom(), getTouchDistance(), initPinchToZoomEngine(), resetPageZoom(), updateZoomIndicator(), 1) 개요 및 사용자 요구사항, 25. 두 손가락 핀치 줌(Pinch-to-Zoom) 화면 확대 및 원클릭 리셋 엔진 패치 (v1.4.6), 2) 근본 원인 분석 (RCA) (+2 more)

### Community 28 - "7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)"
Cohesion: 0.33
Nodes (6): 7.1 하루퀴즈 회원 DB 연동 및 4인 가족 계정 체계, 7.2 날씨 카드 3단 타임라인 뷰 (`hourly` / `three_hourly` / `weekly`), 7.3 카카오맵 인터랙티브 지도 뷰 & 교통 출발/도착 선택, 7.4 자녀 실시간 GPS 안심 위치 추적 시스템 (`/api/location/*`), 7.5 가족 전용 실시간 채팅방 (`/api/chat/*`), 7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)

### Community 29 - "10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결"
Cohesion: 0.40
Nodes (5): 10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결, 1) 카카오 디벨로퍼스 2024~2026 신규 UI 도메인 등록 완결, 2) 약국/식당 목록-지도 핀 원터치 연동 및 즐겨찾기 점검, 3) 버스 지도 직접 핀 꽂기 & 나만의 버스 루트 생성, 4) 모바일 브라우저별 PWA 및 실시간 알림 가이드 완비

### Community 31 - "17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)"
Cohesion: 0.50
Nodes (4): 17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 32 - "26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)"
Cohesion: 0.50
Nodes (4): 1) 개요 및 사용자 요구사항, 26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7), 2) 근본 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 33 - "20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)"
Cohesion: 0.50
Nodes (4): 1) 결함 현상 (Symptom), 20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2), 2) 근본 원인 분석 (RCA - Root Cause Analysis), 3) 해결 조치 (Remediation)

### Community 34 - "28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)"
Cohesion: 0.50
Nodes (4): 1) 기술적 배경 및 개요, 28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8), 2) 결함 원인 분석 (RCA), 3) 해결 조치 (Remediation)

### Community 35 - "19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)"
Cohesion: 0.67
Nodes (3): 19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1), 1) 결함 현상 (Symptom), 2) 근본 원인 분석 (RCA - Root Cause Analysis)

### Community 36 - "6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)"
Cohesion: 0.67
Nodes (3): 6.1 연동된 6대 실시간 공공 API 명세 및 검증, 6.2 보안 및 무중단 배포 검증, 6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)

### Community 38 - "24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5)"
Cohesion: 0.67
Nodes (3): 1) 개요 및 사용자 요구사항, 24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5), 2) 근본 원인 분석 (RCA)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `📅 프로젝트 기본 정보` connect `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]` to `setTransitOrigin`, `autoDetectUserLocation`, `loadFavorites`, `get_db_connection`, `app.js`, `checkBusArrivalAlerts`, `⏱️ 단계별 개발 타임라인`, `showToast`, `initSheetGestures`, `set_cached_data`, `send_message`, `initPinchToZoomEngine`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `📅 프로젝트 기본 정보` (e.g. with `delete_cached_data()` and `init_db()`) actually correct?**
  _`📅 프로젝트 기본 정보` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Should `main.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Why does `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` connect `🌿 [기술레포트] 우리가족챙기기 (Family Care) 시스템 아키텍처 및 구현 검증 보고서` to `setTransitOrigin`, `loadFavorites`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`, `checkBusArrivalAlerts`, `⏱️ 단계별 개발 타임라인`, `showToast`, `auth.py`, `set_cached_data`, `13. v1.3.5 고도화: 단일 핀 포커스, 즐겨찾기 수정/삭제, 축제 내주변 한정, 앱 시작시 자동 위치/날씨 동기화 및 식당 검색 엔진 개편`, `initPinchToZoomEngine`, `7. 가족 통합 플랫폼 대규모 고도화 완료 (3단계)`, `10. v1.3.2 고도화 & 카카오 개발자 콘솔 개편 UI 도메인 정식 등록 완결`, `17. 카카오버스 정답 일치 및 버스 운행 방향(호평동 vs 서울) 양방향 완비 (v1.3.9)`, `26. 기상청 '날씨알리미' 동네 실시간 기온 100% 동기화 및 과거 기온 고착 버그 해결 (v1.4.7)`, `20. 우리 집(평내마젤란21) 실측 정밀 좌표 재설정 및 카카오버스 정류소 100% 완벽 동기화 (v1.4.2)`, `28. 버스 즐겨찾기 양방향 정보 & 이마트 평내행 정류소 선택 지원 및 로그인 3635 삭제·자녀 백그라운드 상주 세션 고도화 (v1.4.8)`, `19. 즐겨찾기 순서 재정렬 및 단일 핀 포커스·지도 뷰포트 쾌적화 고도화 (v1.4.1)`, `6. 공공데이터포털 및 카카오 정식 API 실시간 라이브 연동 완료 (2단계)`, `24. 바텀 시트 위로 올려 전체화면 제스처 & 부모님(엄마/아빠) 큰 글씨 가독성 모드 패치 (v1.4.5)`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `showToast()` (e.g. with `3) 버그 3: 식당 및 약국 검색이 안 되는 문제 ("검색 통신 중 오류가 발생했습니다")` and `6) 버그 6: 즐겨찾기 삭제 중 "삭제 중 오류가 발생했습니다" 팝업 결함`) actually correct?**
  _`showToast()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `setTransitOrigin` be split into smaller, more focused modules?**
  _Cohesion score 0.1003921568627451 - nodes in this community are weakly interconnected._
- **Why does `set_cached_data()` connect `get_db_connection` to `set_cached_data`, `[사례 23: Phase 3 성능·비동기 병렬화·PWA 오프라인 캐싱·Request Storm 차단 & 코어 모듈화 (v1.7.0)]`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._