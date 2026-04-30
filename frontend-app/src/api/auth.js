// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   timeout: 10000,
//   headers: { 'Content-Type': 'application/json' },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('access_token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.clear();
//       window.location.href = '/login';
//     }
//     const msg = err.response?.data?.error || 'Something went wrong.';
//     return Promise.reject(new Error(msg));
//   }
// );

// export const loginApi  = (user_id, password) =>
//   api.post('/api/auth/login/',  { user_id, password }).then(r => r.data);
// export const logoutApi = (refresh) =>
//   api.post('/api/auth/logout/', { refresh }).then(r => r.data);
// export const getMeApi  = () =>
//   api.get('/api/auth/me/').then(r => r.data);

// export default api;

import axios from 'axios'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const getMe = () => axios.get(`${API}/auth/me/`)