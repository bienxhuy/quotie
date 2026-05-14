import axiosInstance from "@/lib/axios";
import { BaseUser } from "@/types/user.type";
import { ApiResponse } from "@/types/api.type";

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthData {
  accessToken: string;
  user: BaseUser;
}

type AuthResponse = ApiResponse<AuthData>;

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<{ accessToken: string; user: BaseUser }> {
  const response = await axiosInstance.post<AuthResponse>(
    "/api/auth/register",
    data
  );
  return {
    accessToken: response.data.data.accessToken,
    user: response.data.data.user,
  };
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<{ accessToken: string; user: BaseUser }> {
  const response = await axiosInstance.post<AuthResponse>(
    "/api/auth/login",
    data
  );
  return {
    accessToken: response.data.data.accessToken,
    user: response.data.data.user,
  };
}

/**
 * Refresh access token using refresh token cookie
 */
export async function refreshAccessToken(): Promise<string> {
  const response = await axiosInstance.post<AuthResponse>(
    "/api/auth/refresh"
  );
  return response.data.data.accessToken;
}

/**
 * Logout from current device
 */
export async function logout(): Promise<void> {
  await axiosInstance.post("/api/auth/logout");
}

/**
 * Logout from all devices
 */
export async function logoutAll(): Promise<void> {
  await axiosInstance.post("/api/auth/logout-all");
}