import apiClient from '@/config/api';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  major?: string;
  year?: string;
  gpa?: number;
  credits_completed?: number;
  followers_count?: number;
  avatar?: string;
  bio?: string;
  phone?: string;
  display_gpa?: boolean;
  display_credits?: boolean;
  display_followers?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, first_name: string, last_name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('access');
      if (token) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/auth/user/');
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login/', {
        email,
        password,
      });
      const { access, refresh } = response.data;
      await SecureStore.setItemAsync('access', access);
      await SecureStore.setItemAsync('refresh', refresh);
      await refreshUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, first_name: string, last_name: string) => {
    try {
      const response = await apiClient.post('/auth/signup/', {
        email,
        password,
        first_name,
        last_name,
      });
      const { access, refresh } = response.data;
      await SecureStore.setItemAsync('access', access);
      await SecureStore.setItemAsync('refresh', refresh);
      await refreshUser();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('access');
      await SecureStore.deleteItemAsync('refresh');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await apiClient.patch('/auth/user/', userData);
      setUser(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
