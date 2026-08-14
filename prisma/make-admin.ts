import { PrismaClient } from "@prisma/client";

// Promote a user to admin:  npm run make-admin -- <username>
const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2]?.toLowerCase().replace(/^@/, "");
  if (!username) {
    console.error("Usage: npm run make-admin -- <username>");
    process.exit(1);
  }
  const user = await prisma.user
    .update({ where: { username }, data: { role: "admin" } })
    .catch(() => null);
  if (!user) {
    console.error(`❌ No user found with username @${username}`);
    process.exit(1);
  }
  console.log(`✅ @${user.username} is now an admin. Visit /admin to manage the platform.`);
}

main().finally(() => prisma.$disconnect());
