import axios from 'axios';
import type { UserProfile, Recommendation } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createUserProfile = async (profile: UserProfile) => {
  const response = await api.post('/profiles', profile);
  return response.data;
};

export const getUserProfile = async (profileId: number) => {
  const response = await api.get(`/profiles/${profileId}`);
  return response.data;
};

export const getRecommendations = async (
  profileId: number,
  topN: number = 5,
  refresh: boolean = false
): Promise<Recommendation[]> => {
  const response = await api.get(`/recommendations/${profileId}`, {
    params: { top_n: topN, refresh }
  });
  return response.data;
};

export default api;
