import React, { createContext, useContext, useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and check current admin session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = localStorage.getItem('krishimitra-admin-session');
        if (session) {
          const res = await adminApi.get('/auth/me');
          if (res.data?.success && res.data?.data?.admin) {
            setAdmin(res.data.data.admin);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('krishimitra-admin-session');
          }
        }
      } catch (err) {
        localStorage.removeItem('krishimitra-admin-session');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  /**
   * Login handler
   */
  const login = async (email, password) => {
    setLoading(true);
    const toastId = toast.loading('Authenticating admin session...');
    try {
      const res = await adminApi.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { admin: adminData, accessToken, refreshToken } = res.data.data;
        setAdmin(adminData);
        setIsAuthenticated(true);
        localStorage.setItem(
          'krishimitra-admin-session',
          JSON.stringify({ accessToken, refreshToken })
        );
        toast.success(res.data.message || 'Authenticated successfully!', { id: toastId });
        return true;
      }
      toast.error('Authentication failed', { id: toastId });
      return false;
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Invalid admin credentials';
      toast.error(errMsg, { id: toastId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    const toastId = toast.loading('De-authenticating session...');
    try {
      const session = JSON.parse(localStorage.getItem('krishimitra-admin-session') || '{}');
      await adminApi.post('/auth/logout', { refreshToken: session.refreshToken });
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('krishimitra-admin-session');
      setAdmin(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully', { id: toastId });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
