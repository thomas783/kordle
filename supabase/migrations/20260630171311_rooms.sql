-- 같이 풀기 (멀티플레이 방) 스키마 — 설계: docs/ERD.md
-- profiles / rooms / room_members + RLS(공개 anon 키 → RLS가 보안 경계)

-- ─────────────────────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────────────────────

-- 프로필: auth.users 확장 (클라가 읽을 수 있는 공개 투영)
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nickname   text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 방: "같이 풀기" 단위 (지속형 그룹)
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  host_id     uuid not null references public.profiles (id) on delete cascade,
  invite_code text unique,
  status      text not null default 'active', -- active | closed
  created_at  timestamptz not null default now()
);

-- 방 참여자 (다대다)
create table public.room_members (
  room_id   uuid references public.rooms (id) on delete cascade,
  user_id   uuid references public.profiles (id) on delete cascade,
  role      text not null default 'member', -- host | member
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_idx on public.room_members (user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. 헬퍼: 멤버십 확인 (security definer로 RLS 우회 → 정책 무한 재귀 방지)
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_room_member(p_room_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = p_user_id
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────

alter table public.profiles     enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_members enable row level security;

-- profiles: 로그인 유저 읽기(멤버 닉네임 표시), 본인만 쓰기
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update to authenticated using (auth.uid() = id);

-- rooms: 내가 멤버인 방만 읽기 / 로그인 유저는 생성(host=본인) / host만 수정
create policy "rooms read members" on public.rooms for select to authenticated
  using (public.is_room_member(id, auth.uid()));
create policy "rooms insert" on public.rooms for insert to authenticated
  with check (auth.uid() = host_id);
create policy "rooms host manage" on public.rooms for update to authenticated
  using (auth.uid() = host_id);

-- room_members: 같은 방 멤버끼리 읽기 / 본인 가입·탈퇴
create policy "members read same room" on public.room_members for select to authenticated
  using (public.is_room_member(room_id, auth.uid()));
create policy "members self join" on public.room_members for insert to authenticated
  with check (auth.uid() = user_id);
create policy "members self leave" on public.room_members for delete to authenticated
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. 프로필 자동 생성 (첫 로그인 시 auth.users → profiles)
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'nickname',
      '플레이어'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 기존 유저 백필 (트리거는 INSERT 시점만 작동 → 이미 가입한 유저는 여기서 생성)
insert into public.profiles (id, nickname, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'nickname', '플레이어'),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 5. 방 생성 RPC (room insert + host 등록을 한 트랜잭션으로)
-- ─────────────────────────────────────────────────────────────

create or replace function public.create_room(p_name text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.rooms (name, host_id)
  values (p_name, auth.uid())
  returning * into v_room;

  insert into public.room_members (room_id, user_id, role)
  values (v_room.id, auth.uid(), 'host');

  return v_room;
end;
$$;
