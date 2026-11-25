import { defineConfig } from 'prisma/config';

// Prisma 7 does not read .env files. DATABASE_URL comes from the environment
// (Compose, the VM's .env, or your shell). `prisma generate` works without it.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node dist/seed/run.js',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
