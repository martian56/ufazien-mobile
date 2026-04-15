// Authentication Context
import apiClient from '@/config/api';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Complete auth session for Google OAuth
WebBrowser.maybeCompleteAuthSession();

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
  loginWithGoogle: () => Promise<void>;
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

  // Check if user is authenticated on mount
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
      // Handle field-level validation errors from backend
      const errorMessage =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {})
          .flat()
          .join(', ') ||
        'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Get Google Client ID from environment or use default
      const GOOGLE_CLIENT_ID =
        Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID ||
        '530556195061-i1018on0ojagk1n3s7h8d8283rmou9er.apps.googleusercontent.com';

      // Use discovery document for Google
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Check if running in Expo Go (development) or production build
      const isExpoGo = Constants.executionEnvironment === 'storeClient';

      // For Android, use the redirect URI that matches Google Console
      // Google Console package name: com.ufazien
      // The redirect URI must be: com.ufazien:/oauth
      const androidRedirectUri =
        Constants.expoConfig?.extra?.GOOGLE_REDIRECT_URI || 'com.ufazien:/oauth';
      const scheme = Constants.expoConfig?.scheme || 'com.ufazien';

      // Generate redirect URI
      // For Expo Go: Use proxy redirect (works without native build)
      // For production: Use native redirect URI
      let redirectUri: string;
      if (isExpoGo) {
        // Expo Go doesn't support custom intent filters
        // Use Expo's proxy redirect which works in Expo Go
        // makeRedirectUri() automatically uses proxy in Expo Go
        redirectUri = AuthSession.makeRedirectUri();
        console.log('📱 Using Expo Go - Proxy redirect URI');
        console.log('📱 Note: For Expo Go, you need to use a Web OAuth client in Google Console');
        console.log('📱', redirectUri);
      } else if (Platform.OS === 'android') {
        // Production build: Use the exact redirect URI from Google Console
        // Must match the intent filter scheme: com.ufazien:/oauth
        redirectUri = androidRedirectUri;
        console.log('📱 Using Production build - Native redirect URI:', redirectUri);
      } else {
        // iOS: Generate using the app scheme
        redirectUri = AuthSession.makeRedirectUri({
          native: `${scheme}:/oauth`,
        });
        console.log('📱 Using iOS - Native redirect URI:', redirectUri);
      }

      // Verify the redirect URI can be handled (only for native builds)
      if (!isExpoGo && Platform.OS === 'android') {
        let canHandleUrl = false;
        try {
          canHandleUrl = await Linking.canOpenURL(redirectUri);
        } catch (error) {
          console.log('Error checking if URL can be opened:', error);
        }

        if (!canHandleUrl) {
          console.warn(
            "⚠️ App cannot handle redirect URI yet. This is normal if app hasn't been rebuilt.",
          );
          console.warn('⚠️ You MUST rebuild the app for intent filters to work:');
          console.warn('⚠️ Run: npx expo prebuild --clean && npx expo run:android');
          console.warn('⚠️ OR: eas build --platform android --profile development');
        }
      }

      console.log('Google OAuth Redirect URI:', redirectUri);
      console.log('Platform:', Platform.OS);
      console.log('Is Expo Go:', isExpoGo);

      // Request configuration with PKCE enabled (default for authorization code flow)
      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        usePKCE: true, // Explicitly enable PKCE for security
        extraParams: {},
      });

      // Get code_verifier before calling promptAsync
      // expo-auth-session generates this automatically when usePKCE is true
      const codeVerifier = request.codeVerifier;

      console.log('🔐 PKCE enabled:', {
        hasCodeVerifier: !!codeVerifier,
        codeVerifierLength: codeVerifier?.length,
      });

      // Start authentication
      // showInRecents: true keeps the browser in recents for better UX
      // The redirect will be handled automatically by expo-auth-session
      const result = await request.promptAsync(discovery, {
        showInRecents: true,
      });

      if (result.type === 'success') {
        const { code } = result.params;

        console.log('🔍 OAuth Result:', {
          type: result.type,
          hasCode: !!code,
          codeLength: code?.length,
          hasCodeVerifier: !!codeVerifier,
          redirectUri,
          params: Object.keys(result.params),
        });

        // Send authorization code and code_verifier to backend
        // Backend needs code_verifier when using PKCE flow
        const requestPayload: { code: string; code_verifier?: string } = {
          code,
        };

        // Include code_verifier if available (required for PKCE)
        if (codeVerifier) {
          requestPayload.code_verifier = codeVerifier;
        }

        console.log('📤 Sending to backend:', {
          endpoint: '/auth/google/login/',
          payload: {
            ...requestPayload,
            code: code ? `${code.substring(0, 20)}...` : 'MISSING', // Log partial code for debugging
            code_verifier: codeVerifier ? `${codeVerifier.substring(0, 20)}...` : 'MISSING', // Log partial code_verifier for debugging
          },
        });

        const response = await apiClient.post('/auth/google/login/', requestPayload);

        console.log('✅ Backend response received:', {
          hasAccess: !!response.data?.access,
          hasRefresh: !!response.data?.refresh,
        });

        const { access, refresh } = response.data;
        await SecureStore.setItemAsync('access', access);
        await SecureStore.setItemAsync('refresh', refresh);
        await refreshUser();
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Google sign-in failed');
      } else {
        // User cancelled - don't throw error, just return
        return;
      }
    } catch (error: any) {
      if (error.message === 'Sign-in cancelled' || error.type === 'cancel') {
        return; // User cancelled, don't show error
      }

      // Enhanced error logging for debugging
      console.error('❌ Google login error:', {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        requestConfig: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
        },
      });

      throw new Error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'Google sign-in failed',
      );
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
        loginWithGoogle,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
