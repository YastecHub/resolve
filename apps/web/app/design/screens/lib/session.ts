import { STAFF_SIGN_IN } from './staff-sign-in';

const DEV_KEY = 'resolve-dev-user';

export const ACCESS_LOGOUT_URL = '/cdn-cgi/access/logout';

export function getDevUser(): string | null {
  if (!STAFF_SIGN_IN || typeof window === 'undefined') return null;
  return window.localStorage.getItem(DEV_KEY);
}

export function setDevUser(identity: string) {
  if (STAFF_SIGN_IN && typeof window !== 'undefined') {
    window.localStorage.setItem(DEV_KEY, identity.trim());
  }
}

export function clearDevUser() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(DEV_KEY);
}
