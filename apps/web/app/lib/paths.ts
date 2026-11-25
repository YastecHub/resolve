const BASE = '/design/screens';

export const paths = {
  login: `${BASE}/login`,
  dashboard: BASE,
  cases: `${BASE}/cases`,
  case: (id: string) => `${BASE}/cases/${id}`,
  audit: `${BASE}/audit`,
  team: `${BASE}/team`,
  settings: `${BASE}/settings`,
} as const;
