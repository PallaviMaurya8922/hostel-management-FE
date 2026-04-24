import axios from 'axios';
import apiClient from './client';
import type { UserRole } from '../contexts';
import { config } from '../config/env';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  isFirstLogin?: boolean;
}

const authBaseUrl = config.apiBaseUrl.replace(/\/api\/?$/, '');

function normalizePhotoUrl(photoUrl?: string): string | undefined {
  if (!photoUrl) {
    return undefined;
  }

  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }

  return `${authBaseUrl}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`;
}

interface LoginApiResponse {
  success: boolean;
  message?: string;
  user_type: 'student' | 'staff';
  is_first_login?: boolean;
  redirect_url?: string;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
  };
}

interface CurrentUserApiResponse {
  success: boolean;
  authenticated: boolean;
  role: UserRole;
  isFirstLogin?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
  };
}

function mapRoleFromLoginResponse(data: LoginApiResponse): UserRole {
  if (data.user_type === 'student') {
    return 'student';
  }

  if (data.redirect_url?.includes('/security/')) {
    return 'security';
  }

  if (data.redirect_url?.includes('/maintenance/')) {
    return 'maintenance';
  }

  return 'warden';
}

function toAuthUser(
  user: { id: string; name: string; email: string; photoUrl?: string },
  role: UserRole,
  isFirstLogin?: boolean
): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    photoUrl: normalizePhotoUrl(user.photoUrl),
    isFirstLogin,
  };
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;
    return data?.error || data?.message || fallback;
  }
  return fallback;
}

export async function fetchCsrfCookie(): Promise<void> {
  await apiClient.get('/auth/csrf/', { baseURL: authBaseUrl });
}

function mapRoleToUserType(role: UserRole): 'student' | 'staff' {
  return role === 'student' ? 'student' : 'staff';
}

function mapSelectedRoleToExpectedRole(selectedRole: UserRole, data: LoginApiResponse): UserRole {
  if (data.user_type === 'student') return 'student';

  if (selectedRole === 'admin') return 'admin';

  return mapRoleFromLoginResponse(data);
}

async function attemptLogin(
  email: string,
  password: string,
  userType: 'student' | 'staff'
): Promise<LoginApiResponse> {
  const response = await apiClient.post<LoginApiResponse>('/auth/login/', {
    email,
    password,
    user_type: userType,
  }, {
    baseURL: authBaseUrl,
  });

  return response.data;
}

export async function loginWithSession(
  email: string,
  password: string,
  role: UserRole
): Promise<AuthUser> {
  await fetchCsrfCookie();

  try {
    const loginData = await attemptLogin(
      email,
      password,
      mapRoleToUserType(role)
    );

    const authenticatedUser = toAuthUser(
      loginData.user,
      mapSelectedRoleToExpectedRole(role, loginData),
      loginData.is_first_login
    );

    return authenticatedUser;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Invalid credentials for selected role')
    );
  }
}

export async function getCurrentSessionUser(): Promise<AuthUser> {
  const response = await apiClient.get<CurrentUserApiResponse>('/auth/me/', {
    baseURL: authBaseUrl,
  });
  const { user, role, isFirstLogin } = response.data;
  return toAuthUser(user, role, isFirstLogin);
}

export async function logoutSession(): Promise<void> {
  await apiClient.get('/auth/logout/', { baseURL: authBaseUrl });
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface ChangePasswordApiResponse {
  success: boolean;
  message: string;
  redirect_url?: string;
}

interface UploadProfilePhotoApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  photo_url?: string;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  try {
    const response = await apiClient.post<ChangePasswordApiResponse>(
      '/auth/change-password/',
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      },
      {
        baseURL: authBaseUrl,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, 'Failed to change password')
    );
  }
}

export async function uploadProfilePhoto(photoFile: File): Promise<string | undefined> {
  const formData = new FormData();
  formData.append('photo', photoFile);

  try {
    const response = await apiClient.post<UploadProfilePhotoApiResponse>(
      '/auth/upload-profile-photo/',
      formData,
      {
        baseURL: authBaseUrl,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to upload photo');
    }

    return normalizePhotoUrl(response.data.photo_url);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to upload photo'));
  }
}
