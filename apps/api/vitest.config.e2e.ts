import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // The suites share one database and one queue.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? 'postgres://resolve:resolve@127.0.0.1:5432/resolve_test',
      REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://127.0.0.1:6379/1',
      AUTH_SECRET: 'e2e-secret',
      CASE_FILES_DIR: './.e2e-case-files',
      AI_PROFILES:
        '[{"name":"hosted","label":"Hosted","kind":"hosted","baseUrl":"https://models.example/v1","model":"fake-model"},{"name":"onprem","label":"On-premise","kind":"onprem","baseUrl":"http://ollama:11434/v1","model":"qwen3"}]',
      AI_ACTIVE_PROFILE: 'hosted',
    },
  },
});
