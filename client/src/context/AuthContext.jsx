import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { loginApi, registerApi, syncOAuthUserApi, getMeApi } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const auth0 = useAuth0();

  const [localUser, setLocalUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('ttl_auth_token'));
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (auth0?.isAuthenticated && auth0?.user) {
      const name = auth0.user.name || auth0.user.nickname || auth0.user.email?.split('@')[0];
      const email = auth0.user.email;
      const avatarUrl = auth0.user.picture;
      const sub = auth0.user.sub;

      const oauthUser = {
        id: sub,
        name,
        email,
        avatarUrl,
        role: 'STUDENT',
        provider: 'AUTH0',
      };
      setLocalUser(oauthUser);
      localStorage.setItem('ttl_auth_user', JSON.stringify(oauthUser));

      if (email) {
        syncOAuthUserApi(name, email, avatarUrl, sub)
          .then((res) => {
            if (res?.token) {
              setToken(res.token);
              localStorage.setItem('ttl_auth_token', res.token);
            }
            if (res?.user) {
              setLocalUser(res.user);
              localStorage.setItem('ttl_auth_user', JSON.stringify(res.user));
            }
          })
          .catch((err) => console.warn('Could not sync OAuth user to backend DB:', err));
      }

      setLoading(false);
      return;
    }

    const initLocalAuth = async () => {
      const storedToken = localStorage.getItem('ttl_auth_token');
      const storedUser = localStorage.getItem('ttl_auth_user');

      if (storedUser) {
        try {
          setLocalUser(JSON.parse(storedUser));
        } catch {

        }
      }

      if (storedToken && !storedToken.startsWith('eyJ') && !storedToken.startsWith('oauth_token_')) {
        try {
          const userData = await getMeApi();
          setLocalUser(userData);
          localStorage.setItem('ttl_auth_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    if (!auth0?.isLoading) {
      initLocalAuth();
    }
  }, [auth0?.isAuthenticated, auth0?.user, auth0?.isLoading]);

  const activeUser = (auth0?.isAuthenticated && auth0?.user) ? {
    id: auth0.user.sub,
    name: auth0.user.name || auth0.user.nickname || auth0.user.email?.split('@')[0],
    email: auth0.user.email,
    avatarUrl: auth0.user.picture,
    role: 'STUDENT',
    provider: 'Auth0 / OAuth2',
  } : localUser;

  const loginWithOAuth = async (connection) => {
    try {
      if (auth0 && auth0.loginWithRedirect) {
        await auth0.loginWithRedirect({
          authorizationParams: connection ? { connection } : undefined,
        });
      }
    } catch (err) {
      console.warn('Auth0 redirect login error:', err);
    }
  };

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    setToken(data.token);
    setLocalUser(data.user);
    localStorage.setItem('ttl_auth_token', data.token);
    localStorage.setItem('ttl_auth_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const register = async (name, email, password, avatarUrl) => {
    const data = await registerApi(name, email, password, avatarUrl);
    setToken(data.token);
    setLocalUser(data.user);
    localStorage.setItem('ttl_auth_token', data.token);
    localStorage.setItem('ttl_auth_user', JSON.stringify(data.user));
    setIsAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    if (auth0?.isAuthenticated && auth0?.logout) {
      auth0.logout({ logoutParams: { returnTo: window.location.origin } });
    }
    setToken(null);
    setLocalUser(null);
    localStorage.removeItem('ttl_auth_token');
    localStorage.removeItem('ttl_auth_user');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        token,
        isAuthenticated: !!activeUser,
        loading: auth0?.isLoading || loading,
        loginWithOAuth,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
