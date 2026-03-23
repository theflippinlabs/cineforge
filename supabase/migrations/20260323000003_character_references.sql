-- ─── Character References Storage ───────────────────────────────────────────
-- Bucket for character reference images uploaded by users.
-- Images are used as reference frames for fal.ai image-to-video generation.

INSERT INTO storage.buckets (id, name, public)
VALUES ('character-references', 'character-references', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder ({userId}/...)
CREATE POLICY "Users can upload character images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'character-references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (images are embedded in video prompts, need public URLs)
CREATE POLICY "Anyone can view character images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-references');

-- Users can delete their own images
CREATE POLICY "Users can delete their character images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'character-references'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
