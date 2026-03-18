const defaultApiOrigin = 'http://localhost:3000';

const envApi = import.meta.env.VITE_API_URL || defaultApiOrigin;
const normalizedApiOrigin = envApi.endsWith('/api') ? envApi.slice(0, -4) : envApi;

export const API_ORIGIN = normalizedApiOrigin;
export const API_BASE_URL = `${normalizedApiOrigin}/api`;

export const OAUTH_RETURN_PATH_KEY = 'preOAuthUrl';
export const OAUTH_PROVIDER_KEY = 'oauthProvider';
export const OAUTH_FLOW_KEY = 'oauthFlow';
