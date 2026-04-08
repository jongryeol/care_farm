-- =============================================
-- 006: farm_schedules를 farm_id 기반 → farm_program_id 기반으로 변경
-- 농장의 회차(시간)는 농장이 아닌 "농장×프로그램" 단위에 속함
-- =============================================

-- 1. farm_program_id 컬럼 추가 (일단 nullable로)
ALTER TABLE farm_schedules
  ADD COLUMN farm_program_id uuid REFERENCES farm_programs(id) ON DELETE CASCADE;

-- 2. 기존 데이터 backfill
--    farm_id 기준으로 farm_programs에서 첫 번째 활성 프로그램 연결
UPDATE farm_schedules fs
SET farm_program_id = fp.id
FROM (
  SELECT DISTINCT ON (farm_id) id, farm_id
  FROM farm_programs
  WHERE is_active = true
  ORDER BY farm_id, id
) fp
WHERE fp.farm_id = fs.farm_id;

-- 3. farm_program_id NOT NULL 제약 추가
ALTER TABLE farm_schedules
  ALTER COLUMN farm_program_id SET NOT NULL;

-- 4. farm_id 컬럼에 의존하는 RLS 정책 먼저 제거
DROP POLICY IF EXISTS "farm_schedules_farm_admin_read" ON farm_schedules;

-- 5. farm_id 컬럼 제거 (farm_program_id → farm_programs.farm_id 로 파생 가능)
ALTER TABLE farm_schedules DROP COLUMN farm_id;

-- 6. RLS 정책 재생성: farm_program_id → farm_programs.farm_id 경로로 농장 소유 확인
CREATE POLICY "farm_schedules_farm_admin_read" ON farm_schedules
  FOR SELECT USING (
    get_admin_role() = 'farm_admin' AND
    EXISTS (
      SELECT 1 FROM farm_programs fp
      WHERE fp.id = farm_program_id AND fp.farm_id = get_admin_farm_id()
    )
  );

-- 7. reservations.program_id 컬럼 제거
--    (schedule_id → farm_schedules.farm_program_id → farm_programs.program_id 로 파생 가능)
ALTER TABLE reservations DROP COLUMN IF EXISTS program_id;

-- 8. 인덱스 재구성
DROP INDEX IF EXISTS idx_farm_schedules_farm_day;
CREATE INDEX idx_farm_schedules_program_day ON farm_schedules(farm_program_id, day_of_week);
