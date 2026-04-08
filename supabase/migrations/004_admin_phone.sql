-- admin_profiles에 phone 컬럼 추가
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS phone text;
CREATE UNIQUE INDEX IF NOT EXISTS admin_profiles_phone_key ON admin_profiles (phone) WHERE phone IS NOT NULL;
