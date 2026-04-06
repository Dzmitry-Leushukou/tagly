import axios from 'axios';

const USE_MOCK = false;

const API_AUTH = 'http://localhost:8000';
const API_POSTS = 'http://localhost:8002';
const API_DB = 'http://localhost:8001';

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

// Posts API
export const postsAPI = {
  getRecommendations: () => api.get(`${API_POSTS}/recommendations`),
  createPost: (content) => api.post(`${API_POSTS}/post`, { content }),
  sendFeedback: (post_id, feedback_type) => api.post(`${API_POSTS}/feedback`, { post_id, feedback_type }),
  getAllPosts: () => api.get(`${API_DB}/posts`),
  getUserPosts: () => api.get(`${API_DB}/posts`),
  getUserPostsByLogin: (login) => api.get(`${API_DB}/posts`),
  deletePost: (post_id) => api.delete(`${API_POSTS}/post/${post_id}`),
  updatePost: (post_id, content) => api.put(`${API_POSTS}/post/${post_id}`, { content }),
};

export const tagsAPI = {
  getAllTags: (limit = 50, offset = 0) => api.get(`${API_POSTS}/tags?limit=${limit}&offset=${offset}`),
  saveUserTags: (tagIds) => api.post(`${API_POSTS}/tags/favorite`, { tag_ids: tagIds }),
};

export const userAPI = {
  getUser: (login) => api.get(`${API_DB}/user/${login}`),
};

export default api;