# kordle — Product Requirements Document

> 프로젝트명: **kordle** (Korean + Wordle)
> Repo: https://github.com/thomas783/kordle
> 작성일: 2026-04-26
> 작성자: haryong.song@kozha-brand.page
> 상태: **v1 Locked (2026-06-29)** — 스펙 확정, 구현 대기

> 📌 **개정 이력 (2026-06-29)**: v1 범위를 **로컬 only**로 축소. 카카오 OAuth·Supabase·리더보드는 v1.1로 이동.
> 자모 분해 ㅐ/ㅔ 계열 확정, 사전을 정답/입력 2단계로 분리(KLUE vocab 기반), 타이머·자판 색상 누적 추가.

---

## 1. 배경 (Why)

카카오톡 미니게임 "단어 맞히기"는 하루 한 판 제한이라 갈증이 남음. 친구들과 무제한으로 즐길 수 있고, 개인 통계가 쌓이는 한글 Wordle 웹앱을 만든다.

### 1.1 목표 사용자

- 본인 + 가까운 친구 (10명 이내 소규모, 비공개 공유)
- 모바일/데스크톱 브라우저 모두 사용

### 1.2 비목표 (Out of Scope, v1)

- 소셜 로그인 (카카오 OAuth) — **v1.1로 이동**
- 클라우드 통계 / 친구 리더보드 (Supabase) — **v1.1로 이동**
- Daily 모드 (모두가 같은 단어를 푸는 모드)
- 멀티플레이/대전 모드
- 카카오톡 챗봇 연동
- 광고/수익화

> ✅ **v1 = 로컬 only.** 통계는 localStorage에 저장하고, 인증·클라우드 동기화·리더보드는 v1.1로 미룬다.
> 단, 스택은 Next.js를 유지하고 저장 필드를 v1.1 스키마와 동일하게 맞춰, DB 연동을 매끄럽게 한다.

---

## 2. 핵심 기능 (What)

### 2.1 게임 플레이 (MVP)

- **5자모(jamo) 단어**를 맞히는 게임
  - "5자리"는 음절이 아니라 **자모로 분해했을 때 5칸**을 의미
  - 예: `꽉` → `ㄱ ㄱ ㅗ ㅏ ㄱ` (5자모, 1음절)
  - 예: `사과` → `ㅅ ㅏ ㄱ ㅗ ㅏ` (5자모, 2음절)
- 시도 횟수: **5번** (확정)
- 입력 방식: **전용 화면 자판만** 사용 (물리 키보드/IME 미사용)
  - 키보드에는 **단일 자모만 노출** (쌍자음/복모음/겹받침 키 없음)
  - 자음 14개: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
  - 모음 10개: ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ
  - 기능 키: ⌫ (지우기), ⏎ (제출)
- 자모 분해 규칙 (사용자 정의 — 표준 한글 분해보다 한 단계 더 분해, **최종적으로 키보드 24자모로만 환원**):
  | 표준 자모 | 게임 분해 |
  |---|---|
  | ㄲ ㄸ ㅃ ㅆ ㅉ | ㄱㄱ / ㄷㄷ / ㅂㅂ / ㅅㅅ / ㅈㅈ |
  | ㅐ ㅒ ㅔ ㅖ ㅢ | ㅏㅣ / ㅑㅣ / ㅓㅣ / ㅕㅣ / ㅡㅣ |
  | ㅘ ㅚ ㅝ ㅟ | ㅗㅏ / ㅗㅣ / ㅜㅓ / ㅜㅣ |
  | ㅙ ㅞ | ㅗㅏㅣ / ㅜㅓㅣ (3자모) |
  | 겹받침 (ㄳ ㄵ ㄶ ㄺ ...) | 두 자음으로 분해 |
  > 분해 매핑의 정합성 = 채점 정확도. `lib/jamo-mapping.ts`가 단일 진실 공급원(SSOT).
- 채점:
  - 🟩 초록: 자모 + 위치 모두 정답
  - 🟨 노랑: 자모는 정답에 있으나 위치 다름
  - ⬜ 회색: 정답에 없는 자모
