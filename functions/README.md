## Cloud Functions

### deleteUserByAdmin

- Admin only function
- Deletes user from Firestore and Firebase Auth
- Deletes user's profile image from Firebase Storage

### 배포

```bash

# Firebase CLI 설치 (아직 안 했다면)
npm install -g firebase-tools
# Firebase CLI 로그인 (브라우저가 열리면 Google 계정으로 로그인합니다.)
firebase login

# Firebase 프로젝트 확인
# Firebase CLI가 설치되어 있다면, 아래 명령어로 프로젝트 목록을 확인할 수 있습니다.
firebase projects:list

# Firebase Active Project 변경
firebase use rootbridge-9b225

# Firebase 프로젝트 초기화
firebase init functions

cd functions
npm init
npm install firebase-admin firebase-functions
npm install --save-dev typescript @types/node

# tsconfig.json 생성 (TypeScript 컴파일 설정, include 설정, outDir 설정 등)
npx tsc --init

# functions/index.ts 생성
# functions/index.ts에 deleteUserByAdmin 함수 추가
# npm run build 통해 함수 컴파일 index.ts --> functions/lib/index.js 생성
npm run build

# firebase.json에 Functions 설정

# Functions 배포
# functions 디렉토리에서
cd functions
npm run deploy
# 또는 프로젝트 루트에서
firebase deploy --only functions
```
