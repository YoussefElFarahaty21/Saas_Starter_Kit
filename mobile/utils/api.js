import config from '../config.json';
import {
  getToken,
  getRefreshToken,
  setTokens,
  setStoredUser,
  removeTokens,
  isTokenExpired,
  getStoredUser,
} from './auth.js';

let refreshPromise = null;

export async function refreshAccessToken() {
  const storedRefresh = await getRefreshToken();
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
        await setTokens(data.accessToken, storedRefresh);
        if (data.user) await setStoredUser(data.user);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function syncUserSession() {
  const refreshed = await refreshAccessToken();
  if (!refreshed) return null;

  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${config.api_url}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return getStoredUser();
    const data = await res.json();
    if (data.user) {
      await setStoredUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        plan: data.user.plan,
        role: data.user.role,
      });
      return data.user;
    }
  } catch {
    // fall through
  }

  return getStoredUser();
}

export async function logout() {
  const token = await getToken();
  if (token) {
    try {
      await fetch(`${config.api_url}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  }
  await removeTokens();
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  let token = await getToken();
  if (!token || isTokenExpired(token)) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error('Session expired');
    token = await getToken();
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${config.api_url}${path}`, { ...options, headers });

  if (res.status === 401) {
    const ok = await refreshAccessToken();
    if (!ok) throw new Error('Session expired');
    token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    res = await fetch(`${config.api_url}${path}`, { ...options, headers });
  }

  return res;
}
