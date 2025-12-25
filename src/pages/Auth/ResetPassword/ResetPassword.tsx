// src/components/Auth/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api/client';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('🔍 Token recibido:', token); // ✅ Debug
    if (token) {
      verifyToken();
    } else {
      setError('Token de recuperación no válido');
      setIsValidToken(false);
    }
  }, [token]);

  const verifyToken = async () => {
    console.log('🔍 Verificando token...'); // ✅ Debug
    try {
      const response = await apiClient.get(`/auth/verify-reset-token/${token}`);
      console.log('✅ Token válido:', response.data); // ✅ Debug
      setIsValidToken(true);
    } catch (err: any) {
      console.error('❌ Error verificando token:', err); // ✅ Debug
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error ||
                          'Token expirado o inválido';
      setError(errorMessage);
      setIsValidToken(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    console.log('🔄 Iniciando reset de password...'); // ✅ Debug

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        token,
        newPassword: password
      };
      
      console.log('📤 Enviando request de reset:', { token: token?.substring(0, 10) + '...', hasPassword: !!password }); // ✅ Debug
      
      const response = await apiClient.post('/auth/reset-password', requestData);
      
      console.log('✅ Password reset exitoso:', response.data); // ✅ Debug

      setMessage('Contraseña restablecida exitosamente. Serás redirigido al login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('❌ Error en reset password:', err); // ✅ Debug
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error ||
                          'Error al restablecer la contraseña';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string, color: string } => {
    const errors = validatePassword(password);
    if (password.length === 0) return { strength: '', color: '' };
    if (errors.length === 0) return { strength: 'Fuerte', color: '#4caf50' };
    if (errors.length <= 2) return { strength: 'Media', color: '#ff9800' };
    return { strength: 'Débil', color: '#f44336' };
  };

  // ✅ Estado de carga inicial
  if (isValidToken === null) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="loading">
            <div>Verificando token...</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Token: {token?.substring(0, 20)}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Token inválido
  if (isValidToken === false) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="error-state">
            <h2>🔒 Token Inválido</h2>
            <p>{error}</p>
            <p>El enlace puede haber expirado o ya fue utilizado.</p>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Token recibido: {token?.substring(0, 20)}...
            </div>
            <button
              className="back-button"
              onClick={() => navigate('/login')}
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1>🔐 Nueva Contraseña</h1>
          <p>Ingresa tu nueva contraseña segura</p>
          {/* ✅ Debug info */}
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Token válido: {token?.substring(0, 20)}...
          </div>
        </div>

        {message && (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>{message}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        )}

        {!message && (
          <form className="reset-password-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="password">Nueva Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {password && (
                <div className="password-strength">
                  <span style={{ color: passwordStrength.color }}>
                    Seguridad: {passwordStrength.strength}
                  </span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="password-mismatch">
                  Las contraseñas no coinciden
                </div>
              )}
            </div>

            <div className="password-requirements">
              <h4>La contraseña debe contener:</h4>
              <ul>
                <li className={password.length >= 8 ? 'valid' : ''}>
                  Al menos 8 caracteres
                </li>
                <li className={/[A-Z]/.test(password) ? 'valid' : ''}>
                  Una letra mayúscula
                </li>
                <li className={/[a-z]/.test(password) ? 'valid' : ''}>
                  Una letra minúscula
                </li>
                <li className={/\d/.test(password) ? 'valid' : ''}>
                  Un número
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || password !== confirmPassword}
            >
              {isSubmitting ? 'Guardando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;