import { setAuthTokenGetter } from '@resolve/api-client';

const TOKEN_KEY = 'resolve-token';

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
