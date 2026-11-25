export const paths = {
  login: '/',
  status: '/status',
  dashboard: '/dashboard',
  cases: '/dashboard/cases',
  case: (id: string) => `/dashboard/cases/${id}`,
  audit: '/dashboard/audit',
  team: '/dashboard/team',
  settings: '/dashboard/settings',
} as const;
