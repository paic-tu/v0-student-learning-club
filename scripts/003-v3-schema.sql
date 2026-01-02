-- V3 Schema: Cohorts, Mentorship, Labs, Notifications, Projects
-- Run this migration to add V3 tables

-- Create V3 Enums
CREATE TYPE cohort_status AS ENUM ('draft', 'open', 'running', 'ended');
CREATE TYPE cohort_member_role AS ENUM ('student', 'mentor', 'instructor');
CREATE TYPE cohort_member_status AS ENUM ('active', 'waitlist', 'removed');
CREATE TYPE schedule_type AS ENUM ('live', 'deadline', 'exam', 'workshop');
CREATE TYPE booking_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');
CREATE TYPE lab_difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');
CREATE TYPE submission_verdict AS ENUM ('correct', 'wrong');
CREATE TYPE notification_type AS ENUM ('order', 'certificate', 'cohort', 'booking', 'lab', 'project', 'system');
CREATE TYPE project_visibility AS ENUM ('private', 'public', 'club');
CREATE TYPE artifact_type AS ENUM ('link', 'file');

-- Cohorts System Tables
CREATE TABLE cohorts (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  thumbnail_url TEXT,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  status cohort_status NOT NULL DEFAULT 'draft',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cohort_courses (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cohort_members (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role cohort_member_role NOT NULL DEFAULT 'student',
  status cohort_member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(cohort_id, user_id)
);

CREATE TABLE cohort_schedule (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  type schedule_type NOT NULL,
  location_url TEXT,
  notes_en TEXT,
  notes_ar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cohort_announcements (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  body_en TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Mentorship System Tables
CREATE TABLE mentors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  bio_en TEXT,
  bio_ar TEXT,
  skills JSONB DEFAULT '[]',
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mentor_availability (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Riyadh',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  status booking_status NOT NULL DEFAULT 'requested',
  topic VARCHAR(255) NOT NULL,
  notes TEXT,
  meeting_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_reviews (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_en TEXT,
  feedback_ar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Cyber Labs System Tables
CREATE TABLE lab_tracks (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  thumbnail_url TEXT,
  level lab_difficulty NOT NULL DEFAULT 'easy',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE labs (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES lab_tracks(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  objective_en TEXT NOT NULL,
  objective_ar TEXT NOT NULL,
  steps_en TEXT NOT NULL,
  steps_ar TEXT NOT NULL,
  flag_hash VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  difficulty lab_difficulty NOT NULL DEFAULT 'easy',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_attempts (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INTEGER NOT NULL DEFAULT 0,
  attempts_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE lab_submissions (
  id SERIAL PRIMARY KEY,
  attempt_id INTEGER NOT NULL REFERENCES lab_attempts(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_flag_hash VARCHAR(255) NOT NULL,
  verdict submission_verdict NOT NULL
);

-- Notifications System Tables
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  body_en TEXT,
  body_ar TEXT,
  href VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  language VARCHAR(10) NOT NULL DEFAULT 'ar',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects & Portfolio System Tables
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  summary_en TEXT,
  summary_ar TEXT,
  tags JSONB DEFAULT '[]',
  visibility project_visibility NOT NULL DEFAULT 'private',
  cover_image_url TEXT,
  github_url TEXT,
  demo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_artifacts (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type artifact_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_reviews (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rubric_json JSONB,
  score INTEGER NOT NULL,
  feedback_en TEXT,
  feedback_ar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Indexes for V3 Tables
CREATE INDEX idx_cohorts_status ON cohorts(status);
CREATE INDEX idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX idx_cohort_schedule_cohort_id ON cohort_schedule(cohort_id);
CREATE INDEX idx_cohort_announcements_cohort_id ON cohort_announcements(cohort_id);

CREATE INDEX idx_mentors_user_id ON mentors(user_id);
CREATE INDEX idx_mentors_is_active ON mentors(is_active);
CREATE INDEX idx_bookings_mentor_id ON bookings(mentor_id);
CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_labs_track_id ON labs(track_id);
CREATE INDEX idx_labs_is_published ON labs(is_published);
CREATE INDEX idx_lab_attempts_lab_id ON lab_attempts(lab_id);
CREATE INDEX idx_lab_attempts_user_id ON lab_attempts(user_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_visibility ON projects(visibility);
CREATE INDEX idx_project_artifacts_project_id ON project_artifacts(project_id);
