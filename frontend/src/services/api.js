import axios from 'axios';

const API_AUTH = 'http://localhost:8000';
const API_POSTS = 'http://localhost:8002';

const api = axios.create();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      try {
        const response = await axios.post(`${API_AUTH}/refresh`, {
          refresh_token: refreshToken
        });
        localStorage.setItem('access_token', response.data.access_token);
        originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (login, password) => api.post(`${API_AUTH}/register`, { login, password }),
  login: (login, password) => api.post(`${API_AUTH}/auth`, { login, password }),
};

export const postsAPI = {
  getRecommendations: () => api.get(`${API_POSTS}/recommendations`),
  createPost: (content) => api.post(`${API_POSTS}/post`, { content }),
  sendFeedback: (post_id, feedback_type) => api.post(`${API_POSTS}/feedback`, { post_id, feedback_type }),
  getMyPosts: (limit = 20, offset = 0) => api.get(`${API_POSTS}/my-posts?limit=${limit}&offset=${offset}`),
  getUserPostsByLogin: (login, limit = 20, offset = 0) => api.get(`${API_POSTS}/user/${login}/posts?limit=${limit}&offset=${offset}`),
};

export const tagsAPI = {
  getAllTags: (limit = 50, offset = 0) => api.get(`${API_POSTS}/tags?limit=${limit}&offset=${offset}`),
  saveUserTags: (tagIds) => api.post(`${API_POSTS}/tags/favorite`, { tag_ids: tagIds }),
  getMyFavoriteTags: () => api.get(`${API_POSTS}/tags/my`),
};

export default api;