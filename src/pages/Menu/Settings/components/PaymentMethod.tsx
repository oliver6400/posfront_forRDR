// src/pages/Menu/Settings/components/PaymentMethod.tsx
import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { MetodoPago } from '../../../../types/backend.types';
import { getPaymentMethods, createPaymentMethod } from '../../../../services/api/sales.api';
import './PaymentMethod.css';

interface PaymentMethodProps {
  user: AuthUser;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ user }) => {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [nuevoMetodo, setNuevoMetodo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadMetodosPago();
  }, []);

  const loadMetodosPago = async () => {
    try {
      console.log('Cargando métodos de pago...');
      const data = await getPaymentMethods();
      setMetodosPago(data);
      console.log('Métodos de pago cargados:', data);
    } catch (err: any) {
      console.error('Error al cargar métodos de pago:', err);
      setError(err.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNuevoMetodo(e.target.value);
  };

  const validateForm = (): boolean => {
    if (!nuevoMetodo.trim()) {
      setError('El nombre del método de pago es obligatorio');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validateForm()) return;

    setLoading(true);
    try {
        const metodoCreado = await createPaymentMethod(nuevoMetodo);
        setMetodosPago([...metodosPago, metodoCreado]);
        setSuccess('Método de pago creado exitosamente');
        setNuevoMetodo('');
    } catch (err: any) {
        setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="payment-method-manager">
      <h2>Métodos de Pago</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={nuevoMetodo}
          onChange={handleInputChange}
          placeholder="Nombre del método de pago"
        />
        <button type="submit" disabled={loading || !nuevoMetodo.trim()}>
          {loading ? 'Creando...' : 'Crear Método de Pago'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <ul>
        {metodosPago.map((metodo) => (
          <li key={metodo.id}>{metodo.nombre}</li>
        ))}
      </ul>
    </div>
  );
};
export default PaymentMethod;
