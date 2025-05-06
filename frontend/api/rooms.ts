import axios from 'axios';
import { storage } from '@/utils/storage';

// Get base API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
const roomsAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
roomsAPI.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const createRoom = async (roomData: { name: string; videoUrl: string; isLocked: boolean }) => {
  try {
    const response = await roomsAPI.post('/rooms', roomData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create room');
  }
};

export const joinRoomById = async (roomId: string) => {
  try {
    const response = await roomsAPI.post(`/rooms/${roomId}/join`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to join room');
  }
};

export const getRoomById = async (roomId: string) => {
  try {
    const response = await roomsAPI.get(`/rooms/${roomId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get room');
  }
};

export const fetchRecentRooms = async () => {
  try {
    const response = await roomsAPI.get('/rooms/recent');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch recent rooms');
  }
};

export const fetchActiveRooms = async () => {
  try {
    const response = await roomsAPI.get('/rooms/active');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch active rooms');
  }
};

export const leaveRoom = async (roomId: string) => {
  try {
    const response = await roomsAPI.post(`/rooms/${roomId}/leave`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to leave room');
  }
};