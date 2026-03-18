import {
  API_ORIGIN,
  OAUTH_FLOW_KEY,
  OAUTH_PROVIDER_KEY,
  OAUTH_RETURN_PATH_KEY
} from '../config/appConfig';

const oauthProviders = new Set(['google', 'linkedin', 'github']);

export const getOAuthUrl = (provider) => {
  // Prefer relative paths on same-origin deployments to avoid cross-origin/frame navigation issues.
  try {
    const targetOrigin = new URL(API_ORIGIN).origin;
    if (targetOrigin === window.location.origin) {
      return `/api/auth/${provider}`;
    }
  } catch (_) {
    // Fall back to absolute URL below.
  }

  return `${API_ORIGIN}/api/auth/${provider}`;
};

export const beginOAuthFlow = ({ provider, returnPath, flow = 'login' }) => {
  if (!oauthProviders.has(provider)) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  localStorage.setItem(OAUTH_RETURN_PATH_KEY, returnPath || window.location.pathname);
  localStorage.setItem(OAUTH_PROVIDER_KEY, provider);
  localStorage.setItem(OAUTH_FLOW_KEY, flow);

  window.location.assign(getOAuthUrl(provider));
};

export const clearOAuthContext = () => {
  localStorage.removeItem(OAUTH_RETURN_PATH_KEY);
  localStorage.removeItem(OAUTH_PROVIDER_KEY);
  localStorage.removeItem(OAUTH_FLOW_KEY);
};

export const getStoredReturnPath = (fallbackPath) => {
  return localStorage.getItem(OAUTH_RETURN_PATH_KEY) || fallbackPath;
};

export const parseOAuthCallback = (search) => {
  const params = new URLSearchParams(search);

  return {
    token: params.get('token'),
    oauthStatus: params.get('oauth'),
    oauthError: params.get('error'),
    provider: params.get('provider') || localStorage.getItem(OAUTH_PROVIDER_KEY)
  };
};

export const getOAuthErrorMessage = ({ provider, oauthError }) => {
  const providerLabel = provider || 'OAuth';

  if (!oauthError) {
    return `${providerLabel} authentication failed. Please try again.`;
  }

  if (oauthError === 'access_denied') {
    return `${providerLabel} sign-in was canceled.`;
  }

  if (oauthError === 'no_code') {
    return `${providerLabel} did not return an authorization code.`;
  }

  if (oauthError.includes('token')) {
    return `${providerLabel} token exchange failed. Please retry.`;
  }

  return `${providerLabel} authentication failed (${oauthError}).`;
};
