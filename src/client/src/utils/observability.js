const EVENT_NAMESPACE = 'careerconnect';
const CLIENT_EVENT = `${EVENT_NAMESPACE}:client-event`;
const USER_ERROR_EVENT = `${EVENT_NAMESPACE}:user-error`;
const MAX_STORED_EVENTS = 50;

const sanitize = (value) => {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '');
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]));
  }

  return value;
};

const storeEvent = (event) => {
  try {
    const history = JSON.parse(localStorage.getItem('clientEventHistory') || '[]');
    history.unshift(event);
    localStorage.setItem('clientEventHistory', JSON.stringify(history.slice(0, MAX_STORED_EVENTS)));
  } catch (error) {
    // Ignore localStorage write failures.
  }
};

export const reportClientEvent = (type, payload = {}) => {
  const event = {
    type,
    payload: sanitize(payload),
    timestamp: new Date().toISOString()
  };

  storeEvent(event);
  window.dispatchEvent(new CustomEvent(CLIENT_EVENT, { detail: event }));

  if (import.meta.env.DEV) {
    console.info('[client-event]', event);
  }
};

export const reportApiError = (error, context = {}) => {
  reportClientEvent('api_error', {
    context,
    status: error?.response?.status,
    message: error?.message || 'Unknown API error',
    path: error?.config?.url
  });
};

export const reportOAuthError = (provider, reason) => {
  reportClientEvent('oauth_error', { provider, reason });
};

export const reportSocketEvent = (type, payload = {}) => {
  reportClientEvent(`socket_${type}`, payload);
};

export const emitUserError = (message, source = 'system') => {
  window.dispatchEvent(new CustomEvent(USER_ERROR_EVENT, {
    detail: {
      message,
      source,
      timestamp: new Date().toISOString()
    }
  }));
};

export const observabilityEvents = {
  CLIENT_EVENT,
  USER_ERROR_EVENT
};
