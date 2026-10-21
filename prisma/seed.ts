import { PrismaClient, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const currencies = [
  { code: 'UAH', name: 'Ukrainian hryvnia', symbol: '₴' },
  { code: 'USD', name: 'US dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
];

const users = [
  { email: 'alice@example.com', name: 'Alice' },
  { email: 'bob@example.com', name: 'Bob' },
  { email: 'carol@example.com', name: 'Carol' },
];

async function main() {
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: { name: currency.name, symbol: currency.symbol },
      create: currency,
    });
  }

  const passwordHash = await argon2.hash('1234', { type: argon2.argon2id });

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash, status: UserStatus.ACTIVE },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
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
