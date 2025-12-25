// src/pages/Menu/POS/components/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { Rol, CrearUsuarioPayload } from '../../../../types/backend.types';
import { createUser, getRoles } from '../../../../services/api/users.api';
import './UserManagement.css';

interface UserManagementProps {
  user: AuthUser;
}

interface FormData {
  ci: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  fecha_nacimiento: string;
  password: string;
  confirmPassword: string;
  rol_id: number;
  is_staff: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    ci: '',
    username: '',
    email: '',
    nombre: '',
    apellido: '',
    telefono: '',
    fecha_nacimiento: '',
    password: '',
    confirmPassword: '',
    rol_id: 0,
    is_staff: true,
  });

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const rolesData = await getRoles();
      setRoles(rolesData);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rol_id' ? parseInt(value) : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.ci.trim()) {
      setError('El CI es obligatorio');
      return false;
    }
    if (!formData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.apellido.trim()) {
      setError('El apellido es obligatorio');
      return false;
    }
    if (!formData.password) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.rol_id === 0) {
      setError('Debe seleccionar un rol');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El formato del email no es válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData: CrearUsuarioPayload = {
        ci: formData.ci.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: formData.telefono.trim() || undefined,
        fecha_nacimiento: formData.fecha_nacimiento || undefined,
        password: formData.password,
        rol_id: formData.rol_id,
        is_staff: formData.is_staff,
      };

      const response = await createUser(userData);
      setSuccess(`Usuario ${response.user.nombre} ${response.user.apellido} creado exitosamente`);
      
      // Limpiar formulario
      setFormData({
        ci: '',
        username: '',
        email: '',
        nombre: '',
        apellido: '',
        telefono: '',
        fecha_nacimiento: '',
        password: '',
        confirmPassword: '',
        rol_id: 0,
        is_staff: formData.is_staff,
      });

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ci: '',
      username: '',
      email: '',
      nombre: '',
      apellido: '',
      telefono: '',
      fecha_nacimiento: '',
      password: '',
      confirmPassword: '',
      rol_id: 0,
      is_staff: true,
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Gestión de Usuarios</h2>
        <p>Crear nuevo empleado en el sistema</p>
      </div>

      <div className="user-form-container">
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ci">Cédula de Identidad *</label>
              <input
                type="text"
                id="ci"
                name="ci"
                value={formData.ci}
                onChange={handleInputChange}
                placeholder="Ej: 12345678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Nombre de Usuario *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Ej: jperez"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: Juan"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                placeholder="Ej: Pérez"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ej: juan@empresa.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="Ej: 70123456"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
              <input
                type="date"
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rol_id">Rol *</label>
              <select
                id="rol_id"
                name="rol_id"
                value={formData.rol_id}
                onChange={handleInputChange}
                required
              >
                <option value={0}>Seleccionar rol...</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
  <label className="checkbox-label">
    <input
      type="checkbox"
      name="is_staff"
      checked={formData.is_staff}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        is_staff: e.target.checked
      }))}
    />
    <span>¿Es personal del sistema? (Staff)</span>
  </label>
  <small>Marcar si el usuario puede acceder al panel administrativo</small>
</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Repetir contraseña"
                required
              />
            </div>
          </div>

          {error && (
            <div className="form-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="form-message success">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={loading}
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;