- 채점 단위: **분해된 자모 시퀀스** 위치별 비교
- **자판 색상 누적**: 채점 후 키보드 자모 키에도 🟩🟨⬜ 반영. 한 자모가 여러 상태면 **🟩 > 🟨 > ⬜ 우선순위**로 유지 (한 번 초록이면 회색으로 강등 안 됨)
- 게임 종료 조건:
  - 5번 안에 정답 자모 시퀀스와 일치 → 승리
  - 5번 모두 실패 → 패배 (정답 공개, 음절 형태로도 표시)

### 2.2 모드 (v1)

- **무제한 모드만 제공.** 라운드 종료 후 "다시하기" 버튼으로 새 단어 시작.

### 2.3 결과 공유

- 게임 종료 후 🟩🟨⬜ 그리드 + 시도 횟수 + 소요 시간을 클립보드 복사
- 카톡/메시지에 붙여넣어 공유 (이미지 X, 텍스트만)

### 2.4 통계 (Stats)

**v1: 라운드 종료 시점에 localStorage에 저장**한다. (브라우저 로컬, 디바이스 간 동기화 없음)
v1.1에서 Supabase로 승격해 크로스 디바이스 동기화 + 친구 리더보드를 추가한다 (스키마 §2.7, v1.1).

저장 항목 (localStorage `kordle.plays` 배열 — **필드를 v1.1 Supabase 스키마와 동일하게** 맞춰 마이그레이션 대비):

| 필드          | 타입          | 설명                                  |
| ------------- | ------------- | ------------------------------------- |
| `id`          | UUID (crypto) | 라운드 식별자                         |
| `played_at`   | ISO string    | 플레이 종료 시각                      |
| `answer`      | TEXT          | 정답 음절 형태 (예: "사과")           |
| `answer_jamo` | TEXT          | 정답 자모 시퀀스 (예: "ㅅㅏㄱㅗㅏ")    |
| `solved`      | BOOLEAN       | 성공 여부                             |
| `attempts`    | SMALLINT      | 시도 횟수 (1~5, 실패 시 5)            |
| `duration_ms` | INT           | 시작~종료 소요 시간 (ms)              |
| `guesses`     | JSON          | 사용자 입력 (각 자모 시퀀스 배열)     |
| `user_id`     | UUID \| null  | v1에선 null, v1.1에서 auth.users.id   |

집계 화면 (`/stats` 페이지):

**내 통계**
- 총 도전 횟수 / 정답률 (%) / 평균 시도 횟수 / 평균 소요 시간
- 시도 횟수별 분포 (막대 그래프)
- 최근 푼 문제 리스트 (최근 50개)

**친구 비교 (v1.1)**
- 같은 Supabase 프로젝트의 모든 유저 통계 리더보드
  - 정답률 순 / 평균 소요 시간 순 / 총 플레이 순
  - 닉네임 + 카카오 프로필 이미지 표시

### 2.5 단어 사전

**정답 풀 ⊂ 입력 허용 풀** 2단계 구조 (본가 Wordle 방식: 정답은 좁고 깔끔, 입력 허용은 넓게).

출처: `klue/bert-base` 토크나이저 vocab(약 32k 토큰)을 베이스로 한다.
⚠️ vocab은 사전이 아니라 **WordPiece 조각 집합**이므로 강한 필터링이 전제 (`##` subword·한자·영어·특수토큰·조사 다수 포함).

빌드 파이프라인 (`scripts/build-words.ts`):

```
KLUE vocab (~32k)
  │ ① `##`(subword) 제거 → 순수 한글만 → 자모 분해 후 정확히 5자모 → 1글자/조사/접사 제거
  ▼
입력 허용 풀 (guesses, 수백~수천)   ← 제출 검증용. 자모 시퀀스 Set으로 O(1) 조회
  │ ② 명사 위주 필터 + 블랙리스트 + 충돌(동일 자모5) 제거 + 수동 검수
  ▼
