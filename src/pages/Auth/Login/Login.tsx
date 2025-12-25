// src/pages/auth/login/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import { ROUTES } from '../../../router/routes';
import './Login.css';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  error?: string | null;
  loading?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const navigate = useNavigate();

  // Limpiar localStorage al entrar al componente login
  React.useEffect(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    console.log('Login component loaded - cleaned previous session');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      // Validaciones básicas
      if (!email.trim()) {
        setLocalError('Por favor ingresa tu email');
        setIsSubmitting(false);
        return;
      }
      
      if (!password.trim()) {
        setLocalError('Por favor ingresa tu contraseña');
        setIsSubmitting(false);
        return;
      }

      const success = await onLogin(email, password);
      
      if (success) {
        console.log('Login exitoso, redirigiendo al menú...');
        navigate(ROUTES.MENU, { replace: true });
      } else {
        setLocalError('Email o contraseña incorrectos. Verifica tus credenciales.');
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      
      // Manejo de errores más específico
      if (err.message.includes('Network Error') || err.message.includes('conexión')) {
        setLocalError('Error de conexión. Verifica tu internet o contacta al administrador.');
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        setLocalError('Email o contraseña incorrectos.');
      } else if (err.message.includes('500')) {
        setLocalError('Error interno del servidor. Contacta al administrador.');
      } else {
        setLocalError(err.message || 'Error desconocido. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setLocalError('');
  };

  const displayError = error || localError;

  // Mostrar componente de forgot password
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Bienvenido</h1>
          <p>Ingresa tus datos para acceder al sistema</p>
        </div>

        {displayError && (
          <div className="login-error">
            <div className="error-icon">⚠️</div>
            <span>{displayError}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email / Usuario</label>
            <input
              type="text"
              id="email"
              placeholder="usuario@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || loading}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ¿Olvidaste tu contraseña?{' '}
            <button 
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPasswordClick}
              disabled={isSubmitting || loading}
            >
              Recuperar
            </button>
          </p>
        </div>

        {/* Información para desarrollo/testing */}
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px', 
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Para desarrollo:</strong> Usa las credenciales que te proporcione el backend
        </div>
      </div>
    </div>
  );
};

export default Login;