import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error ||
      (err.request ? 'No response from server.' : err.message) ||
      'Something went wrong.';
    return Promise.reject(new Error(msg));
  }
);

export const checkSuperAdmin  = () =>
  api.get('/api/superadmin/check/').then(r => r.data);

export const createSuperAdmin = (name, password) =>
  api.post('/api/superadmin/create/', { name, password, confirm_password: password }).then(r => r.data);