import axios from 'axios';

// Create basic axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to all requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor wrapper to handle 401s globally (optional but good idea)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If we get an Unauthorized status and it's not the login path...
    if (error.response && error.response.status === 401 && !window.location.pathname.includes('/login')) {
       // Only clear frontend token and redirect if it's explicitly stated by backend logic
       // Left to your actual app flow!
    }
    return Promise.reject(error);
  }
);

export default api;
