import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  { email: 'alice@example.com', name: 'Alice', password: '1234' },
  { email: 'bob@example.com', name: 'Bob', password: '1234' },
  { email: 'carol@example.com', name: 'Carol', password: '1234' },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password: user.password },
      create: user,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
