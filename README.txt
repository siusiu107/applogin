# SIU 코드 로그인 샘플 (Vercel + Firebase Auth)

이 프로젝트는 Appilix/WebView 앱에서 사용할 수 있는
"코드 입력 + 외부 브라우저 구글 로그인" 방식 로그인 샘플입니다.

## 폴더 구조

- package.json
- .env.example
- api/
  - _firebaseAdmin.js
  - login-start.js
  - login-status.js
  - login-complete.js
- login.html   ← 브라우저(크롬)에서 여는 로그인 페이지

## 1. Vercel 환경변수 설정

Vercel 대시보드 → Project Settings → Environment Variables 에 아래를 추가합니다.

- `FIREBASE_SERVICE_ACCOUNT`
  - Firebase 서비스 계정 JSON 전체를 한 줄 문자열로 넣습니다.
  - 예시는 `.env.example` 참고.
- `FIREBASE_DATABASE_URL`
  - 예: `https://your-project-id-default-rtdb.asia-southeast1.firebasedatabase.app`

저장 후, **재배포(Deploy)** 해 주세요.

## 2. Firebase 설정

- Firebase 콘솔 → Authentication → Sign-in method 에서
  구글 로그인을 활성화합니다.
- Firebase 콘솔 → 프로젝트 설정 → 일반 → 웹앱 설정에서
  `apiKey`, `authDomain`, `projectId` 등을 확인합니다.
- `login.html` 맨 아래의 `firebaseConfig` 객체를
  실제 프로젝트 값으로 교체합니다.

## 3. 사용 플로우 (요약)

1. Appilix 안 WebView(게임 페이지)에서 `/api/login-start` 를 POST 로 호출하여 코드(예: AB4F92)를 발급 받습니다.
2. 앱 화면에 그 코드를 보여주고,
   플레이어에게 `https://YOUR_DOMAIN/login.html` 로 접속하라고 안내합니다.
3. 플레이어는 브라우저에서 `login.html` 을 열고, 코드를 입력한 뒤 구글 로그인 버튼을 누릅니다.
4. 브라우저 페이지는 Firebase Auth 로 구글 로그인 후 `idToken` 을 얻어
   `/api/login-complete` 에 `{ code, idToken }` 을 보냅니다.
5. 서버는 `idToken` 을 검증하고, 해당 코드를 `status: 'done'` + `customToken` 으로 업데이트합니다.
6. Appilix WebView 쪽에서는 3초마다 `/api/login-status?code=...` 를 폴링하다가
   `status: 'done'` 과 함께 내려오는 `customToken` 으로
   `firebase.auth().signInWithCustomToken(customToken)` 을 호출해 최종 로그인합니다.
