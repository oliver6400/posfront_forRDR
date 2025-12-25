// src/components/Auth/ForgotPassword.tsx
import React, { useState } from 'react';
import {useMail} from '../../../hooks/useMail'; 
import './ForgotPassword.css';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const { loading, error, success, sendPasswordReset, setError } = useMail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setError(null);
    
    try {
      await sendPasswordReset(email);
      // Si llega aquí, el email se envió correctamente
      setEmail(''); // Limpiar el campo
    } catch (err) {
      // El error ya se maneja en el hook useMail
      console.error('Error sending password reset:', err);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Recuperar Contraseña</h1>
          <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {success && (
          <div className="success-message">
            <div className="success-icon">✉️</div>
            <p>Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        )}

        {!success && (
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                placeholder="tucorreo@ejemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}

        <div className="forgot-password-footer">
          <button
            type="button"
            className="back-to-login"
            onClick={onBackToLogin}
          >
            ← Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;