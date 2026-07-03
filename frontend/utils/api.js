import config from '../config.js';
import {
  getToken,
  getRefreshToken,
  setTokens,
  setStoredUser,
  removeTokens,
  isTokenExpired,
  getStoredUser,
  toStoredUser,
} from './auth.js';

let refreshPromise = null;

export async function refreshAccessToken() {
  const storedRefresh = getRefreshToken();
  if (!storedRefresh) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${config.api_url}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        setTokens(data.accessToken, storedRefresh);
        if (data.user) setStoredUser(toStoredUser(data.user));
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** Refresh token and sync user profile/plan from the server. */
export async function syncUserSession() {
  const refreshed = await refreshAccessToken();
  if (!refreshed) return null;

  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${config.api_url}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getStoredUser();
    const data = await res.json();
    if (data.user) {
      setStoredUser(toStoredUser(data.user));
      return data.user;
    }
  } catch {
    // fall through
  }

  return getStoredUser();
}

export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${config.api_url}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // clear local state even if server call fails
    }
  }
  removeTokens();
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  let token = getToken();
  if (!token || isTokenExpired(token)) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error('Session expired');
    token = getToken();
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${config.api_url}${path}`, { ...options, headers });

  if (res.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error('Session expired');
    token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    res = await fetch(`${config.api_url}${path}`, { ...options, headers });
  }

  return res;
}
