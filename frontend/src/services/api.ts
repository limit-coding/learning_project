import axios from 'axios';
import type {
  ChatRetrieveResponse,
  CourseNode,
  CourseNodeDetail,
  Resource,
  RoadmapResponse,
} from '../types';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
