import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { config } from '../config/env';
import {
  getErrorInfo,
  isAuthenticationError,
  handleAuthenticationError,
  logError,
  type ErrorInfo,
} from '../utils/errorHandling';

// Create base Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session authentication
});

// Store toast callback (will be set by ToastContext)
let showToastCallback:
  | ((message: string, type: 'success' | 'error' | 'info' | 'warning') => void)
  | null = null;

/**
 * Register toast callback for displaying error messages
 * This is called by ToastContext on initialization
 */
export function registerToastCallback(
  callback: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void
): void {
  showToastCallback = callback;
}

/**
 * Show error toast if callback is registered
 */
function showErrorToast(message: string): void {
  if (showToastCallback) {
    showToastCallback(message, 'error');
  }
}

function isAuthRoute(url?: string): boolean {
  if (!url) {
    return false;
  }
  return (
    url.includes('/auth/login/') ||
    url.includes('/auth/me/') ||
    url.includes('/auth/csrf/') ||
    url.includes('/auth/logout/')
  );
}

// Request interceptor for adding auth headers
apiClient.interceptors.request.use(
  config => {
    // Add CSRF token if available
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken && config.headers) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    // Get structured error information
    const errorInfo: ErrorInfo = getErrorInfo(error);

    // Log error with context
    logError(error, 'API Request');

    // Let auth flows handle their own errors (inline/login UX), avoid toast spam.
    if (isAuthRoute(error.config?.url)) {
      return Promise.reject(error);
    }

    // Handle authentication errors (401)
    if (isAuthenticationError(error) && !isAuthRoute(error.config?.url)) {
      showErrorToast('Your session has expired. Redirecting to login...');
      // Delay redirect to allow toast to be seen
      setTimeout(() => {
        handleAuthenticationError();
      }, 1500);
      return Promise.reject(error);
    }

    // Handle other errors with toast notifications
    // Only show toast for non-validation errors (validation errors are handled by forms)
    if (errorInfo.type !== 'VALIDATION') {
      showErrorToast(errorInfo.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
