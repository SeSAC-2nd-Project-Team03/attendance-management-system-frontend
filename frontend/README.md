# 출석 관리 시스템 - 프론트엔드

React + Vite 기반의 출석 관리 시스템 프론트엔드입니다.

## 🚀 시작하기

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
- 프론트엔드: http://localhost:3000
- 백엔드가 http://localhost:9090 에서 실행중이어야 합니다.

### 3. 백엔드 실행 (별도 터미널)
```bash
cd ../attendance-management-system-main
./gradlew bootRun
```

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── api/          # API 호출 모듈
│   ├── components/   # 재사용 컴포넌트
│   ├── context/      # React Context
│   ├── pages/        # 페이지 컴포넌트
│   │   └── admin/    # 관리자 페이지
│   └── utils/        # 유틸리티 함수
├── index.html
├── package.json
└── vite.config.js
```

## 🔑 테스트 계정

| 역할 | 아이디 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin | admin123 |
| 학생 | student1 | 1234 |

## 📱 주요 기능

### 학생 기능
- ✅ 출석 체크 (인증번호 입력)
- 📅 내 출석 현황 조회
- 📝 휴가/조퇴 신청
- 📋 내 신청 내역 조회
- 📢 공지사항 확인

### 관리자 기능
- 👥 회원 관리 (CRUD)
- 📊 출석 관리 및 상태 변경
- 📢 공지사항 관리
- 📥 출석부 다운로드 (CSV/Excel)

## 🎨 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **React Icons** - 아이콘

## ⚙️ 프록시 설정

`vite.config.js`에서 백엔드 API 프록시가 설정되어 있습니다:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:9090',
      changeOrigin: true,
    }
  }
}
```

