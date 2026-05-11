import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("qwerty123", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "ADMIN",
    },
    create: {
      email: "admin@example.com",
      name: "ADMIN",
      passwordHash,
      role: "ADMIN",
    },
  });
  
  console.log("Seed data created successfully:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
