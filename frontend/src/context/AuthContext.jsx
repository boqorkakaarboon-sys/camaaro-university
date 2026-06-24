import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('camaaro_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('camaaro_token');
    if (token) {
      authAPI
        .getMe()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('camaaro_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('camaaro_token');
          localStorage.removeItem('camaaro_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.requires2FA) {
        return { success: true, requires2FA: true, userId: res.data.userId };
      }
      const { token, user } = res.data;
      localStorage.setItem('camaaro_token', token);
      localStorage.setItem('camaaro_user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const verify2FA = useCallback(async (userId, code) => {
    setError(null);
    try {
      const res = await authAPI.verify2FA({ userId, code });
      const { token, user } = res.data;
      localStorage.setItem('camaaro_token', token);
      localStorage.setItem('camaaro_user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const res = await authAPI.register(formData);
      const { token, user } = res.data;
      localStorage.setItem('camaaro_token', token);
      localStorage.setItem('camaaro_user', JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('camaaro_token');
    localStorage.removeItem('camaaro_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('camaaro_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, verify2FA, register, logout, updateUser, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
