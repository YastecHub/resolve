import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/welcome.tsx'),
  route('login', 'routes/login.tsx'),
  route('dashboard', 'routes/dashboard.tsx', [
    index('routes/dashboard._index.tsx'),
    route('cases', 'routes/dashboard.cases.tsx'),
    route('cases/:id', 'routes/dashboard.cases.$id.tsx'),
    route('settings', 'routes/dashboard.settings.tsx'),
    route('*', 'routes/dashboard.not-found.tsx'),
  ]),
  route('design', 'routes/design.tsx'),
  route('design/screens/login', 'design/screens/login.tsx'),
  route('design/screens', 'design/screens/shell.tsx', [
    index('design/screens/overview.tsx'),
    route('cases', 'design/screens/cases.tsx'),
    route('cases/:id', 'design/screens/case-detail.tsx'),
    route('audit', 'design/screens/audit.tsx'),
    route('team', 'design/screens/team.tsx'),
    route('settings', 'design/screens/settings.tsx'),
    route('*', 'design/screens/not-found.tsx'),
  ]),
  route('brand', 'routes/brand.tsx'),
  route('tokens', 'routes/dev.tokens.tsx'),
  route('icons', 'routes/dev.icons.tsx'),
] satisfies RouteConfig;
