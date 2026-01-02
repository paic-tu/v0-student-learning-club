-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role, bio) VALUES
('admin@neon.edu', '$2b$10$YourHashedPasswordHere', 'Admin User', 'admin', 'Platform Administrator'),
('instructor@neon.edu', '$2b$10$YourHashedPasswordHere', 'Dr. Ahmed Hassan', 'instructor', 'Expert instructor with 10+ years experience'),
('student@neon.edu', '$2b$10$YourHashedPasswordHere', 'Sarah Ahmed', 'student', 'Passionate learner');

-- Insert categories
INSERT INTO categories (name_en, name_ar, description_en, description_ar) VALUES
('Programming', 'البرمجة', 'Learn programming languages and frameworks', 'تعلم لغات البرمجة والأطر'),
('Data Science', 'علم البيانات', 'Master data analysis and machine learning', 'إتقان تحليل البيانات والتعلم الآلي'),
('Design', 'التصميم', 'UI/UX and graphic design courses', 'دورات تصميم واجهة المستخدم والرسوميات'),
('Business', 'الأعمال', 'Business and entrepreneurship skills', 'مهارات الأعمال وريادة الأعمال');

-- Insert sample courses
INSERT INTO courses (title_en, title_ar, description_en, description_ar, instructor_id, category_id, difficulty, duration, price, is_free, is_published, enrollment_count, rating) VALUES
('Introduction to Python', 'مقدمة في بايثون', 'Learn Python programming from scratch', 'تعلم برمجة بايثون من الصفر', 2, 1, 'beginner', 600, 0, true, true, 1250, 4.8),
('Web Development Bootcamp', 'معسكر تطوير الويب', 'Master modern web development', 'إتقان تطوير الويب الحديث', 2, 1, 'intermediate', 1800, 499.99, false, true, 856, 4.9),
('Data Science with R', 'علم البيانات مع R', 'Statistical analysis and data visualization', 'التحليل الإحصائي وتصور البيانات', 2, 2, 'advanced', 900, 299.99, false, true, 432, 4.7);

-- Insert sample lessons
INSERT INTO lessons (course_id, title_en, title_ar, content_en, content_ar, order_index, is_preview) VALUES
(1, 'Getting Started', 'البداية', 'Introduction to Python basics', 'مقدمة في أساسيات بايثون', 1, true),
(1, 'Variables and Data Types', 'المتغيرات وأنواع البيانات', 'Learn about Python data types', 'تعلم أنواع بيانات بايثون', 2, true),
(1, 'Control Flow', 'التحكم في التدفق', 'If statements and loops', 'جمل If والحلقات', 3, false);

-- Insert sample store items
INSERT INTO store_items (name_en, name_ar, description_en, description_ar, price, points_cost, stock, category_id, is_active) VALUES
('Neon T-Shirt', 'قميص نيون', 'Official Neon platform t-shirt', 'قميص منصة نيون الرسمي', 29.99, 500, 100, NULL, true),
('Programming Book Set', 'مجموعة كتب البرمجة', 'Essential programming books', 'كتب البرمجة الأساسية', 79.99, 1500, 50, 1, true),
('Laptop Stickers Pack', 'حزمة ملصقات اللابتوب', 'Cool coding stickers', 'ملصقات برمجة رائعة', 9.99, 200, 200, NULL, true);

-- Insert sample challenges
INSERT INTO challenges (title_en, title_ar, description_en, description_ar, type, difficulty, points, category_id, is_active) VALUES
('FizzBuzz Challenge', 'تحدي FizzBuzz', 'Write a program that prints FizzBuzz', 'اكتب برنامج يطبع FizzBuzz', 'coding', 'beginner', 10, 1, true),
('Binary Search', 'البحث الثنائي', 'Implement binary search algorithm', 'تنفيذ خوارزمية البحث الثنائي', 'coding', 'intermediate', 25, 1, true),
('React Quiz', 'اختبار React', 'Test your React knowledge', 'اختبر معرفتك في React', 'quiz', 'intermediate', 15, 1, true);

-- Insert sample contest
INSERT INTO contests (title_en, title_ar, description_en, description_ar, start_date, end_date, status, prize_pool, max_participants) VALUES
('Spring Coding Challenge 2024', 'تحدي البرمجة الربيعي 2024', 'Compete with the best coders', 'تنافس مع أفضل المبرمجين', NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days', 'upcoming', '10,000 SAR', 500);
