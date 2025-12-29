// src/pages/Menu/POS/components/UserManagement.tsx
import React, { useEffect, useState } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { Ciudad } from '../../../../types/backend.types';
import { getCiudades, createCiudad } from '../../../../services/api/business.api';
import './CityManager.css';

interface CityManagerProps {
  user: AuthUser;
}

interface FormData {
  nombre: string;
}

const CityManager: React.FC<CityManagerProps> = ({ user }) => {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [formData, setFormData] = useState<FormData>({ nombre: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  /* =========================
     CARGAR CIUDADES
  ========================= */
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
  ========================= */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ nombre: e.target.value });
  };

  const validateForm = (): boolean => {
    if (!formData.nombre.trim()) {
      setError('El nombre de la ciudad es obligatorio');
      return false;
    }
    return true;
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const nuevaCiudad = await createCiudad({
        nombre: formData.nombre.trim(),
      });

      setSuccess(`Ciudad "${nuevaCiudad.nombre}" creada correctamente`);
      setFormData({ nombre: '' });
      loadCiudades();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ nombre: '' });
    setError('');
    setSuccess('');
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="city-manager">
      <div className="city-manager-header">
        <h2>Gestión de Ciudades</h2>
        <p>Administrar ciudades del sistema</p>
      </div>

      {/* FORMULARIO */}
      <form className="city-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre de la Ciudad *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Ej: La Paz"
            required
          />
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
            {loading ? 'Guardando...' : 'Crear Ciudad'}
          </button>
        </div>
      </form>

      {/* LISTADO */}
      <div className="city-list">
        <h3>Ciudades Registradas</h3>

        {ciudades.length === 0 ? (
          <p className="no-data">No hay ciudades registradas</p>
        ) : (
          <ul>
            {ciudades.map(ciudad => (
              <li key={ciudad.id}>
                <span>{ciudad.nombre}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CityManager;