// src/types/auth.types.ts
// Tipos específicos para autenticación

import type { UsuarioCompleto } from './backend.types';

// 📝 Payloads para requests
export interface LoginPayload {
  username: string; // Tu backend usa username, no email
  password: string;
}

export interface RegisterPayload {
  ci: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_nacimiento?: string;
  password: string;
  rol_id: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// 📋 Respuestas del servidor
export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: UsuarioCompleto;
}

export interface RegisterResponse {
  user: UsuarioCompleto;
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: UsuarioCompleto;
  message?: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  message: string;
  user_email?: string;
}

// 🎯 Estado de autenticación para Context/Store
export interface AuthState {
  user: UsuarioCompleto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginPayload) => Promise<void>;
  register: (userData: RegisterPayload) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// 🔒 Tipos para protección de rutas
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

// 📊 Tipos para roles y permisos
export interface Permission {
  module: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowed: boolean;
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}