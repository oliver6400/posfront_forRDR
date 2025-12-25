// src/router/ProtectedRoute.tsx
import React from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UsuarioCompleto } from '../types/backend.types';
import { getStoredUser, getStoredToken, logout as apiLogout } from '../services/api/auth.api';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; 
}

// Helper function to get authenticated user data (usando la API real)
const getAuthUser = (): UsuarioCompleto | null => {
  const token = getStoredToken();
  const user = getStoredUser();
  
  // Si no hay token, no hay usuario autenticado
  if (!token) {
    return null;
  }
  
  // Verificar que el usuario tenga los campos necesarios
  if (user && user.id && user.email && user.rol) {
    return user;
  }
  
  // Si hay inconsistencias, limpiar datos
  apiLogout();
  return null;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const user = getAuthUser();
  const isAuthenticated = !!user;

  // 1. Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    console.log('Usuario no autenticado, redirigiendo a login');
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // 2. Si se requiere un rol específico, verificar permisos
  if (allowedRoles && user && !allowedRoles.includes(user.rol.nombre)) {
    console.log('Usuario sin permisos:', { userRole: user.rol.nombre, allowedRoles });
    
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1>Acceso denegado</h1>
        <p>Tu rol <strong>{user.rol.nombre}</strong> no tiene permisos para ver esta página.</p>
        <p>Roles permitidos: <strong>{allowedRoles.join(', ')}</strong></p>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => window.history.back()} style={{ marginRight: '10px' }}>
            Volver
          </button>
          <button onClick={() => window.location.href = '/menu'}>
            Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  // 3. Si está autenticado y tiene el rol correcto, renderizar contenido
  console.log('Usuario autenticado:', { user: user.nombre, role: user.rol.nombre });
  return <>{children}</>;
};

// Hook personalizado para verificar autenticación
export const useAuth = () => {
  const user = getAuthUser();
  const isAuthenticated = !!user;
  
  const logout = () => {
    console.log('Cerrando sesión...');
    
    // Usar la función de logout de la API
    apiLogout();
    
    console.log('Sesión cerrada, redirigiendo a login');
    window.location.replace('/login');
  };
  
  return {
    isAuthenticated,
    user,
    logout
  };
};

export default ProtectedRoute;