정답 풀 (answers, 300~800)          ← 랜덤 출제용. 충돌 없음 보장
```

- 산출물: `data/words.json` = `{ answers: WordEntry[], guesses: string[] }`
  - `WordEntry = { syllable: string, jamo: string }` (음절·자모 둘 다 보관)
  - `guesses`는 입력 검증용 자모 시퀀스 문자열 Set
- 입력 허용 단어 = 입력 허용 풀 (정답 풀은 그 부분집합)
- 무효 단어 제출: 시도 차감 X, 행 흔들림 + 토스트
- 난이도: 일상에서 알 만한 단어 위주 (전문 용어/고어/조사 제외)

### 2.6 인증 (Auth) — v1.1 (v1 제외)

> v1은 로그인 없이 바로 플레이. 아래는 v1.1 설계 참고용.

- **Provider**: 카카오 OAuth 단일 (Supabase Auth 네이티브 지원)
- **첫 진입 플로우**: 비로그인 → "카카오로 시작하기" 버튼만 보이는 랜딩 → 게임 진입
- **사용자 정보**: 카카오 닉네임 + 프로필 이미지 + (옵션) 이메일
  - Kakao 동의 항목: `profile_nickname`, `profile_image`, `account_email` (선택)
  - 이메일 비동의 사용자도 허용 (Supabase "Allow users without email" 옵션 켜기)
- **세션 관리**: Supabase SSR 패키지(`@supabase/ssr`) 기반, 서버/클라이언트 양쪽 인증 상태 일관
- **로그아웃**: 헤더 우측에 닉네임 클릭 시 드롭다운에서 가능

### 2.7 데이터베이스 스키마 — v1.1 (v1 제외)

> v1 localStorage 필드는 아래 `plays` 컬럼과 1:1 대응되게 설계됨 → v1.1 마이그레이션은 로컬 배열 INSERT 한 번.

```sql
-- public.profiles: auth.users 확장, 닉네임/아바타 표시용
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- public.plays: 라운드 기록
create table public.plays (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  played_at    timestamptz not null default now(),
  answer       text not null,
  answer_jamo  text not null,
  solved       boolean not null,
  attempts     smallint not null check (attempts between 1 and 5),
  duration_ms  int not null,
  guesses      jsonb not null
);

create index plays_user_played_idx on public.plays(user_id, played_at desc);
```

**RLS (Row Level Security)**

```sql
alter table public.profiles enable row level security;
alter table public.plays    enable row level security;

-- profiles: 모든 로그인 사용자 읽기 가능 (친구 리더보드용)
create policy "profiles read all"   on public.profiles for select using (auth.role() = 'authenticated');
create policy "profiles upsert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- plays: 모든 로그인 사용자 읽기 (리더보드), 본인만 쓰기
create policy "plays read all"      on public.plays    for select using (auth.role() = 'authenticated');
create policy "plays insert own"    on public.plays    for insert with check (auth.uid() = user_id);
```

> 친구 그룹 안에서 통계 공유가 핵심이라 select는 모두 허용. 정답 사전이 클라이언트에 있어 컨닝은 신뢰 기반(친구 게임).

---

## 3. 비기능 요구사항

- **반응형 웹**: 모바일 우선, PC 호환
- **데이터 보관 (v1)**: localStorage. (v1.1: Supabase Postgres free tier)
- **성능**: 키 입력 → 화면 반영 < 50ms / 통계 쓰기는 비동기 (UI 블록 X)
- **보안 (v1.1 대비)**:
  - Service role key는 서버 측에서만 사용, GitHub 절대 커밋 금지
  - Anon key는 환경변수(`NEXT_PUBLIC_SUPABASE_ANON_KEY`)로 노출 (RLS로 보호)
  - `.env*.local`은 `.gitignore`에 등재됨

---

## 4. 기술 스택

- **Framework**: Next.js 14 (App Router) + TypeScript — v1.1 DB 연동 대비해 유지
- **Styling**: Tailwind CSS
- **상태 관리**: React useState/useReducer (게임 상태 머신)
- **저장소 (v1)**: localStorage (통계·진행 상태)
- **인증/DB (v1.1)**: Supabase (Auth + Postgres + RLS), Kakao OAuth — `@supabase/supabase-js`, `@supabase/ssr`
- **배포**: Vercel (무료 티어, GitHub 연동 자동 배포)
- **테스트**: Vitest (자모 분해/조합/채점 로직 단위 테스트)

### 디렉토리 구조

```
kordle/
├── app/
│   ├── play/page.tsx                # 게임 페이지 (v1: 보호 없음)
│   ├── stats/page.tsx               # 내 통계 (localStorage)
│   ├── layout.tsx
│   └── page.tsx                     # 랜딩 → 게임 진입
├── components/
│   ├── game/
│   │   ├── Board.tsx                # 5칸 격자 × 5행
│   │   ├── Keyboard.tsx             # 자모 24키 + 기능키, 색상 누적
│   │   ├── Tile.tsx
│   │   └── ResultModal.tsx          # 정답(음절)·시도·소요시간
│   └── stats/
│       └── StatsSummary.tsx
├── lib/
│   ├── hangul.ts                    # 자모 분해/조합
│   ├── jamo-mapping.ts              # 분해 테이블 (현재 위치, SSOT)
│   ├── grade.ts                     # 🟩🟨⬜ 채점 (2-pass)
│   ├── words.ts                     # 사전 로드 + 랜덤 정답 선택 + 입력 검증
│   ├── stats.ts                     # localStorage 통계 R/W
│   └── timer.ts                     # 라운드 소요 시간 측정
├── data/
│   └── words.json                   # { answers, guesses } 빌드 산출물
├── scripts/
│   └── build-words.ts               # KLUE vocab → words.json 전처리
├── docs/
│   └── PRD.md
└── package.json

