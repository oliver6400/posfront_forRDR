// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { UsuarioCompleto } from '../types/backend.types';
import { convertToAuthUser } from '../types/user.types';

// Importar páginas
import Login from '../pages/Auth/Login/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword/ResetPassword';
import Menu from '../pages/Menu/Menu'; // Importar tu Menu corregido

// Componente de rutas protegidas
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from './routes';

// Importar la API real de autenticación
import { login as loginApi } from '../services/api/auth.api';
import { getStoredUser, isAuthenticated } from '../services/api/auth.api';

// Helper function para obtener usuario del localStorage (actualizada)
const getUserFromStorage = (): UsuarioCompleto | null => {
  return getStoredUser();
};

// Función de login REAL que conecta con tu backend
const handleLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    console.log('Intentando login con backend Django...');
    
    // Usar la API real en lugar de simulación
    const response = await loginApi({ 
      username: email, // Tu backend usa username
      password: password 
    });
    
    console.log('Login exitoso:', response.user.nombre);
    return true;
    
  } catch (error: any) {
    console.error('Error en login:', error.message);
    return false;
  }
};

// Componente wrapper para Menu que obtiene el usuario
const MenuWrapper: React.FC = () => {
  const user = getUserFromStorage();
  
  if (!user) {
    console.log('No se encontró usuario en MenuWrapper');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  console.log('Usuario encontrado:', user.nombre);
  
  // Convertir el usuario para el componente Menu
  const authUser = convertToAuthUser(user);
  
  return <Menu user={authUser} />;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* Rutas de autenticación (públicas) */}
        <Route 
          path={ROUTES.LOGIN} 
          element={<Login onLogin={handleLogin} />} 
        />
        <Route 
          path={ROUTES.FORGOT_PASSWORD} 
          element={<ForgotPassword onBackToLogin={() => window.history.back()} />} 
        />
        <Route 
          path={ROUTES.RESET_PASSWORD} 
          element={<ResetPassword />} 
        />

        {/* Ruta principal del sistema - Menu/POS */}
        <Route 
          path={ROUTES.MENU} 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'SuperAdmin', 'Cajero', 'Vendedor', 'Supervisor', 'Almacenero']}>
              <MenuWrapper />
            </ProtectedRoute>
          } 
        />

        {/* Ruta directa al Dashboard si la necesitas */}
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            <ProtectedRoute>
              <MenuWrapper />
            </ProtectedRoute>
          } 
        />

        {/* Las demás rutas ahora se manejan dentro del Menu/POS */}
        <Route 
          path={ROUTES.PRODUCTS} 
          element={<Navigate to={ROUTES.MENU} replace />}
        />

        <Route 
          path={ROUTES.SALES} 
          element={<Navigate to={ROUTES.MENU} replace />}
        />

        <Route 
          path={ROUTES.ADMIN} 
          element={<Navigate to={ROUTES.MENU} replace />}
        />

        {/* Ruta 404 */}
        <Route 
          path="*" 
          element={
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>404 - Página no encontrada</h1>
              <p>La ruta que buscas no existe.</p>
              <button onClick={() => window.location.href = ROUTES.MENU}>
                Ir al Sistema
              </button>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;