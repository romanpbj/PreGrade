import { useState, useEffect } from 'react';
import { onAuthChange, logout } from '../firebase/auth.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getAuthToken = async () => {
    if (user) {
      try {
        return await user.getIdToken();
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    return null;
  };

  const getAuthHeaders = async () => {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const getFormDataHeaders = async () => {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    handleLogout,
    getAuthToken,
    getAuthHeaders,
    getFormDataHeaders
  };
};