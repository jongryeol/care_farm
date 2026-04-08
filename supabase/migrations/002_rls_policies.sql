-- =============================================
-- Row Level Security 정책
-- =============================================

-- RLS 활성화
alter table farms enable row level security;
alter table programs enable row level security;
alter table farm_programs enable row level security;
alter table farm_schedules enable row level security;
alter table reservations enable row level security;
alter table phone_verifications enable row level security;
alter table admin_profiles enable row level security;
alter table reservation_logs enable row level security;

-- =============================================
-- Helper 함수
-- =============================================

-- 현재 사용자의 관리자 역할 반환
create or replace function get_admin_role()
returns text as $$
  select role from admin_profiles where id = auth.uid()
$$ language sql security definer stable;

-- 현재 사용자의 관리 농장 ID 반환
create or replace function get_admin_farm_id()
returns uuid as $$
  select farm_id from admin_profiles where id = auth.uid()
$$ language sql security definer stable;

-- =============================================
-- farms 정책
-- =============================================
-- 공개: 활성 농장 조회 가능
create policy "farms_public_read" on farms
  for select using (is_active = true);

-- 슈퍼관리자: 전체 CRUD
create policy "farms_super_admin_all" on farms
  for all using (get_admin_role() = 'super_admin');

-- =============================================
-- programs 정책
-- =============================================
create policy "programs_public_read" on programs
  for select using (is_active = true);

create policy "programs_super_admin_all" on programs
  for all using (get_admin_role() = 'super_admin');

-- =============================================
-- farm_programs 정책
-- =============================================
create policy "farm_programs_public_read" on farm_programs
  for select using (is_active = true);

create policy "farm_programs_super_admin_all" on farm_programs
  for all using (get_admin_role() = 'super_admin');

-- =============================================
-- farm_schedules 정책
-- =============================================
create policy "farm_schedules_public_read" on farm_schedules
  for select using (is_active = true);

create policy "farm_schedules_super_admin_all" on farm_schedules
  for all using (get_admin_role() = 'super_admin');

-- 농장관리자: 본인 농장 스케줄 조회
create policy "farm_schedules_farm_admin_read" on farm_schedules
  for select using (
    get_admin_role() = 'farm_admin' and farm_id = get_admin_farm_id()
  );

-- =============================================
-- reservations 정책
-- =============================================
-- 공개: 예약 생성 가능 (anon 포함)
create policy "reservations_public_insert" on reservations
  for insert with check (true);

-- 슈퍼관리자: 전체 조회/수정
create policy "reservations_super_admin_all" on reservations
  for all using (get_admin_role() = 'super_admin');

-- 농장관리자: 본인 농장 예약만 조회/수정
create policy "reservations_farm_admin_read" on reservations
  for select using (
    get_admin_role() = 'farm_admin' and farm_id = get_admin_farm_id()
  );

create policy "reservations_farm_admin_update" on reservations
  for update using (
    get_admin_role() = 'farm_admin' and farm_id = get_admin_farm_id()
  );

-- =============================================
-- phone_verifications 정책
-- =============================================
create policy "phone_verifications_insert" on phone_verifications
  for insert with check (true);

create policy "phone_verifications_read_own" on phone_verifications
  for select using (true); -- Edge Function에서 service_role로 처리

-- =============================================
-- admin_profiles 정책
-- =============================================
create policy "admin_profiles_read_own" on admin_profiles
  for select using (id = auth.uid() or get_admin_role() = 'super_admin');

create policy "admin_profiles_super_admin_all" on admin_profiles
  for all using (get_admin_role() = 'super_admin');

-- =============================================
-- reservation_logs 정책
-- =============================================
create policy "reservation_logs_super_admin_all" on reservation_logs
  for all using (get_admin_role() = 'super_admin');

create policy "reservation_logs_farm_admin_read" on reservation_logs
  for select using (
    get_admin_role() = 'farm_admin' and
    exists (
      select 1 from reservations r
      where r.id = reservation_id and r.farm_id = get_admin_farm_id()
    )
  );

create policy "reservation_logs_insert" on reservation_logs
  for insert with check (true);
