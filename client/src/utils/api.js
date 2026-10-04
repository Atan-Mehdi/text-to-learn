import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ttl_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginApi = async (email, password) => {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
};

export const registerApi = async (name, email, password, avatarUrl) => {
  const res = await api.post('/api/auth/register', { name, email, password, avatarUrl });
  return res.data;
};

export const syncOAuthUserApi = async (name, email, avatarUrl, sub) => {
  const res = await api.post('/api/auth/oauth-sync', { name, email, avatarUrl, sub });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/api/auth/me');
  return res.data;
};

export const generateCourse = async (topic, creator) => {
  const res = await api.post('/api/courses/generate', { topic, creator });
  return res.data;
};

export const getCourse = async (courseId) => {
  const res = await api.get(`/api/courses/${courseId}`);
  return res.data;
};

export const getAllCourses = async (user) => {
  const res = await api.get('/api/courses', {
    params: user ? { user } : {},
  });
  return res.data;
};

export const deleteCourseApi = async (courseId) => {
  const res = await api.delete(`/api/courses/${courseId}`);
  return res.data;
};

export const getLesson = async (courseId, moduleId, lessonId) => {
  const res = await api.get(`/api/lessons/${courseId}/${moduleId}/${lessonId}`);
  return res.data;
};

export const getHinglishTranslation = async (lessonId) => {
  const res = await api.post(`/api/lessons/${lessonId}/translate/hinglish`);
  return res.data;
};

export const searchYouTubeVideo = async (query) => {
  const res = await api.get('/api/youtube/search', { params: { query } });
  return res.data;
};

export default api;
