import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'dev-v0k3b7kd8zilyhi3.us.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'mnka0fzm3jfynCTBLyRNkVSSG5u7UebQ';

export function Auth0ProviderWrapper({ children }) {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
