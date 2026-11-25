import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { seedDatabase } from './seed.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
try {
  const result = await seedDatabase(prisma);
  console.log(
    result.seeded
      ? 'Seeded the synthetic bank and 40 demo cases.'
      : 'The bank is already seeded; nothing to do.',
  );
  if (result.admin) console.log('Created the bootstrap admin.');
} finally {
  await prisma.$disconnect();
}
