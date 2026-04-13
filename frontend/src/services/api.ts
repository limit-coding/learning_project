import axios from 'axios';
import type {
  ChatRetrieveResponse,
  CourseNode,
  CourseNodeDetail,
  Recommendation,
  Resource,
  RoadmapResponse,
  UserProfile,
} from '../types';

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

export const generateRoadmap = async (
  goal: string,
  masteredSlugs: string[] = []
): Promise<RoadmapResponse> => {
  const response = await api.post('/roadmaps/generate', {
    goal,
    mastered_slugs: masteredSlugs,
  });
  return response.data;
};

export const getCourseNodes = async (): Promise<CourseNode[]> => {
  const response = await api.get('/course-nodes');
  return response.data;
};

export const getCourseNodeDetail = async (nodeId: number): Promise<CourseNodeDetail> => {
  const response = await api.get(`/course-nodes/${nodeId}`);
  return response.data;
};

export const getResources = async (params?: {
  course_node_id?: number;
  resource_type?: string;
  status?: string;
  skip?: number;
  limit?: number;
}): Promise<Resource[]> => {
  const response = await api.get('/resources', { params });
  return response.data;
};

export const chatRetrieve = async (question: string): Promise<ChatRetrieveResponse> => {
  const response = await api.post('/chat/retrieve', { question });
  return response.data;
};

export default api;
