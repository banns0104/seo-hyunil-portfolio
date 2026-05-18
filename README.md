# 서현일 포트폴리오 · 이력서 · 경력기술서

GitHub Pages에 그대로 올리면 끝나는 정적 사이트입니다.

## 🚀 가장 빠른 배포 (3분)

### Step 1 — zip 압축 풀기
다운받은 `hyunil-portfolio.zip` 더블클릭 → 폴더 안 내용 확인.

### Step 2 — GitHub 레포 만들기
1. https://github.com/new
2. **Repository name**: `banns0104.github.io` (본인 GitHub ID + `.github.io`)
3. **Public** 선택, **Add a README file** 체크 ✅
4. **Create repository**

### Step 3 — 파일 통째 업로드 (GitHub Desktop 추천)

#### A. GitHub Desktop (가장 편함, 명령어 ✕)
1. https://desktop.github.com/ 다운로드 → 설치 → 본인 계정 로그인
2. **File → Clone repository** → 방금 만든 레포 선택 → 다운로드
3. zip 푼 폴더 안의 **모든 파일 + 폴더**(`.nojekyll` 포함)를 다운된 레포 폴더에 복사
4. GitHub Desktop으로 돌아와 좌측 하단 Summary에 `init` 입력 → **Commit to main** → **Push origin**

#### B. 웹 업로드 (3번 나눠서)
1차 — 루트 파일들(`index.html`, `resume.html`, `career-statement.html`, `firebase-config.js`, `database.rules.json`, `README.md`, `portfolio.pdf`, `resume.pdf`, `.nojekyll`) 일괄 드래그
2차 — `assets` 폴더 안에서 `editor.js` 업로드 (`assets` 폴더 자동 생성)
3차 — `images` 폴더 안의 `af_*` 그룹과 `wm_*` 그룹을 두 번에 나눠 업로드 (한 번에 100개 제한)

### Step 4 — Firebase 설정 (편집 모드 사용 시)
- Firebase Console → Authentication → Google 활성화 + 승인 도메인에 `<USERNAME>.github.io` 추가
- Realtime Database 만들고 `database.rules.json` 내용 붙여넣기

### Step 5 — 끝
1~2분 후 `https://banns0104.github.io/` 접속.

---

## 📷 프로필 사진 추가

`profile.jpg` 파일을 루트에 저장. (자세한 가이드: `PROFILE-PHOTO-HERE.md`)

## 📎 사업계획서 PDF 추가

영문 파일명으로 `docs/` 폴더에 넣기. (자세한 가이드: `docs/README.md`)
- `docs/aboutfishing-startup-package-proposal.pdf`
- `docs/workmate-tips-proposal.pdf`

---

## 📂 파일 구조

```
hyunil-portfolio/
├── index.html              # 포트폴리오 메인
├── resume.html             # 이력서
├── career-statement.html   # 경력기술서 (NEW)
├── firebase-config.js
├── database.rules.json
├── portfolio.pdf
├── resume.pdf
├── README.md               # (이 파일)
├── PROFILE-PHOTO-HERE.md   # 사진 추가 가이드
├── .nojekyll               # GitHub Pages가 _ 파일 무시 안 하게
├── assets/
│   └── editor.js
├── docs/
│   └── README.md           # PDF 추가 가이드
└── images/
    ├── af_*/               # 어바웃피싱 실제 캡쳐 8개 도메인
    └── wm_*/               # 가다 노션 export
```

---

## 🌐 URL 구조

- `/` → 포트폴리오 (index.html) — 기본 진입
- `/resume.html` → 이력서
- `/career-statement.html` → 경력기술서 (Senior 채용용 상세 자료)

세 페이지 모두 상단에서 서로 이동 가능.

---

## ⚙️ 편집 모드 (선택)

Firebase 설정 후, 우측 하단 ✎ 아이콘 → Google 로그인(`banns0104@gmail.com`만 승인) → 인플레이스 편집 + 프로젝트 카드 CRUD.

자세한 절차는 README 후반부 또는 직전 README 버전 참고.
