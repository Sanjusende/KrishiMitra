import axios from 'axios';

const getBaseURL = () => {
  // If running in browser on localhost, force local backend URL so local fixes are used
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api/v1';
  }

  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;

  // If running in browser and on Vercel or any live host, force Render backend URL
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') || window.location.hostname !== 'localhost')
  ) {
    return 'https://hackinmotion-ricr-him-1157-1.onrender.com/api/v1';
  }

  return envUrl || 'https://hackinmotion-ricr-him-1157-1.onrender.com/api/v1';
};

const baseURL = getBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach authorization token automatically
api.interceptors.request.use(
  (config) => {
    try {
      const sessionData = JSON.parse(localStorage.getItem('krishimitra-session'));
      const token = sessionData?.accessToken || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error & token refresh handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    let message = 'An unexpected error occurred';

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        message = 'Connection timed out. Please check your internet speed and try again.';
      } else {
        message = 'Unable to connect to the server. Please check your internet connection and try again.';
      }
    } else {
      message =
        error.response.data?.message ||
        error.response.data?.error ||
        'An unexpected error occurred';
    }

    // Automatic token refresh retry for 401 Unauthorized
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const sessionData = JSON.parse(localStorage.getItem('krishimitra-session'));
        if (sessionData?.refreshToken) {
          const refreshRes = await axios.post(`${baseURL}/auth/refresh-token`, {
            refreshToken: sessionData.refreshToken,
          });

          if (refreshRes.data?.success && refreshRes.data?.data?.accessToken) {
            const newAccessToken = refreshRes.data.data.accessToken;
            const newRefreshToken = refreshRes.data.data.refreshToken || sessionData.refreshToken;

            const updatedSession = {
              ...sessionData,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            };
            localStorage.setItem('krishimitra-session', JSON.stringify(updatedSession));
            localStorage.setItem('token', newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem('krishimitra-session');
        localStorage.removeItem('token');
      }
    }

    if (status === 401) {
      localStorage.removeItem('krishimitra-session');
      localStorage.removeItem('token');
    }

    error.message = message;
    console.error(`API Error [${status || 'NETWORK_ERROR'}]:`, message);
    return Promise.reject(error);
  }
);

export default api;
