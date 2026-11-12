-- Extend LessonProgress with lastPositionSeconds and durationSeconds
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "lastPositionSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "durationSeconds" DOUBLE PRECISION;

-- Extend DiscussionThread with lessonId relation and index
ALTER TABLE "DiscussionThread" ADD COLUMN IF NOT EXISTS "lessonId" TEXT;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DiscussionThread_lessonId_fkey'
    ) THEN
        ALTER TABLE "DiscussionThread" ADD CONSTRAINT "DiscussionThread_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "DiscussionThread_courseId_idx" ON "DiscussionThread"("courseId");
CREATE INDEX IF NOT EXISTS "DiscussionThread_courseId_lessonId_idx" ON "DiscussionThread"("courseId", "lessonId");
