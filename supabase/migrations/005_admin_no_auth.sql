-- admin_profiles를 Supabase Auth에서 분리
-- 1. 기존 FK 제거
ALTER TABLE admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_id_fkey;

-- 2. id를 auto-generate uuid로 변경 (기존 데이터 유지)
ALTER TABLE admin_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. reservation_logs.actor_id는 auth.users를 참조하지 않으므로 그대로 유지
