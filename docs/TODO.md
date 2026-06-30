# kordle — TODO / 진행 체크리스트

> 제품 요구는 [PRD.md](./PRD.md), DB 설계는 [ERD.md](./ERD.md). 결정(D#)은 PRD §결정사항 참조.

---

## ✅ 완료 (혼자 연습 게임 + 인증)

- [x] 자모 분해/조합 유틸 (`lib/hangul`, `jamo-mapping`) + 테스트 (D8)
- [x] 2-pass 채점 (`lib/grade`) + 자판 색상 누적 + 테스트 (D6/D12)
- [x] 단어 사전: KLUE vocab → 자모 개수별 분리 → **5자모 정답/입력 풀** (명사∩빈도 정제)
- [x] 게임 보드/자모 자판(두벌식)/상태머신/타이머
- [x] 무효 단어 토스트 + 행 흔들림
- [x] 정답 시 좌→우 순차 공개 + confetti
- [x] 다크 테마 UI (보드 회색 / 자판 검정 투톤), 버튼 햅틱
- [x] 결과 공유: OS 공유 시트(`navigator.share`) + 현재 링크 포함, 데스크톱 복사 폴백
- [x] localStorage 진행 게임 resume (정답/진행상태)
- [x] lib 단위 테스트 47개 (hangul/grade/game/words/storage/share/format/haptics)
- [x] Vercel 배포 (kordle-psi.vercel.app)
- [x] **카카오 로그인 + Supabase Auth** (`@supabase/ssr`, 미들웨어, `/auth/callback`, AuthButton)
  - [x] 카카오 비즈 앱 전환 + 동의항목(닉네임 필수/프로필사진 선택)
  - [x] Supabase Kakao provider + Redirect URLs + Site URL
  - [x] 로그인 동작 검증 (auth.users에 유저 생성 확인)

---

## ⬜ 진행 예정 — 같이 풀기 (방) 도입

### 인증 코드 정리
- [ ] 현재 인증 코드 커밋·PR·머지 (아직 미커밋, `.env.local` 제외)
- [ ] Vercel 환경변수 등록 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 랜딩/라우팅 재편
- [ ] 랜딩(`/`) — 큰 버튼 2개: `혼자 연습` / `같이 풀기`
- [ ] `혼자 연습` → `/play` (기존 Game 이동, 로그인 불필요)
- [ ] `같이 풀기` → 로그인 필수: 미로그인 시 **카카오 로그인 모달**
- [ ] 로그인 상태에서만 `/rooms` 접근 (미로그인 리다이렉트/모달)

### DB (ERD.md 참조)
- [ ] `supabase/migrations/0001_rooms.sql`: `profiles` + `rooms` + `room_members` + RLS
- [ ] RLS 무한 재귀 회피 (`security definer` 헬퍼)
- [ ] 프로필 자동 생성 (auth.users → profiles upsert: trigger 또는 콜백)
- [ ] `create_room()` RPC (방 생성 원자성)

### 방 목록/생성 UI
- [ ] `/rooms` — 내가 참여중인 방 목록 (방 이름·멤버 수)
- [ ] 우상단 **방 생성** 버튼 → 방 생성 + 자동 참여(host)
- [ ] `lib/rooms.ts` — 방 R/W

---

## ⬜ 나중 (미정 — 결정 후)

- [ ] **방 안에서 뭘 하나** (D15 — 가장 큰 미정: 같은 단어 각자/동시 대결/턴제/리더보드)
- [ ] 방 참여 방법 (D14 — 초대 코드/링크 등)
- [ ] 방 인원 제한, 방 설정(난이도/자모 수), 나가기/삭제
- [ ] 클라우드 통계 (`plays` 테이블 + `/stats` + 리더보드, localStorage→DB 마이그레이션)
- [ ] 다듬기: 타일 뒤집기 애니메이션, og:image(공유 미리보기), 효과음
- [ ] iOS 웹 햅틱 (switch 트릭 — iOS 26.5 패치로 불안정, 보류)

---

## 미결정 사항 (논의 필요)

- **D13. 방 모델**: 지속형 그룹 vs 1회성 세션 → 플로우상 **지속형**으로 가정 (확정 대기)
- **D14. 참여 방법**: 초대 코드 기본? (소규모 친구 → 코드/링크 공유 자연스러움)
- **D15. 방 플레이 규칙**: 같이 풀기의 실제 게임 방식 — **별도 논의 필요** (대기 중)
