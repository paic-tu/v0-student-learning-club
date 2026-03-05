import fs from 'fs';
import path from 'path';

// 1. Load .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    const firstEquals = line.indexOf('=');
    if (firstEquals !== -1) {
      const key = line.substring(0, firstEquals).trim();
      let value = line.substring(firstEquals + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

const { db } = require('../lib/db');
const { users } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

const DEMO_USER_ID = 'db869be7-82e4-4d48-a699-1eaaa3fd863e';

async function upgrade() {
  console.log('Checking user role...');
  const user = await db.query.users.findFirst({
    where: eq(users.id, DEMO_USER_ID),
  });

  if (user) {
    console.log(`Current role: ${user.role}`);
    if (user.role !== 'instructor' && user.role !== 'admin') {
      await db.update(users).set({ role: 'instructor' }).where(eq(users.id, DEMO_USER_ID));
      console.log('Upgraded user to instructor.');
    } else {
      console.log('User is already instructor/admin.');
    }
  } else {
    console.log('User not found.');
  }
}

upgrade();
