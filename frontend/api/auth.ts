import axios from 'axios';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { storage } from '@/utils/storage';

// Get base API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
const authAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
authAPI.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await authAPI.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (username: string, email: string, password: string) => {
  try {
    const response = await authAPI.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const getUserProfile = async (token: string) => {
  try {
    const response = await authAPI.get('/auth/me');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get user profile');
  }
};

export const loginWithGoogleService = async () => {
  try {
    // This is a simplified example - in a real app, you would implement proper OAuth flow
    // using expo-auth-session with redirects
    
    // For demo purposes, we'll just simulate a successful login
    // In a real app, you would redirect to Google's OAuth page, get the authorization code,
    // then exchange it for tokens on your backend
    
    // Simulate API response
    const mockResponse = {
      token: 'mock-google-token',
      user: {
        _id: 'google-user-id',
        username: 'Google User',
        email: 'google-user@example.com',
      },
    };
    
    return mockResponse;
  } catch (error: any) {
    throw new Error('Google login failed');
  }
};

export const logoutUser = async () => {
  // Just remove the token from storage - no need to call the server
  await storage.removeItem('token');
};