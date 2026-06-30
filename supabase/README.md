# 로컬 Supabase (CLI)

운영 DB와 **완전 분리된** 로컬 풀스택. 스키마/RLS는 여기서 실험하고, 검증 후 운영에 push.
스키마 설계는 [../docs/ERD.md](../docs/ERD.md).

## 사전 준비
- Docker 실행 중
- Supabase CLI (`supabase --version`) — 미설치 시 `brew install supabase/tap/supabase`

## 시작

```bash
supabase start                  # 로컬 풀스택 기동 (최초엔 이미지 pull로 수 분)
```

출력되는 값을 **앱의 `.env.local`** 에 넣으면 로컬 DB로 붙는다 (운영과 분리):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase start 가 출력한 anon key>
```

- Studio(로컬 GUI): http://127.0.0.1:54323
- 운영으로 돌아갈 땐 `.env.local` 을 운영 URL/anon 키로 되돌리면 됨

## 마이그레이션 (스키마 = 코드)

```bash
supabase db reset               # 로컬 DB 초기화 + migrations/ 전부 재적용 (스키마 검증)
supabase migration new <name>   # 새 마이그레이션 파일 생성
supabase db push                # 검증 끝난 마이그레이션을 운영에 반영 (link 필요)
```

운영 연결 (push/pull 용, 1회):
```bash
supabase login                  # CLI 인증 (본인)
supabase link --project-ref <project-ref>   # 운영 프로젝트 ref (Supabase 대시보드 URL에서 확인)
```

## 카카오 로그인 (로컬)

선택 사항 — 스키마만 개발하면 불필요.
1. `cp supabase/.env.example supabase/.env` → REST API 키 / 클라이언트 시크릿 입력 (gitignore됨)
2. 카카오 Redirect URI에 `http://127.0.0.1:54321/auth/v1/callback` 추가 등록
3. `supabase start` (재시작) → 로컬에서 카카오 로그인 동작

## 정지
```bash
supabase stop                   # 로컬 스택 정지 (데이터는 보존)
supabase stop --no-backup       # 데이터까지 삭제
```
