-- =============================================
-- 치유농장 체험 예약 서비스 - 초기 스키마
-- =============================================

-- 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- =============================================
-- 1. farms (농장 정보)
-- =============================================
create table farms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  short_description text,
  address text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  region text,
  phone text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table farms is '농장 정보';
comment on column farms.latitude is '위도';
comment on column farms.longitude is '경도';

-- =============================================
-- 2. programs (체험 상품)
-- =============================================
create table programs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  target_audience text,
  process_description text,
  duration_minutes integer,
  notice text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table programs is '체험 상품 정보';
comment on column programs.target_audience is '대상자';
comment on column programs.process_description is '진행 방식';

-- =============================================
-- 3. farm_programs (농장-상품 연결)
-- =============================================
create table farm_programs (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid not null references farms(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  is_active boolean not null default true,
  unique(farm_id, program_id)
);

comment on table farm_programs is '농장과 체험 상품 연결';

-- =============================================
-- 4. farm_schedules (농장 운영 요일/회차)
-- =============================================
create table farm_schedules (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid not null references farms(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  -- 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  start_time time not null,
  end_time time not null,
  max_capacity integer not null default 12,
  recommended_capacity integer not null default 8,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table farm_schedules is '농장 운영 요일 및 회차 설정';
comment on column farm_schedules.day_of_week is '0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토';

-- =============================================
-- 5. reservations (예약)
-- =============================================
create table reservations (
  id uuid primary key default uuid_generate_v4(),
  reservation_no text not null unique,
  farm_id uuid not null references farms(id),
  program_id uuid references programs(id),
  schedule_id uuid not null references farm_schedules(id),
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  head_count integer not null check (head_count >= 1),
  applicant_name text not null,
  applicant_phone text not null,
  phone_verified boolean not null default false,
  request_memo text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  reject_reason text,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reservations is '예약 정보';
comment on column reservations.status is 'pending=신청, confirmed=확정, rejected=거절, cancelled=취소, completed=완료';

-- 예약번호 자동 생성 함수
create or replace function generate_reservation_no()
returns text as $$
declare
  v_no text;
  v_exists boolean;
begin
  loop
    v_no := 'CF' || to_char(now(), 'YYYYMMDD') || lpad(floor(random() * 10000)::text, 4, '0');
    select exists(select 1 from reservations where reservation_no = v_no) into v_exists;
    exit when not v_exists;
  end loop;
  return v_no;
end;
$$ language plpgsql;

-- 예약번호 자동 설정 트리거
create or replace function set_reservation_no()
returns trigger as $$
begin
  if new.reservation_no is null or new.reservation_no = '' then
    new.reservation_no := generate_reservation_no();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_reservation_no
  before insert on reservations
  for each row execute function set_reservation_no();

-- =============================================
-- 6. phone_verifications (전화번호 인증)
-- =============================================
create table phone_verifications (
  id uuid primary key default uuid_generate_v4(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table phone_verifications is '전화번호 인증 기록';

-- =============================================
-- 7. admin_profiles (관리자 정보)
-- =============================================
create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'farm_admin'
    check (role in ('super_admin', 'farm_admin')),
  farm_id uuid references farms(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table admin_profiles is '관리자 정보';
comment on column admin_profiles.role is 'super_admin=슈퍼관리자, farm_admin=농장관리자';

-- =============================================
-- 8. reservation_logs (예약 상태 변경 이력)
-- =============================================
create table reservation_logs (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  action text not null check (action in ('created', 'confirmed', 'rejected', 'cancelled', 'completed')),
  actor_type text not null check (actor_type in ('user', 'admin', 'system')),
  actor_id uuid,
  memo text,
  created_at timestamptz not null default now()
);

comment on table reservation_logs is '예약 상태 변경 이력';

-- =============================================
-- updated_at 자동 갱신 트리거
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_farms_updated_at
  before update on farms
  for each row execute function update_updated_at();

create trigger trg_programs_updated_at
  before update on programs
  for each row execute function update_updated_at();

create trigger trg_farm_schedules_updated_at
  before update on farm_schedules
  for each row execute function update_updated_at();

create trigger trg_reservations_updated_at
  before update on reservations
  for each row execute function update_updated_at();

create trigger trg_admin_profiles_updated_at
  before update on admin_profiles
  for each row execute function update_updated_at();

-- =============================================
-- 인덱스
-- =============================================
create index idx_reservations_farm_id on reservations(farm_id);
create index idx_reservations_schedule_id on reservations(schedule_id);
create index idx_reservations_date on reservations(reservation_date);
create index idx_reservations_status on reservations(status);
create index idx_reservations_phone on reservations(applicant_phone);
create index idx_farm_schedules_farm_day on farm_schedules(farm_id, day_of_week);
create index idx_phone_verifications_phone on phone_verifications(phone);
create index idx_reservation_logs_reservation on reservation_logs(reservation_id);
