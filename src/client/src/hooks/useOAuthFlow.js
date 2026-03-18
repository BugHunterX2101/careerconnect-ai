import { useEffect, useMemo, useState } from 'react';
import { beginOAuthFlow, clearOAuthContext, getOAuthErrorMessage, getStoredReturnPath, parseOAuthCallback } from '../utils/oauth';
import { emitUserError, reportClientEvent, reportOAuthError } from '../utils/observability';

const initialState = {
  phase: 'idle',
  provider: '',
  message: ''
};

export const useOAuthFlow = ({ loginWithToken, navigate, fallbackPath }) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const { token, oauthStatus, oauthError, provider } = parseOAuthCallback(window.location.search);

    if (!oauthStatus && !oauthError && !token) {
      return;
    }

    const finish = () => {
      const targetPath = getStoredReturnPath(fallbackPath);
      clearOAuthContext();
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate(targetPath, { replace: true });
    };

    const handleOAuth = async () => {
      if (oauthError || oauthStatus === 'error') {
        const message = getOAuthErrorMessage({ provider, oauthError });
        setState({ phase: 'provider_denied', provider: provider || '', message });
        reportOAuthError(provider || 'unknown', oauthError || 'provider_error');
        emitUserError(message, 'oauth');
        return;
      }

      if (oauthStatus === 'success' && token) {
        setState({ phase: 'loading', provider: provider || '', message: 'Verifying account...' });

        const result = await loginWithToken(token);
        if (result.success) {
          setState({ phase: 'success', provider: provider || '', message: 'Authentication successful. Redirecting...' });
          reportClientEvent('oauth_success', { provider: provider || 'unknown' });
          finish();
          return;
        }

        const errorMessage = result.error || 'Invalid token received from provider.';
        setState({ phase: 'token_invalid', provider: provider || '', message: errorMessage });
        reportOAuthError(provider || 'unknown', 'token_invalid');
        emitUserError(errorMessage, 'oauth');
      }
    };

    handleOAuth();
  }, [fallbackPath, loginWithToken, navigate]);

  const startOAuth = (provider, flow = 'login') => {
    setState({ phase: 'loading', provider, message: `Redirecting to ${provider}...` });
    beginOAuthFlow({ provider, returnPath: fallbackPath || window.location.pathname, flow });
  };

  const retryOAuth = (provider) => startOAuth(provider, 'retry');

  const clearOAuthState = () => setState(initialState);

  const statusFlags = useMemo(() => ({
    isIdle: state.phase === 'idle',
    isLoading: state.phase === 'loading',
    isSuccess: state.phase === 'success',
    hasError: state.phase === 'provider_denied' || state.phase === 'token_invalid'
  }), [state.phase]);

  return {
    oauthState: state,
    statusFlags,
    startOAuth,
    retryOAuth,
    clearOAuthState
  };
};

export default useOAuthFlow;
