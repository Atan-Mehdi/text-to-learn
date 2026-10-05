import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const rawDomain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-v0k3b7kd8zilyhi3.us.auth0.com';
const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
const clientId = (import.meta.env.VITE_AUTH0_CLIENT_ID || 'mnka0fzm3jfynCTBLyRNkVSSG5u7UebQ').trim();

export function Auth0ProviderWrapper({ children }) {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || window.location.pathname, { replace: true });
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}
