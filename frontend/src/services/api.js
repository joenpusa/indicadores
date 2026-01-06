import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Important for handling cookies if used, or just for CORS if configured
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // Logout
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const { data } = await axios.post('http://localhost:4000/api/auth/refresh-token', { refreshToken });

                if (data.data && data.data.accessToken) {
                    localStorage.setItem('accessToken', data.data.accessToken);
                    if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);

                    api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;
                    return api(originalRequest);
                }
            } catch (err) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
