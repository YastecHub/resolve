import { defineConfig } from 'orval';

export default defineConfig({
  resolve: {
    input: { target: '../../apps/api/openapi.json' },
    output: {
      mode: 'tags-split',
      client: 'react-query',
      httpClient: 'fetch',
      target: 'src/generated/endpoints',
      schemas: 'src/generated/model',
      clean: true,
      override: {
        mutator: { path: 'src/fetcher.ts', name: 'apiFetch' },
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
});
