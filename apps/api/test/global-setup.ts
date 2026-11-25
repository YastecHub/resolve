import { execSync } from 'node:child_process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

/** Recreates the test schema from the migrations once per run. */
export default async function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? 'postgres://resolve:resolve@127.0.0.1:5432/resolve_test';
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  await prisma.$disconnect();
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'ignore',
  });
}
