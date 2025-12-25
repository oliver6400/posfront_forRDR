// src/services/api/users.api.ts
import apiClient from './client';
import type { UsuarioCompleto, Rol, CrearUsuarioPayload, CrearUsuarioResponse } from '../../types/backend.types';

// Obtener todos los usuarios
export const getUsers = async (): Promise<UsuarioCompleto[]> => {
  try {
    const response = await apiClient.get('/user/api/usuarios/');
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo usuarios:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
  }
};

// Crear un nuevo usuario
export const createUser = async (userData: CrearUsuarioPayload): Promise<CrearUsuarioResponse> => {
  try {
    const response = await apiClient.post('/user/api/usuarios/register/', userData);
    return response.data;
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al crear usuario');
  }
};

// Obtener todos los roles
export const getRoles = async (): Promise<Rol[]> => {
  try {
    const response = await apiClient.get('/user/api/roles/');
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo roles:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener roles');
  }
};

// Obtener usuario por ID
export const getUserById = async (id: number): Promise<UsuarioCompleto> => {
  try {
    const response = await apiClient.get(`/user/api/usuarios/${id}/`);
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener usuario');
  }
};

// Actualizar usuario
export const updateUser = async (id: number, userData: Partial<CrearUsuarioPayload>): Promise<UsuarioCompleto> => {
  try {
    const response = await apiClient.patch(`/user/api/usuarios/${id}/`, userData);
    return response.data;
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
  }
};

// Desactivar usuario
export const deactivateUser = async (id: number): Promise<UsuarioCompleto> => {
  try {
    const response = await apiClient.patch(`/user/api/usuarios/${id}/`, { is_active: false });
    return response.data;
  } catch (error: any) {
    console.error('Error desactivando usuario:', error);
    throw new Error(error.response?.data?.message || 'Error al desactivar usuario');
  }
};