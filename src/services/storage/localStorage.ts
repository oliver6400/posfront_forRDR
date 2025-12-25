// src/services/storage/localStorage.ts
// Utilidades para manejar localStorage de forma segura

import type { UsuarioCompleto } from '../../types/backend.types';

// 🔑 Claves para localStorage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'user',
  LAST_SUCURSAL: 'lastSucursal',
  APP_SETTINGS: 'appSettings',
} as const;

// 🛡️ Funciones helper para manejar errores de localStorage
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error al leer localStorage key "${key}":`, error);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error al escribir localStorage key "${key}":`, error);
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error al eliminar localStorage key "${key}":`, error);
    return false;
  }
}

// 🔐 AUTENTICACIÓN

// Guardar token de autenticación
export function saveAuthToken(token: string): boolean {
  return safeSetItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

// Obtener token de autenticación
export function getAuthToken(): string | null {
  return safeGetItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Eliminar token de autenticación
export function removeAuthToken(): boolean {
  return safeRemoveItem(STORAGE_KEYS.AUTH_TOKEN);
}

// Verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getUserData();
  return !!(token && user);
}

// 👤 DATOS DEL USUARIO

// Guardar datos del usuario
export function saveUserData(user: UsuarioCompleto): boolean {
  try {
    const userJson = JSON.stringify(user);
    return safeSetItem(STORAGE_KEYS.USER_DATA, userJson);
  } catch (error) {
    console.error('Error al serializar datos del usuario:', error);
    return false;
  }
}

// Obtener datos del usuario
export function getUserData(): UsuarioCompleto | null {
  try {
    const userJson = safeGetItem(STORAGE_KEYS.USER_DATA);
    if (!userJson) return null;
    
    return JSON.parse(userJson) as UsuarioCompleto;
  } catch (error) {
    console.error('Error al deserializar datos del usuario:', error);
    // Limpiar datos corruptos
    safeRemoveItem(STORAGE_KEYS.USER_DATA);
    return null;
  }
}

// Eliminar datos del usuario
export function removeUserData(): boolean {
  return safeRemoveItem(STORAGE_KEYS.USER_DATA);
}

// Actualizar parcialmente los datos del usuario
export function updateUserData(updates: Partial<UsuarioCompleto>): boolean {
  const currentUser = getUserData();
  if (!currentUser) return false;

  const updatedUser = { ...currentUser, ...updates };
  return saveUserData(updatedUser);
}

// 🏪 SUCURSAL

// Guardar última sucursal seleccionada
export function saveLastSucursal(sucursalId: number): boolean {
  return safeSetItem(STORAGE_KEYS.LAST_SUCURSAL, sucursalId.toString());
}

// Obtener última sucursal seleccionada
export function getLastSucursal(): number | null {
  const sucursalStr = safeGetItem(STORAGE_KEYS.LAST_SUCURSAL);
  if (!sucursalStr) return null;
  
  const sucursalId = parseInt(sucursalStr, 10);
  return isNaN(sucursalId) ? null : sucursalId;
}

// Eliminar última sucursal
export function removeLastSucursal(): boolean {
  return safeRemoveItem(STORAGE_KEYS.LAST_SUCURSAL);
}

// ⚙️ CONFIGURACIONES DE LA APP

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  itemsPerPage: number;
  autoSave: boolean;
  notifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'es',
  itemsPerPage: 10,
  autoSave: true,
  notifications: true,
};

// Guardar configuraciones de la app
export function saveAppSettings(settings: Partial<AppSettings>): boolean {
  try {
    const currentSettings = getAppSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    const settingsJson = JSON.stringify(updatedSettings);
    return safeSetItem(STORAGE_KEYS.APP_SETTINGS, settingsJson);
  } catch (error) {
    console.error('Error al guardar configuraciones:', error);
    return false;
  }
}

// Obtener configuraciones de la app
export function getAppSettings(): AppSettings {
  try {
    const settingsJson = safeGetItem(STORAGE_KEYS.APP_SETTINGS);
    if (!settingsJson) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(settingsJson) as AppSettings;
    // Combinar con configuraciones por defecto para asegurar todas las propiedades
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error al leer configuraciones:', error);
    // Devolver configuraciones por defecto si hay error
    return DEFAULT_SETTINGS;
  }
}

// Eliminar configuraciones de la app
export function removeAppSettings(): boolean {
  return safeRemoveItem(STORAGE_KEYS.APP_SETTINGS);
}

// 🧹 LIMPIEZA

// Limpiar todos los datos de autenticación
export function clearAuthData(): boolean {
  const tokenRemoved = removeAuthToken();
  const userRemoved = removeUserData();
  return tokenRemoved && userRemoved;
}

// Limpiar todos los datos de la aplicación
export function clearAllData(): boolean {
  const authCleared = clearAuthData();
  const sucursalRemoved = removeLastSucursal();
  const settingsRemoved = removeAppSettings();
  return authCleared && sucursalRemoved && settingsRemoved;
}

// 📊 UTILIDADES

// Obtener información del almacenamiento
export function getStorageInfo(): {
  isAuthenticated: boolean;
  hasUserData: boolean;
  lastSucursal: number | null;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
} {
  // Calcular uso aproximado del localStorage
  let usedBytes = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      usedBytes += localStorage[key].length + key.length;
    }
  }

  // 5MB es el límite típico del localStorage
  const totalBytes = 5 * 1024 * 1024;
  const availableBytes = totalBytes - usedBytes;
  const percentage = (usedBytes / totalBytes) * 100;

  return {
    isAuthenticated: isAuthenticated(),
    hasUserData: getUserData() !== null,
    lastSucursal: getLastSucursal(),
    storageUsage: {
      used: usedBytes,
      available: availableBytes,
      percentage: Math.round(percentage * 100) / 100,
    },
  };
}

// Verificar si localStorage está disponible
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Hook personalizado para React (opcional)
export function createStorageHook<T>(
  key: string,
  defaultValue: T,
  serializer = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
) {
  return {
    get: (): T => {
      try {
        const item = safeGetItem(key);
        if (item === null) return defaultValue;
        return serializer.deserialize(item);
      } catch {
        return defaultValue;
      }
    },
    set: (value: T): boolean => {
      try {
        const serializedValue = serializer.serialize(value);
        return safeSetItem(key, serializedValue);
      } catch {
        return false;
      }
    },
    remove: (): boolean => safeRemoveItem(key),
  };
}