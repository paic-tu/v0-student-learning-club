
import fs from 'fs'
import path from 'path'
import bcrypt from "bcryptjs"

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      let val = parts.slice(1).join('=').trim()
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      }
      process.env[key] = val
    }
  })
}

// Dynamic imports inside async function
async function testAuthFlow() {
  const { db } = await import("@/lib/db")
  const { users } = await import("@/lib/db/schema")
  const { eq } = await import("drizzle-orm")

  console.log("Starting Authentication Flow Test...")

  const testUser = {
    name: "Test User",
    email: `test-auth-${Date.now()}@example.com`,
    password: "TestPassword123!",
  }

  console.log(`\n1. Testing Registration for ${testUser.email}...`)
  
  try {
    // Check if user exists (should not)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, testUser.email),
    })

    if (existingUser) {
      console.error("❌ User already exists before registration!")
      process.exit(1)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testUser.password, 10)
    
    // Insert user
    await db.insert(users).values({
      name: testUser.name,
      email: testUser.email,
      passwordHash: passwordHash,
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    console.log("✅ Registration successful (User inserted)")
  } catch (error) {
    console.error("❌ Registration Failed:", error)
    process.exit(1)
  }

  console.log("\n2. Testing Login...")
  
  try {
    // Fetch user
    const user = await db.query.users.findFirst({
      where: eq(users.email, testUser.email),
    })

    if (!user) {
      console.error("❌ Login Failed: User not found after registration")
      process.exit(1)
    }

    if (!user.passwordHash) {
      console.error("❌ Login Failed: User has no password hash")
      process.exit(1)
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(testUser.password, user.passwordHash)

    if (passwordsMatch) {
      console.log("✅ Login Successful: Password matches hash")
    } else {
      console.error("❌ Login Failed: Password mismatch")
      console.error(`Input: ${testUser.password}`)
      console.error(`Hash: ${user.passwordHash}`)
      process.exit(1)
    }

    // Cleanup (optional)
    console.log("\n3. Cleaning up test user...")
    await db.delete(users).where(eq(users.email, testUser.email))
    console.log("✅ Cleanup successful")

  } catch (error) {
    console.error("❌ Login Verification Failed:", error)
    process.exit(1)
  }

  console.log("\n🎉 All Authentication Tests Passed!")
}

testAuthFlow()
