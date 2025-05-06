import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { loginUser, registerUser, loginWithGoogleService, getUserProfile } from '@/api/auth';
import { User } from '@/types/user';
import { storage } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for token on startup
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await storage.getItem('token');
        
        if (token) {
          try {
            // Validate token by getting user profile
            const userData = await getUserProfile(token);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            // Invalid token
            console.error('Invalid token:', error);
            await storage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const storeToken = async (token: string) => {
    try {
      await storage.setItem('token', token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { token, user: userData } = await loginUser(email, password);
      await storeToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const { token, user: userData } = await registerUser(username, email, password);
      await storeToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { token, user: userData } = await loginWithGoogleService();
      await storeToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await storage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the state even if storage removal fails
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        register, 
        loginWithGoogle, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};