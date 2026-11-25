import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/design.tsx'),
  route('brand', 'routes/brand.tsx'),
  route('tokens', 'routes/dev.tokens.tsx'),
  route('icons', 'routes/dev.icons.tsx'),
] satisfies RouteConfig;
