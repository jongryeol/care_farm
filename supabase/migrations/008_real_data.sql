-- =============================================
-- 008: 기존 테스트 데이터 초기화 + 실제 운영 데이터 입력
-- =============================================

-- 기존 데이터 초기화 (admin_profiles 유지)
TRUNCATE TABLE reservation_logs, reservations, farm_blocked_dates RESTART IDENTITY CASCADE;
TRUNCATE TABLE farm_schedules, farm_programs RESTART IDENTITY CASCADE;
TRUNCATE TABLE programs RESTART IDENTITY CASCADE;
TRUNCATE TABLE farms RESTART IDENTITY CASCADE;
TRUNCATE TABLE phone_verifications RESTART IDENTITY CASCADE;

-- =============================================
-- Farm 1: 힐링팜 바람대로
-- 프로그램: 나도 빨간머리앤처럼
-- 운영: 5,6,7,9월 / 화(2), 목(4) / 10:00~12:00 / 최대 10명
-- =============================================
DO $$
DECLARE
  v_farm_id    uuid;
  v_program_id uuid;
  v_fp_id      uuid;
BEGIN
  INSERT INTO farms (name, short_description, description, address, region, phone, is_active)
  VALUES (
    '힐링팜 바람대로',
    '바라다·바래다·배웅하다, 세 가지 의미를 담은 치유농장',
    '힐링팜 바람대로는 치유농장입니다. ''무엇인가를 바라다''는 뜻과 ''빛이 바래다'', 떠나는 이를 ''배웅해 주다'' 모두를 포함하는 의미, 우리를 힘들게 하는 아픔이나 슬픔, 스트레스의 빛을 바래게 하거나 떠나도록 배웅해 주길 바란다는 뜻에서 힐링팜 바람대로라는 이름을 갖게 되었답니다.',
    '충청남도 천안시 동남구 통세골1길 23',
    '충남',
    '010-6648-7210',
    true
  ) RETURNING id INTO v_farm_id;

  INSERT INTO programs (title, description, target_audience, duration_minutes, is_active)
  VALUES (
    '나도 빨간머리앤처럼',
    '자연 속에서 나를 발견하는 치유 체험 프로그램. 힐링팜 바람대로에서 빨간머리 앤처럼 자연과 하나 되는 시간을 경험해 보세요.',
    '전 연령층',
    120,
    true
  ) RETURNING id INTO v_program_id;

  INSERT INTO farm_programs (farm_id, program_id, is_active)
  VALUES (v_farm_id, v_program_id, true)
  RETURNING id INTO v_fp_id;

  INSERT INTO farm_schedules (farm_program_id, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months)
  VALUES
    (v_fp_id, 2, '10:00', '12:00', 10, 8, ARRAY[5,6,7,9]),   -- 화
    (v_fp_id, 4, '10:00', '12:00', 10, 8, ARRAY[5,6,7,9]);   -- 목
END $$;

-- =============================================
-- Farm 2: 늘봄정원
-- 프로그램: 식물과 함께 다시 피어나다
-- 운영: 4,5,6,7,9,10월 / 화(2), 수(3), 목(4) / 10:00~12:00 / 최대 10명
-- =============================================
DO $$
DECLARE
  v_farm_id    uuid;
  v_program_id uuid;
  v_fp_id      uuid;
BEGIN
  INSERT INTO farms (name, short_description, description, address, region, phone, is_active)
  VALUES (
    '늘봄정원',
    '꽃과 나무가 30년 동안 자라온 정원, 마음이 쉬어가는 치유 공간',
    '꽃과 나무가 30년 동안 자라온 정원, 그 안에서 사람의 마음도 함께 쉬어가는 곳 늘봄정원. 충남 공주 우성면에 위치한 늘봄정원은 오랜 시간 정성껏 가꾸어 온 식물정원을 바탕으로 자연 속에서 편안한 쉼을 경험할 수 있는 공간입니다. 계절마다 피어나는 꽃과 자라나는 나무, 그리고 흙의 온기 속에서 방문객들은 잠시 일상의 속도를 늦추고 마음을 쉬어갈 수 있습니다.',
    '충남 공주시 우성면 곰나루길 51',
    '충남',
    '010-7614-2400',
    true
  ) RETURNING id INTO v_farm_id;

  INSERT INTO programs (title, description, target_audience, duration_minutes, is_active)
  VALUES (
    '식물과 함께 다시 피어나다',
    '식물을 단순히 감상하는 것을 넘어 직접 만지고 심으며 자연과 교감하는 치유농업 프로그램. 아이들은 자연 속에서 감정과 창의력을 키우고, 청소년은 식물과 음악이 함께하는 프로그램을 통해 정서적 안정과 자존감을 키워갑니다.',
    '전 연령층',
    120,
    true
  ) RETURNING id INTO v_program_id;

  INSERT INTO farm_programs (farm_id, program_id, is_active)
  VALUES (v_farm_id, v_program_id, true)
  RETURNING id INTO v_fp_id;

  INSERT INTO farm_schedules (farm_program_id, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months)
  VALUES
    (v_fp_id, 2, '10:00', '12:00', 10, 8, ARRAY[4,5,6,7,9,10]),   -- 화
    (v_fp_id, 3, '10:00', '12:00', 10, 8, ARRAY[4,5,6,7,9,10]),   -- 수
    (v_fp_id, 4, '10:00', '12:00', 10, 8, ARRAY[4,5,6,7,9,10]);   -- 목
