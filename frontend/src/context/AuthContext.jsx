import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));

  // On load, verify any stored token is still valid
  useEffect(() => {
    if (!tokenStore.get()) return;
    authApi
      .me()
      .then((res) => setAdmin(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    tokenStore.set(res.data.token);
    setAdmin(res.data.admin);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    tokenStore.clear();
    setAdmin(null);
  }, []);

  // Called when an admin request returns 401 (token expired)
  const expire = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout, expire }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
