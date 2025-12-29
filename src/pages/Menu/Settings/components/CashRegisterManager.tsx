// src/pages/Menu/POS/components/CashRegisterManager.tsx
import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { PuntoVenta, Sucursal } from '../../../../types/backend.types';

import {
  getPuntosVenta,
  createPuntoVenta,
  deletePuntoVenta,
  getSucursales,
  patchPuntoVenta
} from '../../../../services/api/business.api';

import './CashRegisterManager.css';

interface CashRegisterManagerProps {
  user: AuthUser;
}

interface FormData {
  sucursal: number;
  nombre: string;
  activo: boolean;
}

const CashRegisterManager: React.FC<CashRegisterManagerProps> = () => {
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    sucursal: 0,
    nombre: '',
    activo: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [pvData, sucData] = await Promise.all([
        getPuntosVenta(),
        getSucursales(),
      ]);
      setPuntosVenta(pvData);
      setSucursales(sucData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'sucursal'
          ? Number(value)
          : value,
    }));
  };

  const validateForm = (): boolean => {
    if (formData.sucursal === 0) {
      setError('Debe seleccionar una sucursal');
      return false;
    }
    if (!formData.nombre.trim()) {
      setError('El nombre del punto de venta es obligatorio');
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
      console.log('Payload PuntoVenta:', {
        sucursal: formData.sucursal,
        nombre: formData.nombre,
        activo: formData.activo,
      });
      const pv = await createPuntoVenta({
        sucursal: formData.sucursal,
        nombre: formData.nombre.trim(),
        activo: formData.activo,
      });

      setSuccess(`Punto de venta "${pv.nombre}" creado correctamente`);
      setPuntosVenta(prev => [...prev, pv]);

      setFormData({
        sucursal: 0,
        nombre: '',
        activo: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Desea eliminar este punto de venta?')) return;

    try {
      await deletePuntoVenta(id);
      setPuntosVenta(prev => prev.filter(pv => pv.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActivo = async (pv: PuntoVenta) => {
    try {
      const updated = await patchPuntoVenta(pv.id, {
        activo: !pv.activo,
      });

      setPuntosVenta(prev =>
        prev.map(p => (p.id === pv.id ? updated : p))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getSucursalNombre = (sucursal: number | Sucursal) => {
    if (typeof sucursal === 'object') return sucursal.nombre;
    const s = sucursales.find(sc => sc.id === sucursal);
    return s?.nombre || '-';
  };

  return (
    <div className="cash-register-manager">
      <div className="cash-register-header">
        <h2>Puntos de Venta</h2>
        <p>Administrar cajas y terminales POS</p>
      </div>

      <form onSubmit={handleSubmit} className="cash-register-form">
        <div className="form-row">
          <div className="form-group">
            <label>Sucursal *</label>
            <select
              name="sucursal"
              value={formData.sucursal}
              onChange={handleInputChange}
              required
            >
              <option value={0}>Seleccionar sucursal...</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nombre del Punto de Venta *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Caja 1"
              required
            />
          </div>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleInputChange}
            />
            Punto de venta activo
          </label>
        </div>

        {error && <div className="form-message error">{error}</div>}
        {success && <div className="form-message success">{success}</div>}

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Punto de Venta'}
          </button>
        </div>
      </form>

      <div className="cash-register-list">
        <h3>Puntos de Venta Registrados</h3>

        {puntosVenta.length === 0 ? (
          <p>No hay puntos de venta registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Sucursal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {puntosVenta.map(pv => (
                <tr key={pv.id}>
                  <td>{pv.id}</td>
                  <td>{pv.nombre}</td>
                  <td>{getSucursalNombre(pv.sucursal)}</td>
                  <td>
                    <span className={pv.activo ? 'active' : 'inactive'}>
                      {pv.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => toggleActivo(pv)}>
                      {pv.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(pv.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CashRegisterManager;