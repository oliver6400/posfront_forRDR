// src/pages/Menu/POS/components/BranchManager.tsx
import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { Ciudad, Sucursal } from '../../../../types/backend.types';
import { getCiudades, createSucursal } from '../../../../services/api/business.api';
import './BranchManager.css';

interface BranchManagerProps {
  user: AuthUser;
}

interface FormData {
  ciudad: number;
  nombre: string;
  direccion: string;
  activo: boolean;
}

const BranchManager: React.FC<BranchManagerProps> = ({ user }) => {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    ciudad: 0,
    nombre: '',
    direccion: '',
    activo: true,
  });

  /* =========================
     CARGA INICIAL
  ========================== */
  useEffect(() => {
    loadCiudades();
  }, []);

  const loadCiudades = async () => {
    try {
      const data = await getCiudades();
      setCiudades(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  /* =========================
     HANDLERS
  ========================== */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : name === 'ciudad'
          ? Number(value)
          : value,
    }));
  };

  /* =========================
     VALIDACIÓN
  ========================== */
  const validateForm = (): boolean => {
    if (formData.ciudad === 0) {
      setError('Debe seleccionar una ciudad');
      return false;
    }

    if (!formData.nombre.trim()) {
      setError('El nombre de la sucursal es obligatorio');
      return false;
    }

    if (!formData.direccion.trim()) {
      setError('La dirección es obligatoria');
      return false;
    }

    return true;
  };

  /* =========================
     SUBMIT
  ========================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        ciudad: formData.ciudad,
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        activo: formData.activo,
      };

      const response = await createSucursal(payload);

      setSuccess(`Sucursal "${response.nombre}" creada correctamente`);

      setFormData({
        ciudad: 0,
        nombre: '',
        direccion: '',
        activo: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ciudad: 0,
      nombre: '',
      direccion: '',
      activo: true,
    });
    setError('');
    setSuccess('');
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="branch-manager">
      <div className="branch-manager-header">
        <h2>Gestión de Sucursales</h2>
        <p>Crear nueva sucursal del negocio</p>
      </div>

      <div className="branch-form-container">
        <form onSubmit={handleSubmit} className="branch-form">
          <div className="form-group">
            <label htmlFor="ciudad">Ciudad *</label>
            <select
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              required
            >
              <option value={0}>Seleccionar ciudad...</option>
              {ciudades.map(ciudad => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre de la Sucursal *</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Sucursal Central"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección *</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              placeholder="Ej: Av. Principal #123"
              required
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleInputChange}
              />
              <span>Sucursal activa</span>
            </label>
          </div>

          {error && <div className="form-message error">{error}</div>}
          {success && <div className="form-message success">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Sucursal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchManager;