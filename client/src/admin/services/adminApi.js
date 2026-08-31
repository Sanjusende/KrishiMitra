import axios from 'axios';
import toast from 'react-hot-toast';

const getAdminBaseURL = () => {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api/admin';
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace('/api/v1', '/api/admin');
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost')
  ) {
    return 'https://hackinmotion-ricr-him-1157-1.onrender.com/api/admin';
  }

  return 'https://hackinmotion-ricr-him-1157-1.onrender.com/api/admin';
};

const baseURL = getAdminBaseURL();

const adminApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor
adminApi.interceptors.request.use(
  (config) => {
    try {
      const session = JSON.parse(localStorage.getItem('krishimitra-admin-session'));
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (e) {
      // Ignore errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'An unexpected error occurred';

    // Handle token refresh
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const session = JSON.parse(localStorage.getItem('krishimitra-admin-session'));
        if (session?.refreshToken) {
          const refreshRes = await axios.post(`${baseURL}/auth/refresh-token`, {
            refreshToken: session.refreshToken,
          });

          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            const newAccessToken = refreshRes.data.data.accessToken;
            const newRefreshToken = refreshRes.data.data.refreshToken || session.refreshToken;

            const updatedSession = {
              ...session,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            };
            localStorage.setItem('krishimitra-admin-session', JSON.stringify(updatedSession));

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem('krishimitra-admin-session');
        window.location.href = '/admin/login';
      }
    }

    if (status === 401) {
      localStorage.removeItem('krishimitra-admin-session');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }

    // Flash error notifications globally (except for mute validation flows if any)
    if (status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default adminApi;
