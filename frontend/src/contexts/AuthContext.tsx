// Serve as a component wrapper to provide auth state throughout the app.
// This context manages user authentication state and provides methods for login, registration, and logout.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAccessToken as setAxiosToken } from "@/lib/axios";
import { toast } from "sonner";

import { BaseUser } from "@/types/user.type";
import * as authService from "@/services/auth.service";

// Define the shape of the AuthContext
interface AuthContextType {
  accessToken: string | null;
  user: BaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  loginWithGoogle: (accessToken: string, user: BaseUser) => void;
}

// Create the AuthContext with default undefined value
// This will be provided by the AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the app and provide auth state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<BaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasBootstrapped = React.useRef(false);
  const USER_STORAGE_KEY = "auth_user";

  // Load user from localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from storage:", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  // Save user to localStorage
  const saveUserToStorage = useCallback((userData: BaseUser) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user to storage:", error);
    }
  }, []);

  // Clear user from localStorage
  const clearUserFromStorage = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  // Sync access token with axios instance
  const updateToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setAxiosToken(token);
  }, []);

  /**
   * Bootstrap authentication on app load
   * Attempt to refresh access token from refresh token cookie
   */
  const bootstrapAuth = useCallback(async () => {
    try {
      // Load user from localStorage first
      loadUserFromStorage();
      
      // Then try to refresh access token
      const token = await authService.refreshAccessToken();
      updateToken(token);
    } catch (error) {
      // If refresh fails (401), clear everything - user is not logged in
      updateToken(null);
      clearUserFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, [updateToken, loadUserFromStorage, clearUserFromStorage]);

  // Bootstrap auth on mount
  useEffect(() => {
    // Prevent multiple bootstrap calls (React Strict Mode)
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    
    bootstrapAuth();
  }, [bootstrapAuth]);

  // Listen for logout events from axios interceptor when 401 occurs
  useEffect(() => {
    const handleLogout = () => {
      updateToken(null);
      clearUserFromStorage();
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [updateToken, clearUserFromStorage]);


  // AUTH METHODS
  // Centralized methods to handle token updates

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await authService.login({ email, password });
    updateToken(accessToken);
    saveUserToStorage(user);
    toast.success(`Welcome back, ${user.name}!`);
  };

  const register = async (name: string, email: string, password: string) => {
    const { accessToken, user } = await authService.register({ name, email, password });
    updateToken(accessToken);
    saveUserToStorage(user);
    toast.success(`Account created successfully! Welcome, ${user.name}!`);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      updateToken(null);
      clearUserFromStorage();
      toast.success("You have been logged out successfully");
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } finally {
      updateToken(null);
      clearUserFromStorage();
    }
  };

  const loginWithGoogle = (accessToken: string, user: BaseUser) => {
    updateToken(accessToken);
    saveUserToStorage(user);
    toast.success(`Welcome back, ${user.name}!`);
  };

  // Initialize context value
  const value: AuthContextType = {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    loginWithGoogle,
  };

  // Provide the auth context to children components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}