END $$;

-- =============================================
-- Farm 3: 미친서각마을 치유농장
-- 프로그램: 몸과 마음을 돌보는 치유여행
-- 복잡한 월별 스케줄 (상세 내용 하단 참조)
-- 최대 15명
-- =============================================
DO $$
DECLARE
  v_farm_id    uuid;
  v_program_id uuid;
  v_fp_id      uuid;
BEGIN
  INSERT INTO farms (name, short_description, description, address, region, phone, is_active)
  VALUES (
    '미친서각마을 치유농장',
    '꽃과 허브를 활용한 원예·꽃차·아로마 치유 체험 공간',
    '미친서각마을 치유농장은 자연과 함께 몸과 마음의 회복을 돕는 농촌 치유 체험 공간입니다. 꽃과 허브를 활용한 원예 체험, 꽃차 체험, 아로마 활동 등을 통해 정서 안정과 힐링의 시간을 제공합니다. 참여자들이 식물을 가꾸고 자연과 교감하며 스트레스를 완화하고 마음의 여유를 찾을 수 있도록 다양한 치유 프로그램을 운영하고 있습니다.',
    '충남 보령시 남포면 원제길 37',
    '충남',
    '010-5495-9571',
    true
  ) RETURNING id INTO v_farm_id;

  INSERT INTO programs (title, description, target_audience, duration_minutes, is_active)
  VALUES (
    '몸과 마음을 돌보는 치유여행',
    '청소년, 성인, 노인 등 누구나 참여할 수 있는 농촌 치유 활동을 통해 건강하고 따뜻한 삶을 지원합니다. 꽃과 허브를 활용한 다양한 치유 프로그램으로 몸과 마음의 회복을 경험하세요.',
    '전 연령층',
    120,
    true
  ) RETURNING id INTO v_program_id;

  INSERT INTO farm_programs (farm_id, program_id, is_active)
  VALUES (v_farm_id, v_program_id, true)
  RETURNING id INTO v_fp_id;

  -- 운영 스케줄 상세:
  -- 3월    : 수(3) 10:00~12:00, 14:00~16:00
  -- 4~7월  : 월(1),목(4) 10:00~12:00 / 화(2),수(3),일(0) 10:00~12:00, 14:00~16:00
  -- 9월    : 목(4) 10:00~12:00 / 월(1),화(2),수(3),금(5) 10:00~12:00, 14:00~16:00

  INSERT INTO farm_schedules (farm_program_id, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months)
  VALUES
    -- 일(0): 4,5,6,7월
    (v_fp_id, 0, '10:00', '12:00', 15, 12, ARRAY[4,5,6,7]),
    (v_fp_id, 0, '14:00', '16:00', 15, 12, ARRAY[4,5,6,7]),
    -- 월(1): 10:00 → 4,5,6,7,9월 / 14:00 → 9월
    (v_fp_id, 1, '10:00', '12:00', 15, 12, ARRAY[4,5,6,7,9]),
    (v_fp_id, 1, '14:00', '16:00', 15, 12, ARRAY[9]),
    -- 화(2): 4,5,6,7,9월
    (v_fp_id, 2, '10:00', '12:00', 15, 12, ARRAY[4,5,6,7,9]),
    (v_fp_id, 2, '14:00', '16:00', 15, 12, ARRAY[4,5,6,7,9]),
    -- 수(3): 3,4,5,6,7,9월
    (v_fp_id, 3, '10:00', '12:00', 15, 12, ARRAY[3,4,5,6,7,9]),
    (v_fp_id, 3, '14:00', '16:00', 15, 12, ARRAY[3,4,5,6,7,9]),
    -- 목(4): 4,5,6,7,9월
    (v_fp_id, 4, '10:00', '12:00', 15, 12, ARRAY[4,5,6,7,9]),
    -- 금(5): 9월
    (v_fp_id, 5, '10:00', '12:00', 15, 12, ARRAY[9]),
    (v_fp_id, 5, '14:00', '16:00', 15, 12, ARRAY[9]);
END $$;
