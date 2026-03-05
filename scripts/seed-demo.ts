import fs from 'fs';
import path from 'path';

// 1. Load .env manually BEFORE importing db
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const firstEquals = line.indexOf('=');
    if (firstEquals !== -1) {
      const key = line.substring(0, firstEquals).trim();
      let value = line.substring(firstEquals + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

// 2. Now import db and schema using require to avoid hoisting
// We need to use require because import statements are hoisted to the top
const { db } = require('../lib/db');
const { courses, modules, lessons, users } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

const DEMO_USER_ID = 'db869be7-82e4-4d48-a699-1eaaa3fd863e';

async function seed() {
  console.log('Starting demo data seeding...');

  try {
    // 1. Verify User
    const user = await db.query.users.findFirst({
      where: eq(users.id, DEMO_USER_ID),
    });

    if (!user) {
      console.error(`User with ID ${DEMO_USER_ID} not found.`);
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);

    // 2. Create Course
    const [course] = await db.insert(courses).values({
      instructorId: user.id,
      titleEn: 'Oracle Database Mastery (Demo)',
      titleAr: 'احتراف قواعد بيانات أوراكل (تجريبي)',
      slug: 'oracle-database-mastery-demo',
      descriptionEn: 'A comprehensive demo course showcasing the new module structure.',
      descriptionAr: 'دورة تجريبية شاملة تستعرض هيكلة الأقسام الجديدة.',
      isPublished: true,
      price: '0',
    }).returning();

    console.log(`Created course: ${course.titleEn} (${course.id})`);

    // 3. Create Modules
    const moduleData = [
      { titleEn: 'Introduction', titleAr: 'مقدمة', orderIndex: 0 },
      { titleEn: 'SQL Fundamentals', titleAr: 'أساسيات SQL', orderIndex: 1 },
      { titleEn: 'Advanced Concepts', titleAr: 'مفاهيم متقدمة', orderIndex: 2 },
    ];

    const createdModules = [];
    for (const m of moduleData) {
      const [mod] = await db.insert(modules).values({
        courseId: course.id,
        titleEn: m.titleEn,
        titleAr: m.titleAr,
        orderIndex: m.orderIndex,
      }).returning();
      createdModules.push(mod);
      console.log(`Created module: ${mod.titleEn}`);
    }

    // 4. Create Lessons
    const lessonsData = [
      // Module 1: Introduction
      {
        moduleId: createdModules[0].id,
        titleEn: 'Welcome to the Course',
        titleAr: 'مرحباً بكم في الدورة',
        slug: 'welcome-demo',
        type: 'video',
        status: 'published',
        orderIndex: 0,
        isPreview: true,
      },
      {
        moduleId: createdModules[0].id,
        titleEn: 'Course Overview',
        titleAr: 'نظرة عامة على الدورة',
        slug: 'overview-demo',
        type: 'article',
        status: 'published',
        orderIndex: 1,
      },
      // Module 2: SQL Fundamentals
      {
        moduleId: createdModules[1].id,
        titleEn: 'SELECT Statement',
        titleAr: 'جملة SELECT',
        slug: 'select-statement-demo',
        type: 'video',
        status: 'published',
        orderIndex: 0,
      },
      {
        moduleId: createdModules[1].id,
        titleEn: 'WHERE Clause',
        titleAr: 'شرط WHERE',
        slug: 'where-clause-demo',
        type: 'video',
        status: 'published',
        orderIndex: 1,
      },
      // Module 3: Advanced Concepts
      {
        moduleId: createdModules[2].id,
        titleEn: 'Joins and Unions',
        titleAr: 'الربط والتوحيد',
        slug: 'joins-demo',
        type: 'video',
        status: 'draft',
        orderIndex: 0,
      },
    ];

    for (const l of lessonsData) {
      await db.insert(lessons).values({
        courseId: course.id,
        moduleId: l.moduleId,
        titleEn: l.titleEn,
        titleAr: l.titleAr,
        slug: l.slug,
        type: l.type as any,
        status: l.status,
        orderIndex: l.orderIndex,
        isPreview: l.isPreview || false,
      });
      console.log(`Created lesson: ${l.titleEn}`);
    }

    // 5. Create Uncategorized Lesson
    await db.insert(lessons).values({
      courseId: course.id,
      moduleId: null,
      titleEn: 'Bonus Lesson (Uncategorized)',
      titleAr: 'درس إضافي (غير مصنف)',
      slug: 'bonus-lesson-demo',
      type: 'video',
      status: 'published',
      orderIndex: 0,
    });
    console.log('Created uncategorized lesson');

    console.log('Demo data seeding completed successfully!');
    console.log(`You can now view the course at: /instructor/courses/${course.id}/edit`);

  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}

seed();
