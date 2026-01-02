-- Create enums
CREATE TYPE role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE challenge_type AS ENUM ('quiz', 'coding', 'project');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE certificate_status AS ENUM ('pending', 'issued', 'revoked');
CREATE TYPE contest_status AS ENUM ('upcoming', 'active', 'completed');

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  icon_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  difficulty difficulty NOT NULL DEFAULT 'beginner',
  duration INTEGER,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  enrollment_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Lessons table
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  content_en TEXT,
  content_ar TEXT,
  video_url TEXT,
  duration INTEGER,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_lessons JSONB DEFAULT '[]',
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- Store Items table
CREATE TABLE store_items (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  points_cost INTEGER,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  type challenge_type NOT NULL,
  difficulty difficulty NOT NULL,
  points INTEGER NOT NULL,
  time_limit INTEGER,
  test_cases JSONB,
  solution TEXT,
  category_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Challenge Submissions table
CREATE TABLE challenge_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  code TEXT,
  result JSONB,
  score INTEGER,
  is_passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contests table
CREATE TABLE contests (
  id SERIAL PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  image_url TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status contest_status NOT NULL DEFAULT 'upcoming',
  prize_pool TEXT,
  max_participants INTEGER,
  participant_count INTEGER NOT NULL DEFAULT 0,
  rules JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Contest Participants table
CREATE TABLE contest_participants (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contest_id INTEGER NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

-- Certificates table
CREATE TABLE certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id),
  contest_id INTEGER REFERENCES contests(id),
  certificate_number VARCHAR(255) NOT NULL UNIQUE,
  title_en VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  status certificate_status NOT NULL DEFAULT 'issued',
  image_url TEXT,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_category_id ON courses(category_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_challenge_submissions_user_id ON challenge_submissions(user_id);
CREATE INDEX idx_challenge_submissions_challenge_id ON challenge_submissions(challenge_id);
CREATE INDEX idx_contest_participants_user_id ON contest_participants(user_id);
CREATE INDEX idx_contest_participants_contest_id ON contest_participants(contest_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
