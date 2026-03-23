-- ─── Assembled Videos Storage ────────────────────────────────────────────────
-- Bucket for final MP4s assembled by ffmpeg.wasm in the browser.
-- Files are uploaded from the frontend after concatenation.

INSERT INTO storage.buckets (id, name, public)
VALUES ('assembled-videos', 'assembled-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder ({userId}/...)
CREATE POLICY "Users can upload assembled videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assembled-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read — videos are embedded in the project detail page
CREATE POLICY "Anyone can view assembled videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assembled-videos');

-- Users can delete their own videos
CREATE POLICY "Users can delete their assembled videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assembled-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
