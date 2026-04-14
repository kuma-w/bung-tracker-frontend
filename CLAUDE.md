# Bung Tracker — 프론트엔드

배드민턴 모임(벙) 참석자 등록 및 입금 현황을 확인하는 웹 앱.

## 기술 스택

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **API**: fetch (Vite dev proxy → localhost:3000)

## 실행

```bash
npm install
npm run dev      # 개발 서버 (localhost:5173)
npm run build    # 프로덕션 빌드
```

> 백엔드(`localhost:3000`)가 먼저 실행되어 있어야 합니다.

## 프로젝트 구조

```
front-end/
├── index.html
├── vite.config.js          # /events, /payments, /payment → localhost:3000 프록시
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx              # 라우팅 정의
    ├── index.css            # Tailwind 진입점
    ├── api.js               # API 클라이언트
    ├── components/
    │   ├── Layout.jsx       # 공통 헤더 + 로그아웃 모달
    │   └── AdminGuard.jsx   # 관리자 인증 가드
    └── pages/
        ├── EventsPage.jsx         # 일정 목록 (공개)
        ├── EventDetailPage.jsx    # 일정 상세 + 참석자 (공개)
        ├── AdminEventsPage.jsx    # 일정 생성·수정·삭제 (관리자)
        └── AdminPaymentsPage.jsx  # 입금 내역 + 수동 배정 (관리자)
```

## 라우팅

| 경로 | 컴포넌트 | 권한 |
|---|---|---|
| `/` | EventsPage | 공개 |
| `/events/:date` | EventDetailPage | 공개 |
| `/admin` | AdminEventsPage | 관리자 |
| `/admin/payments` | AdminPaymentsPage | 관리자 |

## 관리자 인증

- `AdminGuard`로 `/admin/*` 라우트 보호
- `/admin` 접근 시 관리자 키 없으면 로그인 화면 표시
- 키 입력 시 `GET /payments?limit=1` 실제 호출로 유효성 검증 (`res.ok`일 때만 통과)
- 인증 성공 시 `localStorage('adminKey')`에 저장 → 재방문 시 자동 인증
- 헤더 "관리자" 버튼 클릭 → 로그아웃 (localStorage 제거 + 새로고침)
- 모든 관리자 API 호출 시 `x-admin-key` 헤더 자동 첨부 (`api.js`)

## API 클라이언트 (`src/api.js`)

```js
api.getEvents()                        // GET /events
api.getEventDetail(date)               // GET /events/:date
api.createEvent(body)                  // POST /events
api.updateEvent(date, body)            // PATCH /events/:date
api.deleteEvent(date)                  // DELETE /events/:date
api.addAttendees(date, body)           // POST /events/:date/attendees
api.deleteAttendee(date, name)         // DELETE /events/:date/attendees/:name
api.getPayments(params)                // GET /payments
api.assignPayment(id, body)            // POST /payments/:id/assign
```

## 페이지별 기능

### EventsPage (일정 목록)
- 슬롯별 잔여 인원 게이지 바 표시
- 날짜가 지난 일정은 흐리게(opacity-60) + "종료" 뱃지 + 회색 게이지로 구분

### EventDetailPage (일정 상세)
- 슬롯별 참석자 이름 목록
- 관리자: 참석자 추가 폼 (슬롯 자동 배정 or 지정), 참석자 삭제 버튼

### AdminEventsPage (일정 관리)
- 새 일정 생성 폼 (날짜, 참가비, 타임슬롯 동적 추가/제거)
- 일정 목록 테이블 — **수정** / **삭제** 버튼
- 수정 모달: 참가비 변경, 슬롯 정원 변경, 슬롯 추가, 슬롯 삭제 (참석자 있는 슬롯 삭제 시 경고)

### AdminPaymentsPage (입금 내역)
- 상태 필터 탭 (전체 / 처리 중 / 배정 완료 / 일부 배정 / 실패)
- 수동 배정 모달: 이름·날짜 입력 → `POST /payments/:id/assign`

## Vite 개발 서버 프록시

```js
// vite.config.js
proxy: {
  '/events':   'http://localhost:3000',
  '/payments': 'http://localhost:3000',
  '/payment':  'http://localhost:3000',
}
```

CORS 없이 백엔드 API 직접 호출 가능. 프로덕션 배포 시 별도 프록시 설정 필요.

## 주요 트러블슈팅 이력

| 문제 | 원인 | 해결 |
|---|---|---|
| 아무 키나 입력해도 관리자 로그인 통과 | `res.status !== 403` 조건이 502 등 다른 오류도 통과시킴 | `res.ok` (2xx만 통과)로 변경 |
| 백엔드 연결 오류인데 "키가 틀렸습니다" 표시 | 502와 403을 구분 안 함 | status별 에러 메시지 분기 처리 |
| 올바른 키 입력해도 403 반환 | `.env`에 `ADMIN_KEY`가 두 번 선언되어 마지막 값(`your-secret-admin-key`)이 적용됨 | 중복 라인 제거 후 서버 재시작 |
| 재시작 후에도 403 | 월요일부터 실행 중이던 구버전 서버 프로세스가 살아 있었음 | 모든 `node server.js` 프로세스 종료 후 재시작 |
