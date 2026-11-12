-- Extend Course model with hasCertificate, totalHours, and completionCriteria
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "hasCertificate" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "totalHours" DECIMAL(6, 2) NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "completionCriteria" TEXT NOT NULL DEFAULT 'Complete all lessons and knowledge checks to earn your certificate.';
