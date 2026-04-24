import type { AxiosError } from 'axios';

/**
 * Error types for categorizing different error scenarios
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  VALIDATION: 'VALIDATION',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

/**
 * Structured error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Determine error type from Axios error
 */
export function getErrorType(error: AxiosError): ErrorType {
  if (!error.response) {
    // Network error (no response received)
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    return ErrorType.NETWORK;
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 422:
    case 400:
      return ErrorType.VALIDATION;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: AxiosError): string {
  const errorType = getErrorType(error);
  const responseData = error.response?.data;

  if (responseData && typeof responseData === 'object') {
    const data = responseData as Record<string, unknown>;
    if (data.message) {
      return String(data.message);
    }
    if (data.reason) {
      return String(data.reason);
    }
    if (data.error) {
      return String(data.error);
    }
  }

  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Unable to connect to the server. Please check your internet connection and try again.';

    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again.';

    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';

    case ErrorType.AUTHORIZATION:
      return 'You do not have permission to perform this action.';

    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';

    case ErrorType.VALIDATION:
      // Try to extract validation errors from response
      if (error.response?.data && typeof error.response.data === 'object') {
        const data = error.response.data as Record<string, unknown>;
        if (data.message) {
          return String(data.message);
        }
        if (data.error) {
          return String(data.error);
        }
        // Return first validation error
        const firstError = Object.values(data)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return String(firstError[0]);
        }
      }
      return 'Please check your input and try again.';

    case ErrorType.SERVER:
      return 'A server error occurred. Please try again later.';

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Extract detailed error information from Axios error
 */
export function getErrorInfo(error: AxiosError): ErrorInfo {
  const type = getErrorType(error);
  const message = getErrorMessage(error);
  const statusCode = error.response?.status;
  const details = error.response?.data;

  return {
    type,
    message,
    statusCode,
    details,
  };
}

/**
 * Check if error is a network error (offline)
 */
export function isNetworkError(error: AxiosError): boolean {
  return !error.response && error.message === 'Network Error';
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthenticationError(error: AxiosError): boolean {
  return error.response?.status === 401;
}

/**
 * Check if error is an authorization error (403)
 */
export function isAuthorizationError(error: AxiosError): boolean {
  return error.response?.status === 403;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: AxiosError): boolean {
  const status = error.response?.status;
  return status !== undefined && status >= 500 && status < 600;
}

/**
 * Check if error is a validation error (400, 422)
 */
export function isValidationError(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 400 || status === 422;
}

/**
 * Log error to console with structured information
 */
export function logError(error: AxiosError, context?: string): void {
  const errorInfo = getErrorInfo(error);

  console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
  console.error('Type:', errorInfo.type);
  console.error('Message:', errorInfo.message);
  if (errorInfo.statusCode) {
    console.error('Status Code:', errorInfo.statusCode);
  }
  if (errorInfo.details) {
    console.error('Details:', errorInfo.details);
  }
  console.error('Original Error:', error);
  console.groupEnd();
}

/**
 * Handle authentication errors by redirecting to login
 */
export function handleAuthenticationError(): void {
  // Clear any stored auth tokens
  localStorage.removeItem('authToken');
  sessionStorage.clear();

  // Redirect to login page
  window.location.href = '/login';
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', event => {
    console.error('Global error:', event.error);
  });
}
