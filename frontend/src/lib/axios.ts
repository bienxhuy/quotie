import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Store access token in memory
let accessToken: string | null = null;

/**
 * Set access token in memory
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  return accessToken;
}

// Request interceptor - add auth token if available
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing to avoid refresh loops
let isRefreshing = false;

// Queue for requests that arrive while refreshing
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process the queued requests after refresh completes
// This function is called in interceptor after refresh attempt
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor - handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  // Error handler
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 (unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint to avoid infinite loop
      if (originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      // Mark this request as already retried to prevent infinite loops
      originalRequest._retry = true;
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Update the request with the new token
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Try to refresh the access token
        const response = await axiosInstance.post("/api/auth/refresh");
        const newAccessToken = response.data.data.accessToken;

        // Update token in memory
        setAccessToken(newAccessToken);

        // Process queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token and process queue with error
        processQueue(refreshError as Error);
        setAccessToken(null);

        // Dispatch custom event for logout (AuthContext will handle it)
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;