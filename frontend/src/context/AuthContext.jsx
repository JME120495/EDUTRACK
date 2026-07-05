import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('edutrack_token'));
  const [loading, setLoading] = useState(true);
  
  // Academic Year State
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  
  const { i18n } = useTranslation();

  useEffect(() => {
    if (token) {
      try {
        // Decode simple JWT payload (role, name, email, etc.)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        setUser(decoded);
        
        // Sync language
        if (decoded.language) {
          i18n.changeLanguage(decoded.language.toLowerCase());
        }
        
        // Fetch academic years globally after user is decoded
        apiFetch('/annees').then(years => {
          setAcademicYears(years);
          const savedYearId = localStorage.getItem('edutrack_selected_year_id');
          if (savedYearId) {
            const found = years.find(y => y.id === savedYearId);
            if (found) {
              setSelectedYear(found);
              return;
            }
          }
          const active = years.find(y => y.active) || years[0];
          if (active) {
            setSelectedYear(active);
            localStorage.setItem('edutrack_selected_year_id', active.id);
          }
        }).catch(err => console.error("Failed to load academic years:", err));
        
      } catch (err) {
        console.error('Failed to parse token:', err);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('edutrack_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('edutrack_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password, schoolId = null) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password, schoolId }
    });
    
    if (data.action === 'SELECT_SCHOOL') {
      return data;
    }

    localStorage.setItem('edutrack_token', data.token);
    setToken(data.token);
    return data.user;
  };

  const register = async (payload) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: payload
    });
    // No token is returned yet, user must verify email.
    return data;
  };

  const forgotPassword = async (email) => {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  };

  const resetPassword = async (email, code, newPassword) => {
    return await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword }
    });
  };

  const loginParentOtp = async (phone, otpCode, schoolId = null) => {
    const data = await apiFetch('/auth/parent/verify-otp', {
      method: 'POST',
      body: { phone, code: otpCode, schoolId }
    });
    localStorage.setItem('edutrack_token', data.token);
    setToken(data.token);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('edutrack_token');
    setToken(null);
    setUser(null);
  };

  const updateLanguage = async (lang) => {
    if (user) {
      try {
        await apiFetch('/schools/settings', {
          method: 'PUT',
          body: { defaultLanguage: lang }
        });
      } catch (e) {
        console.error('Failed to sync language with server:', e);
      }
      const updatedUser = { ...user, language: lang };
      setUser(updatedUser);
    }
    i18n.changeLanguage(lang.toLowerCase());
  };

  const changeAcademicYear = (year) => {
    setSelectedYear(year);
    localStorage.setItem('edutrack_selected_year_id', year.id);
    // Force reload window to refetch all dashboard components with the new header
    window.location.reload();
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        loginParentOtp,
        logout,
        isAuthenticated,
        updateLanguage,
        academicYears,
        selectedYear,
        changeAcademicYear
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
