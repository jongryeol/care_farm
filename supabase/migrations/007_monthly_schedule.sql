-- =============================================
-- 007: farm_schedules에 available_months 추가
--      farm_blocked_dates 테이블 생성
-- =============================================

-- 1. available_months 컬럼 추가 (기본값: 전체 월 활성)
ALTER TABLE farm_schedules
  ADD COLUMN available_months integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7,8,9,10,11,12];

COMMENT ON COLUMN farm_schedules.available_months IS '운영 가능한 월 목록 (1=1월 ~ 12=12월)';

-- 2. farm_blocked_dates 테이블 생성
--    특정 날짜(+ 선택적으로 특정 회차)의 예약을 차단
CREATE TABLE farm_blocked_dates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 특정 회차를 차단할 경우 지정, NULL이면 해당 날짜의 모든 회차 차단
  farm_schedule_id uuid REFERENCES farm_schedules(id) ON DELETE CASCADE,
  -- 프로그램 단위 차단 시 지정 (farm_schedule_id가 없을 때)
  farm_program_id  uuid REFERENCES farm_programs(id)  ON DELETE CASCADE,
  blocked_date     date NOT NULL,
  reason           text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_blocked_target CHECK (
    farm_schedule_id IS NOT NULL OR farm_program_id IS NOT NULL
  )
);

COMMENT ON TABLE farm_blocked_dates IS '특정 날짜/회차 예약 차단';
COMMENT ON COLUMN farm_blocked_dates.farm_schedule_id IS 'NULL이면 farm_program_id 기준 전 회차 차단';

CREATE INDEX idx_farm_blocked_dates_schedule ON farm_blocked_dates(farm_schedule_id, blocked_date);
CREATE INDEX idx_farm_blocked_dates_program  ON farm_blocked_dates(farm_program_id, blocked_date);
