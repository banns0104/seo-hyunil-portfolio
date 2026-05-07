# 서현일 포트폴리오 · GitHub Pages

Hyunil Seo Portfolio + Resume — GitHub Pages 정적 호스팅 + Firebase Realtime Database/Auth 기반 인플레이스 편집기.

## 파일 구성

```
포트폴리오/
├─ index.html              # 포트폴리오 메인 (편집 가능)
├─ resume.html             # 이력서 (편집 가능)
├─ assets/
│  └─ editor.js            # Firebase Auth + RTDB + 편집기 + GA 통합 스크립트
├─ firebase-config.js      # ⚠️ 본인 Firebase 값으로 채워서 사용
├─ database.rules.json     # Firebase RTDB 보안 규칙
├─ resume.pdf              # 이력서 PDF
├─ portfolio.pdf           # 포트폴리오 PDF
└─ README.md               # (이 파일)
```

---

## 1. Firebase 프로젝트 셋업

### 1-1. 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속 → **프로젝트 추가**
2. 프로젝트 이름: 예) `hyunil-portfolio`
3. Google Analytics: **사용 설정**(권장) → 새 GA 계정 또는 기존 계정 선택

### 1-2. 웹 앱 등록

1. Firebase Console → 프로젝트 개요 → 웹 아이콘(`</>`) 클릭
2. 앱 별명: `portfolio-web`
3. **Firebase Hosting은 체크하지 않음** (GitHub Pages 사용)
4. 등록 후 표시되는 `firebaseConfig` 객체의 값을 `firebase-config.js`에 그대로 넣어주세요.

```js
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",                    // 콘솔에서 복사
  authDomain: "hyunil-portfolio.firebaseapp.com",
  databaseURL: "https://hyunil-portfolio-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hyunil-portfolio",
  storageBucket: "hyunil-portfolio.appspot.com",
  messagingSenderId: "...",
  appId: "1:...:web:...",
  measurementId: "G-XXXXXXXXXX"          // GA가 자동 생성됨
};
```

### 1-3. Authentication (Google 로그인)

1. Firebase Console → **빌드 → Authentication → 시작하기**
2. **Sign-in method 탭 → Google** 활성화
3. 프로젝트 지원 이메일: `banns0104@gmail.com`
4. **승인된 도메인**에 GitHub Pages 주소 추가
   - `<USERNAME>.github.io`
   - 예: `banns0104.github.io`
5. (선택) 커스텀 도메인 사용 시 해당 도메인도 추가

### 1-4. Realtime Database

1. Firebase Console → **빌드 → Realtime Database → 데이터베이스 만들기**
2. 위치: `asia-southeast1` (싱가포르) 권장 — 한국에서 가장 빠름
3. **잠금 모드로 시작** 선택 (어차피 규칙으로 덮어씁니다)
4. 만들어진 후 **규칙(Rules) 탭**에 `database.rules.json` 내용 붙여넣고 **게시**

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "portfolio": {
      ".write": "auth != null && auth.token.email == 'banns0104@gmail.com' && auth.token.email_verified == true"
    },
    "resume": {
      ".write": "auth != null && auth.token.email == 'banns0104@gmail.com' && auth.token.email_verified == true"
    },
    "meta": {
      ".write": "auth != null && auth.token.email == 'banns0104@gmail.com' && auth.token.email_verified == true"
    }
  }
}
```

> 의미
> - 누구나 읽기는 가능 (방문자에게 콘텐츠 노출)
> - 쓰기는 `banns0104@gmail.com` 본인이 Google 로그인했을 때만 가능
> - `email_verified == true` 조건 덕분에 가짜 토큰으로는 쓸 수 없음

### 1-5. Google Analytics 측정 ID

`firebase-config.js` 의 `measurementId` 와 `GA_MEASUREMENT_ID` 두 곳에 같은 값(`G-XXXXXXXXXX`)을 넣어주세요.
값이 없거나 `G-REPLACE__GA_ID` 그대로면 GA는 비활성화 됩니다.

---

## 2. GitHub Pages 배포

### 2-1. 레포 만들기

```bash
# 새 레포 만들고 (예: hyunil-portfolio)
cd /Users/hyunilseo/Documents/Claude/Projects/포트폴리오
git init
git add .
git commit -m "init: portfolio + resume + firebase editor"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

