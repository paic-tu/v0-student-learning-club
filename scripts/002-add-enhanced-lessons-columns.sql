-- Migration: Add enhanced columns to lessons table for admin panel
-- Run this migration to add the new columns needed by the admin panel

-- Add new columns to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'video',
ADD COLUMN IF NOT EXISTS content_markdown TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS free_preview BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create tracks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description_en TEXT,
  description_ar TEXT,
  thumbnail_url TEXT,
  difficulty VARCHAR(50) DEFAULT 'beginner',
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Add track_id to lessons after tracks table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'track_id'
  ) THEN
    ALTER TABLE lessons ADD COLUMN track_id INTEGER REFERENCES tracks(id);
  END IF;
END $$;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id INTEGER,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create coupons table if it doesn't exist
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_to_products JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions table if it doesn't exist  
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing lessons to have slug based on title
UPDATE lessons 
SET slug = LOWER(REGEXP_REPLACE(title_en, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Update existing lessons to copy is_preview to free_preview
UPDATE lessons 
SET free_preview = is_preview
WHERE free_preview IS NULL;

-- Update existing lessons to copy duration to duration_minutes
UPDATE lessons 
SET duration_minutes = duration
WHERE duration_minutes IS NULL AND duration IS NOT NULL;

-- Set status based on course publish status
UPDATE lessons l
SET status = CASE 
  WHEN c.is_published = true THEN 'published'
  ELSE 'draft'
END
FROM courses c
WHERE l.course_id = c.id AND l.status IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_lessons_deleted_at ON lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
