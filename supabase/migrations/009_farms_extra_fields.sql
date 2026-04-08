-- =============================================
-- 009: farms 테이블 추가 필드
-- =============================================

ALTER TABLE farms
  ADD COLUMN IF NOT EXISTS business_name        text,           -- 상호 (법인명)
  ADD COLUMN IF NOT EXISTS representative_name  text,           -- 대표자명
  ADD COLUMN IF NOT EXISTS email                text,           -- 이메일
  ADD COLUMN IF NOT EXISTS main_phone           text,           -- 대표전화 (고정전화 등)
  ADD COLUMN IF NOT EXISTS image_urls           text[] DEFAULT ARRAY[]::text[];  -- 이미지 여러 개

COMMENT ON COLUMN farms.business_name        IS '상호(법인명)';
COMMENT ON COLUMN farms.representative_name  IS '대표자명';
COMMENT ON COLUMN farms.email                IS '이메일';
COMMENT ON COLUMN farms.main_phone           IS '대표전화';
COMMENT ON COLUMN farms.image_urls           IS '농장 이미지 URL 배열 (첫 번째가 대표 이미지)';

-- 008 시드 데이터에 추가 필드 업데이트
-- (농장명으로 조회 후 업데이트)
UPDATE farms SET
  business_name       = '힐링팜 바람대로',
  representative_name = '오세연',
  email               = '53yean@naver.com',
  main_phone          = '010-6648-7210'
WHERE name = '힐링팜 바람대로';

UPDATE farms SET
  business_name       = '늘봄정원',
  representative_name = '이여람',
  email               = 'lyr5222@gmail.com',
  main_phone          = '010-7614-2400'
WHERE name = '늘봄정원';

UPDATE farms SET
  business_name       = '미친서각마을영농조합법인',
  representative_name = '정지완',
  email               = '9342203@naver.com',
  main_phone          = '041-934-2203'
WHERE name = '미친서각마을 치유농장';