# v1.1 (DB 연동 시 추가):
#   app/(auth)/login, app/(auth)/callback, app/stats/leaderboard
#   components/auth/*, lib/supabase/{client,server,middleware}.ts, lib/plays.ts
#   supabase/migrations/0001_init.sql, middleware.ts, .env.local
```

### 환경변수

```bash
# v1: 환경변수 불필요 (로컬 only)
# v1.1:
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# Service role은 서버 전용 작업(예: 시드)에만, 일반적으로는 불필요
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

---

## 5. 사용자 플로우

### 5.1 첫 방문 (v1 — 로그인 없음)

1. `/` 진입 → 랜딩 페이지 (게임 소개 + "시작하기" 버튼)
2. `/play`로 진입, 바로 플레이
3. (v1.1) 카카오 로그인 추가 — OAuth 동의 → `/auth/callback` → `profiles` 생성 → `/play`

### 5.2 게임 시작

1. `/play` 진입
2. 빈 격자 + 한글 자판 표시
3. 랜덤 단어 1개가 정답으로 선택됨 (사용자에겐 비공개)
4. 게임 시작 시각 기록 (타이머 시작)

### 5.3 라운드 진행

1. 사용자가 자모 입력 (자판 클릭/탭)
2. 5자모 채워지면 Enter 활성화 → 제출
3. 입력 허용 풀에 없는 단어면 행 흔들림 + 토스트 (시도 차감 X)
4. 채점 결과: 격자 🟩🟨⬜ + 자판 자모 색상 누적 갱신
5. 정답 일치 or 5회 소진 시 종료

### 5.4 라운드 종료

1. 결과 모달: 정답(음절+자모) / 시도 횟수 / 소요 시간
2. **localStorage `kordle.plays`에 라운드 기록 저장** (v1.1에서 Supabase 비동기 업로드로 승격)
3. 버튼: "결과 공유" (클립보드 복사) / "다시하기" / "통계 보기"

### 5.5 통계 페이지

- `/stats` 진입
- §2.4의 집계 표시
- "기록 초기화" 버튼 (확인 다이얼로그 후 localStorage 삭제)

---

## 6. 결정 사항 (Decisions)

### D1. 시도 횟수 ✅
- **결정: 5번**

### D2. 입력 단어 검증 규칙 ✅
- **결정: 입력 허용 풀에 있는 단어만 제출 가능** (정답 풀보다 넓음, §2.5/D9)
- 검증 시점: 제출(Enter) 시 / 무효 시 시도 차감 X, 행 흔들림 + 토스트
- 자료구조: 빌드 시점에 자모 시퀀스 Set → O(1) 조회

### D3. 단어 사전 출처 ✅
- **결정: `klue/bert-base` vocab 필터링** → 입력 허용 풀 → (검수) 정답 풀 (§2.5)

