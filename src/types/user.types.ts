// src/types/user.types.ts
// Tipos para mantener compatibilidad con componentes existentes

import type { UsuarioCompleto } from './backend.types';

// Tipo AuthUser para compatibilidad con tu Menu existente
export interface AuthUser {
  id_usuario: number;
  id?: number; // Opcional para compatibilidad
  username: string;
  pass_hash: string;
  nombre_completo: string;
  ci: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  activo: boolean;
  role: string;
}

// Función helper para convertir UsuarioCompleto a AuthUser
export function convertToAuthUser(usuario: UsuarioCompleto): AuthUser {
  return {
    id_usuario: usuario.id,
    id: usuario.id, // AGREGAR: para compatibilidad
    username: usuario.username,
    pass_hash: '',
    nombre_completo: `${usuario.nombre} ${usuario.apellido}`,
    ci: usuario.ci,
    email: usuario.email,
    telefono: usuario.telefono || '',
    fecha_nacimiento: usuario.fecha_nacimiento || '',
    activo: usuario.is_active,
    role: usuario.rol?.nombre || 'Usuario',
  };
}

// Función helper para verificar roles
export function hasRole(user: AuthUser | UsuarioCompleto, requiredRole: string): boolean {
  if ('role' in user) {
    return user.role === requiredRole;
  }
  return user.rol?.nombre === requiredRole;
}

export function hasAnyRole(user: AuthUser | UsuarioCompleto, requiredRoles: string[]): boolean {
  if ('role' in user) {
    return requiredRoles.includes(user.role);
  }
  return requiredRoles.includes(user.rol?.nombre || '');
}