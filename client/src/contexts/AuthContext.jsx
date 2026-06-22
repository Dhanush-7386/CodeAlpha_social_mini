import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import socket from '../utils/socket';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('socialmini_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          socket.connect();
          socket.emit('user:online', res.data.data._id);
        } catch (err) {
          console.error('Auth init failed:', err);
          localStorage.removeItem('socialmini_token');
          localStorage.removeItem('socialmini_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const signup = useCallback(async (username, email, password) => {
    const res = await api.post('/auth/signup', { username, email, password });
    return res.data;
  }, []);

  const verifyOTP = useCallback(async (userId, otp) => {
    const res = await api.post('/auth/verify-otp', { userId, otp });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('socialmini_token', newToken);
    localStorage.setItem('socialmini_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    socket.connect();
    socket.emit('user:online', userData._id);
    return res.data;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  }, []);

  const verifyLoginOTP = useCallback(async (userId, otp) => {
    const res = await api.post('/auth/verify-login-otp', { userId, otp });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('socialmini_token', newToken);
    localStorage.setItem('socialmini_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    socket.connect();
    socket.emit('user:online', userData._id);
    return res.data;
  }, []);

  const resendOTP = useCallback(async (userId, purpose) => {
    const res = await api.post('/auth/resend-otp', { userId, purpose });
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('socialmini_token');
    localStorage.removeItem('socialmini_user');
    setToken(null);
    setUser(null);
    socket.disconnect();
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        verifyOTP,
        login,
        verifyLoginOTP,
        resendOTP,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