### D4. 통계 초기화 정책 ✅
- **결정: 수동 초기화 버튼만** (확인 다이얼로그 동반)

### D5. 한글 자판 ✅
- **결정: 자모 그리드 전용 키보드** (자음 14 + 모음 10 + 기능키 2)
- 쌍자음/복모음/겹받침 키 없음, 단일 자모를 순서대로 누름

### D6. 같은 자모 중복 처리 ✅
- **결정: 본가 규칙 그대로** — 정답에 존재하는 개수만큼만 🟨/🟩, 초과분 ⬜
- 알고리즘: 2-pass (1pass: 🟩 + 정답 자모 카운트 차감 / 2pass: 남은 카운트로 🟨·⬜ 분기)

### D7. 입력 진행 표시 ✅
- **결정: 자모만 표시** (`ㄱ ㄱ ㅗ ㅏ ㄱ`). 종료 모달에서만 음절 노출 (`정답: 꽉`)

### D8. 자모 분해 — ㅐ/ㅔ 계열 ✅
- **결정: 분해함.** ㅐ→ㅏㅣ, ㅒ→ㅑㅣ, ㅔ→ㅓㅣ, ㅖ→ㅕㅣ, ㅢ→ㅡㅣ
- 키보드 단모음 10개로만 환원 → `lib/jamo-mapping.ts` 기준 (SSOT)

### D9. 사전 구조 ✅
- **결정: 정답 풀 ⊂ 입력 허용 풀 분리** (§2.5)

### D10. 자모 시퀀스 충돌 ✅
- **결정: 정답 풀 빌드 시 동일 자모5 단어 제거** (충돌 자체를 없앰)

### D11. 타이머 ✅
- **결정: 라운드 소요 시간 측정·표시.** 시작~종료 ms 기록, 결과 모달·통계·공유 텍스트에 노출
- 카운트다운 아님 — 압박 없는 경과 시간(스톱워치)

### D12. 자판 색상 누적 ✅
- **결정: 본가처럼 키보드에 🟩🟨⬜ 누적.** 상태 우선순위 🟩 > 🟨 > ⬜

### D-범위. v1 스코프 ✅
- **결정: v1 = 로컬 only** (localStorage). 카카오 OAuth·Supabase·리더보드는 v1.1
- 스택은 Next.js 유지 (v1.1 DB 연동 대비), 저장 필드 = v1.1 스키마와 동일

---

## 7. 마일스톤

### Phase 1 — MVP (v1, 로컬 only)
- [ ] 자모 분해/조합 유틸 + 단위 테스트 (D8 포함)
- [ ] 채점 로직 + 단위 테스트 (D6 2-pass)
- [ ] 단어 사전 파이프라인: KLUE → answers/guesses (D9/D10)
- [ ] 게임 보드 UI + 한글 자판 (D5) + 자판 색상 누적 (D12)
- [ ] 게임 상태 머신 (시작 / 입력 / 채점 / 종료) + 타이머 (D11)
- [ ] localStorage 통계 저장 + 통계 페이지
- [ ] 결과 공유 (클립보드 복사, 소요 시간 포함)
- [ ] Vercel 배포

### Phase 2 — v1.1 (DB · 인증 · 다듬기)
- [ ] 카카오 OAuth (Supabase Auth) + 보호 라우트
- [ ] Supabase `plays`/`profiles` 스키마 + RLS, localStorage → DB 마이그레이션
- [ ] 친구 리더보드 (`/stats/leaderboard`)
- [ ] 다크 모드
- [ ] 애니메이션 (타일 뒤집기, 흔들림)
- [ ] 결과 그리드 og:image (카톡 공유 미리보기)
- [ ] 효과음 (선택)

### Phase 3 — 추후 검토
- [ ] Daily 모드 (모두 같은 단어)
- [ ] 친구 대전 모드

---

## 8. 성공 기준

- 친구들과 한 달간 사용했을 때 **누적 100회 이상 플레이** (본인 + 친구 합산)
- 통계 페이지에서 "이 단어 다시 풀고 싶다" 같은 재시도 욕구가 자연 발생
- 카톡 공유 텍스트 붙여넣기로 **친구 1명 이상 신규 유입**
