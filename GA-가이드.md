# GA4 행동분석 — 작업내역 & 사용 가이드

서현일 포트폴리오(이력서·경력기술서·포트폴리오·덱)에 심은 행동분석 정리입니다.
**측정 ID:** `G-S2C9BC9JKH` · **공통 스크립트:** `assets/analytics.js` (모든 페이지 `</body>` 직전 로드)

---

## 1. 추적하는 이벤트 (무엇이·왜)

| 이벤트 이름 | 언제 발생 | 주요 파라미터 | 무엇을 알 수 있나 |
|---|---|---|---|
| `doc_view` | 문서 진입 | `doc_type`, `ref_tag` | 어떤 문서를·누가 보낸 링크로 열었나 |
| `dwell` | active 10s/30s/1m/2m/3m/5m 도달 | `seconds` | **실제로 읽은 시간**(idle 15초 제외) 분포 |
| `scroll_depth` | 25/50/75/90/100% 도달 | `percent` | **어디서 멈추는지** = 이탈 지점 |
| `section_view` | 각 섹션/케이스가 화면에 들어옴 | `section` | 어느 챕터까지 실제로 봤나 |
| `cta_click` | 링크·버튼·이미지·표지 클릭 | `click_kind`, `label` | 무엇을 눌렀나 (전체) |
| `intent_action` | PDF·이메일·갤러리·문서이동 클릭 | `click_kind`, `label` | **채용 의지가 강한 행동**만 추림 |
| `gallery_open` *(cta 안)* | 아카이브 표지 클릭 | `label` | 어떤 프로젝트를 깊게 봤나 |
| `slide_view` | 덱 슬라이드 전환 | `slide_index`, `slide_label` | 덱을 몇 번째까지 넘겼나 |
| `doc_exit` | 탭 닫기/이탈 | `max_scroll`, `active_seconds`, `key_actions`, **`engagement_score`**, **`engagement_tier`** | **떠날 때의 종합 관심도** |

### engagement_score (0~100) — 한눈에 관심도
- 스크롤 깊이(0~40) + active 체류(3분=40) + 의지행동(행동 3개=20)
- `engagement_tier`: **hot(70+) / warm(40~69) / cold(<40)**
- → "누가 끝까지·오래·행동까지 했나"를 한 숫자로

### ref_tag — 누구에게 보낸 링크인가
링크 뒤에 `?ref=라벨`을 붙여 보내면 모든 이벤트에 그 라벨이 붙습니다.
예: `https…/index.html?ref=toss` · `?ref=karrot_hr` · `?ref=linkedin_kim`
→ 채용처/사람별로 조회·관심도를 구분.

---

## 2. GA에서 어떻게 보나 (초보자용)

### A. 실시간 확인 (심은 직후)
**보고서 → 실시간** → 본인이 사이트를 열고 스크롤/클릭 → 이벤트가 뜨면 정상.

### B. 이벤트별 횟수
**보고서 → 참여도 → 이벤트** → `scroll_depth`, `intent_action`, `doc_exit` 등 발생 횟수.

### C. 이탈 지점 분석 (가장 중요)
**탐색(Explore) → 자유 형식**
- 행: `doc_type` (문서별)
- 열: `percent` (scroll_depth의 파라미터)
- 값: 이벤트 수
→ *"이력서는 75%까지 보는데 경력기술서는 50%에서 끊긴다"* 가 바로 보임 → 그 아래를 보강.

### D. 관심도 높은 방문 골라내기
**탐색 → 자유 형식**
- 행: `ref_tag`
- 값: `engagement_score` 평균 + `doc_exit` 수
→ 어떤 채용처가 hot 등급으로 봤는지.

> **맞춤 측정기준 등록(권장):** GA4 **관리 → 맞춤 정의 → 맞춤 측정기준 만들기** 에서
> `doc_type`, `ref_tag`, `engagement_tier`, `click_kind`, `section`, `slide_label` (범위: 이벤트),
> `engagement_score`, `percent`, `active_seconds`, `max_scroll` 는 **맞춤 측정항목**(범위: 이벤트, 단위: 표준)으로 등록해야
> 탐색 보고서에서 필드로 선택할 수 있습니다. (등록 후 데이터는 24~48h 뒤 채워짐)

---

## 3. 자주 묻는 것

- **큰 수정하면 이벤트 깨지나요?** — 아니요. 버튼마다 코드를 박지 않고 클릭을 페이지 전체에서 가로채(이벤트 위임) 라벨을 자동으로 읽습니다. 카피·배치를 바꿔도 그대로 동작합니다.
- **데이터가 안 보여요** — (1) GA 실시간에선 즉시, 표준 보고서엔 보통 24~48시간 뒤 반영. (2) 광고 차단기가 gtag를 막을 수 있음(본인 테스트 시 시크릿창/차단해제). (3) 맞춤 측정기준 미등록 시 탐색에서 필드가 안 보임 → 위 2-D 참고.
- **인쇄본(`*-print.html`)에도 붙었나요?** — 붙지 않았습니다(이건 PDF 저장용). 방문 분석은 일반 HTML(`index/portfolio/resume/career-statement/portfolio-deck.html`)에서만 수집됩니다.

---

*작성: 2026 · analytics.js v2 (engagement scoring 포함)*