### 2-2. Pages 설정

1. GitHub 레포 → **Settings → Pages**
2. **Source** : `Deploy from a branch`
3. **Branch** : `main` / `/ (root)` → **Save**
4. 1~2분 후 `https://<USERNAME>.github.io/<REPO>/` 에서 접속 가능

### 2-3. firebase-config.js 가 .gitignore에 들어있지 않은지 확인

이 파일은 클라이언트에 노출되어도 보안 규칙이 있어 안전합니다. 그대로 커밋하세요.

---

## 3. 편집기 사용법

1. 배포된 사이트 진입
2. 우측 하단 **연필 아이콘** 클릭 → Google 로그인 팝업
3. `banns0104@gmail.com` 으로 로그인
4. 편집 모드 활성화 — 다음이 가능합니다:
   - **인라인 텍스트 편집** : 제목·본문 클릭 → 직접 입력 → ESC/blur 시 저장
   - **프로젝트 카드 추가** : 회사 블록 우측 하단 `+ 새 프로젝트` 버튼
   - **프로젝트 편집** : 카드 우상단 `✎` 클릭 → 모달
   - **프로젝트 삭제** : 카드 우상단 `🗑` 클릭 → 확인
   - **이미지 갤러리** : 프로젝트 모달 안에서 URL 추가 / 파일 업로드(base64로 RTDB 저장, 권장 1MB 이하)
5. 편집 후 우측 하단 **로그아웃** 버튼

권한 없는 계정으로 로그인하면 즉시 로그아웃 처리됩니다.

---

## 4. 데이터 모델 (RTDB)

```
portfolio/
  hero/{eyebrow, title1, title2, lead, meta1, meta2, meta3}
  stats/{statId}/{value, unit, label, order}
  companies/{companyKey}/{name, role, period, badge, summary, tags[], logoText, logoBg, order}
  projects/{projectId}/{
    companyKey, emoji, tag,            // tag: NEW|RENEWAL|COLLAB|OPS|SYSTEM
    title, summary,
    why,                               // 왜 이 기획을 잡았나
    kpi[],                             // 달성 KPI 항목 배열
    details[],                         // 핵심 기여 항목 배열
    metaLeft, metaRight, resources,
    images[],                          // URL 또는 base64 dataURL
    order
  }
  approach/{cardId}/{title, body, order}
  skills/{cardId}/{title, pills[], order}
  press/{itemId}/{when, what, link, body, order}

resume/
  hero/{name, subtitle, tags[], email, phone}
  summary
  highlights/{id}/{value, unit, label, order}
  experiences/{expId}/{period, duration, company, role, blocks[], order}
  skills/{cardId}/{title, pills[], order}
  education/{eduId}/{period, school, major, order}
  philosophy/{id}/{text, order}
  press/{id}/{title, body, link, order}

meta/
  lastEditedAt, lastEditedBy
```

---

## 5. PDF 재생성

서버에서 직접 PDF 다시 빌드하려면 Python + WeasyPrint + NanumGothic이 필요합니다.
간단한 방법은 브라우저에서 **`Cmd+P` → PDF로 저장**.
이력서 페이지의 우측 상단 `PDF 다운로드 / 인쇄` 버튼이 print 다이얼로그를 띄웁니다.

---

## 6. 자주 쓰는 RTDB 백업

데이터를 통째로 내려받아 백업:

```bash
# Firebase CLI 설치 후
firebase login
firebase database:get / --project <projectId> > backup-$(date +%Y%m%d).json
```

---

## 7. 보안 체크리스트

- [x] RTDB 규칙: 쓰기 권한 단일 이메일로 제한
- [x] Authentication: Google Sign-in만 허용
- [x] 편집기: 비인가 이메일 로그인 시 즉시 signOut
- [x] PDF / HTML: 편집기 UI는 print 시 자동 숨김
- [x] firebase-config 노출: 보안 규칙으로 보호되므로 안전
- [ ] (선택) App Check 활성화 시 더 엄격한 봇/스크래핑 차단 가능

— 끝 —
