const ACCESS_TOKEN_KEY = 'saas_access_token';
const REFRESH_TOKEN_KEY = 'saas_refresh_token';
const USER_KEY = 'saas_user';

export const getToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const removeTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const decodeTokenPayload = (token) => {
  const [, payload] = token.split('.');
  return JSON.parse(atob(payload));
};

export const isTokenExpired = (token) => {
  try {
    const decoded = decodeTokenPayload(token);
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const needsOnboarding = () => {
  const user = getStoredUser();
  return user?.onboardingComplete === false;
};

export const getPostAuthRedirect = (user) =>
  user?.onboardingComplete === false ? '/onboarding' : '/dashboard';

export const toStoredUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
  role: user.role,
  onboardingComplete: user.onboardingComplete === false ? false : true,
  preferences: user.preferences || { theme: 'light' },
});

export const getUserPlan = () => {
  const user = getStoredUser();
  return user?.plan || 'free';
};

const PLAN_LEVELS = { free: 0, pro: 1, enterprise: 2 };

export const hasPlanAccess = (requiredPlan) => {
  const userPlan = getUserPlan();
  return (PLAN_LEVELS[userPlan] ?? 0) >= (PLAN_LEVELS[requiredPlan] ?? 0);
};

export const isAdminUser = () => {
  const user = getStoredUser();
  return user?.role === 'admin' && hasPlanAccess('enterprise');
};
