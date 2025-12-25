// src/services/api/auth.api.ts
// API de autenticación conectada con Django backend

import apiClient from './client';
import type { 
  LoginPayload,
  RegisterPayload, 
  ForgotPasswordPayload, 
  ResetPasswordPayload,
  ChangePasswordPayload,
  ForgotPasswordResponse, 
  ResetPasswordResponse
} from '../../types/auth.types';

import type { Rol } from '../../types/backend.types';

// 🔐 LOGIN - Conecta con Django JWT
export async function login(payload: LoginPayload) {
  try {
    console.log('🔑 Iniciando login con:', payload.username);
    
    const response = await apiClient.post('/api/token/', {
      username: payload.username,
      password: payload.password,
    });

    console.log('✅ Respuesta del servidor:', response.data);

    // Guardar tokens
    if (response.data.access) {
      localStorage.setItem('authToken', response.data.access);
      
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      
      // El usuario ya viene en la respuesta JWT personalizada
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('👤 Usuario guardado:', response.data.user.nombre);
      }

      return {
        access: response.data.access,
        refresh: response.data.refresh,
        user: response.data.user
      };
    }

    throw new Error('No se recibieron tokens válidos');
  } catch (error: any) {
    console.error('❌ Error en login:', error);
    
    let errorMessage = 'Credenciales inválidas';
    
    if (error.response?.data) {
      errorMessage = error.response.data.detail || 
                    error.response.data.non_field_errors?.[0] ||
                    error.response.data.message ||
                    'Credenciales inválidas';
    } else if (error.message?.includes('Network Error')) {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    throw new Error(errorMessage);
  }
}

// 📝 REGISTRO - Conecta con tu endpoint de usuarios
export async function register(payload: RegisterPayload) {
  try {
    const response = await apiClient.post('/user/auth/api/usuarios/register/', {
      ci: payload.ci,
      username: payload.username,
      email: payload.email,
      nombre: payload.nombre,
      apellido: payload.apellido,
      telefono: payload.telefono,
      fecha_nacimiento: payload.fecha_nacimiento,
      password: payload.password,
      rol_id: payload.rol_id,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.username?.[0] ||
                        error.response?.data?.email?.[0] ||
                        error.response?.data?.ci?.[0] ||
                        'Error al registrar usuario';
    throw new Error(errorMessage);
  }
}

// 🔒 LOGOUT
export function logout(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('🚪 Sesión cerrada');
}

// 🔄 REFRESH TOKEN
export async function refreshToken() {
  try {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) throw new Error('No hay token de refresco');

    const response = await apiClient.post('/user/auth/api/token/refresh/', {
      refresh: refresh
    });

    if (response.data.access) {
      localStorage.setItem('authToken', response.data.access);
      return response.data.access;
    }

    throw new Error('No se pudo refrescar el token');
  } catch (error) {
    console.error('❌ Error al refrescar token:', error);
    logout();
    throw error;
  }
}

// ✅ VERIFICAR TOKEN ACTUAL Y OBTENER USUARIO
export async function verifyToken() {
  try {
    // Usar el endpoint me para obtener usuario actual
    const response = await apiClient.get('/user/auth/api/usuarios/me/');
    console.log('✅ Token válido, usuario:', response.data.nombre);
    
    // Actualizar usuario en localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    
    return { valid: true, user: response.data };
  } catch (error: any) {
    console.error('❌ Token inválido:', error);
    logout();
    return { valid: false, message: 'Token inválido' };
  }
}

// 👤 OBTENER PERFIL DEL USUARIO ACTUAL
export async function getProfile() {
  try {
    const response = await apiClient.get('/user/auth/api/usuarios/me/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener perfil');
  }
}

// 🏷️ OBTENER ROLES DISPONIBLES
export async function getRoles(): Promise<Rol[]> {
  try {
    const response = await apiClient.get('/user/auth/api/roles/');
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener roles');
  }
}

// 📧 RECUPERAR CONTRASEÑA (pendiente implementar en backend)
export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  try {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password/', {
      email: payload.email,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.email?.[0] ||
                        'Error al enviar solicitud de recuperación';
    throw new Error(errorMessage);
  }
}

// 🔄 RESTABLECER CONTRASEÑA (pendiente implementar en backend)
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  try {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password/', {
      token: payload.token,
      new_password: payload.newPassword,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.new_password?.[0] ||
                        'Error al restablecer contraseña';
    throw new Error(errorMessage);
  }
}

// 🔑 CAMBIAR CONTRASEÑA (usuario autenticado)
export async function changePassword(payload: ChangePasswordPayload) {
  try {
    const response = await apiClient.put('/user/auth/api/usuarios/change-password/', {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    });

    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.current_password?.[0] ||
                        error.response?.data?.new_password?.[0] ||
                        'Error al cambiar contraseña';
    throw new Error(errorMessage);
  }
}

// 🔄 UTILIDADES
export function getStoredToken(): string | null {
  return localStorage.getItem('authToken');
}

export function getStoredUser(): any | null {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
}