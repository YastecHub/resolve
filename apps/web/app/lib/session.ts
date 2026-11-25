import { setAuthTokenGetter } from '@resolve/api-client';
import { STAFF_SIGN_IN } from './staff-sign-in';

const TOKEN_KEY = 'resolve-token';
const DEV_KEY = 'resolve-dev-user';

export const ACCESS_LOGOUT_URL = '/cdn-cgi/access/logout';

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(token: string) {
  storage()?.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  storage()?.removeItem(TOKEN_KEY);
}

// Every API request carries the token as a bearer header.
setAuthTokenGetter(getToken);

// Interim: until the auth endpoints ship, the staff ID marks a signed-in session
// for the sample data. Remove with the sample hooks when `signIn` is wired.
export function getDevUser(): string | null {
  if (!STAFF_SIGN_IN || typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(DEV_KEY);
}

export function setDevUser(identity: string) {
  if (STAFF_SIGN_IN && typeof window !== 'undefined') {
    window.sessionStorage.setItem(DEV_KEY, identity.trim());
  }
}

export function clearDevUser() {
  clearToken();
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(DEV_KEY);
}
