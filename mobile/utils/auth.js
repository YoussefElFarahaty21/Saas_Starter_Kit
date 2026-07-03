import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'saas_access_token';
const REFRESH_TOKEN_KEY = 'saas_refresh_token';
const USER_KEY = 'saas_user';

export const getToken = async () => AsyncStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = async () => AsyncStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const removeTokens = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
};

export const getStoredUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredUser = async (user) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isTokenExpired = (token) => {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const isAuthenticated = async () => {
  const token = await getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

const PLAN_LEVELS = { free: 0, pro: 1, enterprise: 2 };

export const hasPlanAccess = async (requiredPlan) => {
  const user = await getStoredUser();
  const userPlan = user?.plan || 'free';
  return (PLAN_LEVELS[userPlan] ?? 0) >= (PLAN_LEVELS[requiredPlan] ?? 0);
};

export const isAdminUser = async () => {
  const user = await getStoredUser();
  return user?.role === 'admin' && (await hasPlanAccess('enterprise'));
};
