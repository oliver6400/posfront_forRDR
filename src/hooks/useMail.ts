// src/hooks/useMail.ts
import { useState } from 'react';

interface UseMailReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  sendPasswordReset: (email: string) => Promise<void>;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export const useMail = (): UseMailReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendPasswordReset = async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // 🚧 [BACKEND PENDIENTE] - Por ahora simulamos la llamada API
      console.log('📧 [SIMULADO] Enviando email de recuperación a:', email);
      
      // Simulación de delay de API (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 🔄 [REEMPLAZAR CUANDO BACKEND ESTÉ LISTO]
      /*
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error enviando email');
      }
      */
      
      // Simulamos éxito
      setSuccess(true);
      console.log('✅ Email de recuperación enviado exitosamente');
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Error enviando email de recuperación';
      setError(errorMessage);
      console.error('❌ Error en sendPasswordReset:', err);
    } finally {
      setLoading(false);
    }
  };

  const setErrorState = (newError: string | null) => {
    setError(newError);
  };

  const resetState = () => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  return { 
    loading, 
    error, 
    success, 
    sendPasswordReset, 
    setError: setErrorState,
    resetState
  };
};