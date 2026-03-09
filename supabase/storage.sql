-- =============================================
-- Supabase Storage 버킷 설정
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- (schema.sql 실행 후 이어서 실행)
-- =============================================

-- 'problems' 버킷 생성 (이미지 저장용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'problems',
  'problems',
  TRUE,                                    -- 공개 버킷 (이미지 URL 직접 접근 가능)
  10485760,                                -- 최대 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- 'solutions' 버킷 생성 (풀이 이미지 저장용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'solutions',
  'solutions',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 (본인만 업로드/삭제 가능, 모두 조회 가능)
CREATE POLICY "본인만 업로드 가능" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'problems' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "본인만 삭제 가능" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'problems' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "모두 조회 가능" ON storage.objects
  FOR SELECT USING (bucket_id = 'problems');

-- ✅ problems 버킷 UPDATE 정책 (upsert에 필요)
CREATE POLICY "본인만 problems 업데이트 가능" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'problems' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- solutions 버킷 정책
CREATE POLICY "본인만 solutions 업로드 가능" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'solutions' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "본인만 solutions 삭제 가능" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'solutions' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "solutions 모두 조회 가능" ON storage.objects
  FOR SELECT USING (bucket_id = 'solutions');

-- ✅ solutions 버킷 UPDATE 정책 (upsert에 필요 — handwriting.png 덮어쓰기)
CREATE POLICY "본인만 solutions 업데이트 가능" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'solutions' AND auth.uid()::text = (storage.foldername(name))[1]
  );
