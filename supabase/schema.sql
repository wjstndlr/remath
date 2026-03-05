-- =============================================
-- 수학 오답노트 — Supabase DB 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- =============================================

-- 1. 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject       TEXT NOT NULL CHECK (subject IN ('수학1', '수학2', '미적분', '확통', '기하')),
  unit_tags     TEXT[] DEFAULT '{}',
  image_url     TEXT NOT NULL,
  memo          TEXT,
  -- (선택) 풀이 이미지 URL
  solution_url  TEXT,
  status        TEXT DEFAULT 'saved' CHECK (status IN ('saved', 'review', 'mastered')),
  importance    INT DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  solve_count   INT DEFAULT 0,
  last_tried_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. 유저 프로필 테이블 (Pro 구독 상태 관리)
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email               TEXT,
  is_pro              BOOLEAN DEFAULT FALSE,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 3. 회원가입 시 자동으로 프로필 생성하는 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS problems_updated_at ON problems;
CREATE TRIGGER problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Row Level Security 설정 (본인 데이터만 접근 가능)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- problems 정책
CREATE POLICY "본인 문제만 조회" ON problems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 문제만 등록" ON problems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 문제만 수정" ON problems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 문제만 삭제" ON problems FOR DELETE USING (auth.uid() = user_id);

-- profiles 정책
CREATE POLICY "본인 프로필만 조회" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필만 수정" ON profiles FOR UPDATE USING (auth.uid() = id);
