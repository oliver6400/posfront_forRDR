// src/pages/Menu/POS/components/ClientRegistration.tsx
import React, { useState, useEffect } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import type { Cliente } from '../../../../types/backend.types';
import './ClientRegistration.css';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  searchClientByNit
} from '../../../../services/api/sales.api';

interface ClientRegistrationProps {
  user: AuthUser;
}

type ViewMode = 'list' | 'create' | 'edit';

interface ClientForm {
  nit: string;
  nombre: string;
  razon_social: string;
  email: string;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [clients, setClients] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para formulario
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClientForm>({
    nit: '',
    nombre: '',
    razon_social: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<ClientForm>>({});

  useEffect(() => {
    loadClients();
  }, [currentPage, searchQuery]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await getClients({
        search: searchQuery,
        page: currentPage,
        limit: 20
      });

      setClients(response.results);
      const count = Number(response.count) || 0;
      setTotalPages(Math.max(1, Math.ceil(count / 20)));
    } catch (error) {
      console.error('Error cargando clientes:', error);
      alert('Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ClientForm> = {};

    if (!formData.nit.trim()) {
      errors.nit = 'NIT/CI es requerido';
    } else if (formData.nit.length < 3) {
      errors.nit = 'NIT/CI debe tener al menos 3 caracteres';
    }

    if (!formData.nombre.trim()) {
      errors.nombre = 'Nombre es requerido';
    }

    if (!formData.razon_social.trim()) {
      errors.razon_social = 'Razón social es requerida';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email no válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (editingClient) {
        // Actualizar cliente existente
        await updateClient(editingClient.id, formData);
        alert('Cliente actualizado exitosamente');
      } else {
        // Crear nuevo cliente
        await createClient(formData);
        alert('Cliente registrado exitosamente');
      }

      // Limpiar formulario y volver a la lista
      resetForm();
      setViewMode('list');
      await loadClients();

    } catch (error: any) {
      console.error('Error guardando cliente:', error);
      alert(error.message || 'Error al guardar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (client: Cliente) => {
    setEditingClient(client);
    setFormData({
      nit: client.nit,
      nombre: client.nombre,
      razon_social: client.razon_social,
      email: client.email
    });
    setFormErrors({});
    setViewMode('edit');
  };

  const handleDelete = async (client: Cliente) => {
    if (!confirm(`¿Está seguro de eliminar el cliente "${client.razon_social}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteClient(client.id);
      alert('Cliente eliminado exitosamente');
      await loadClients();
    } catch (error: any) {
      console.error('Error eliminando cliente:', error);
      alert(error.message || 'Error al eliminar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nit: '',
      nombre: '',
      razon_social: '',
      email: ''
    });
    setFormErrors({});
    setEditingClient(null);
  };

  const handleQuickSearch = async (nit: string) => {
    if (!nit.trim()) return;

    setIsLoading(true);
    try {
      const client = await searchClientByNit(nit);
      if (client) {
        alert(`Cliente encontrado: ${client.razon_social}`);
        setClients([client]);
      } else {
        alert('Cliente no encontrado');
        setClients([]);
      }
    } catch (error) {
      console.error('Error buscando cliente:', error);
      alert('Error al buscar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const canManageClients = user.role === 'Cajero' || user.role === 'Admin' || user.role === 'SuperAdmin';

  return (
    <div className="client-registration">
      <div className="client-header">
        <h2>CU06: Registrar Cliente</h2>

        <div className="header-actions">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('list');
              resetForm();
              setSearchQuery('');
              setCurrentPage(1);
              loadClients();
            }}
          >
            Lista de Clientes
          </button>

          {canManageClients && (
            <button
              className={`view-btn ${viewMode === 'create' ? 'active' : ''}`}
              onClick={() => {
                resetForm();
                setViewMode('create');
              }}
            >
              Nuevo Cliente
            </button>
          )}
        </div>
      </div>

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <div className="clients-list">
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar por NIT, nombre, o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button
                onClick={() => {
                  setCurrentPage(1);
                  loadClients();
                }}
              >
                Buscar
              </button>
            </div>

            <div className="quick-search">
              <input
                type="text"
                placeholder="Búsqueda rápida por NIT..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickSearch(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="quick-search-input"
              />
              <small>Presione Enter para búsqueda exacta por NIT</small>
            </div>
          </div>

          {isLoading && <div className="loading">Cargando clientes...</div>}

          {!isLoading && Array.isArray(clients) && clients.length === 0 && (
            <div className="no-data">
              <p>No se encontraron clientes</p>
            </div>
          )}

          {!isLoading && Array.isArray(clients) && clients.length > 0 && (
            <>
              <div className="clients-table">
                <div className="table-header">
                  <span>NIT/CI</span>
                  <span>Nombre</span>
                  <span>Razón Social</span>
                  <span>Email</span>
                  {canManageClients && <span>Acciones</span>}
                </div>

                {clients.map(client => (
                  <div key={client.id} className="table-row">
                    <span className="client-nit">{client.nit}</span>
                    <span className="client-name">{client.nombre}</span>
                    <span className="client-razon">{client.razon_social}</span>
                    <span className="client-email">{client.email}</span>

                    {canManageClients && (
                      <span className="actions">
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(client)}
                        >
                          Editar
                        </button>

                        {(user.role === 'Admin' || user.role === 'SuperAdmin') && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(client)}
                          >
                            Eliminar
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>

                  <span className="page-info">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Vista de Formulario (Crear/Editar) */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="client-form">
          <h3>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nit">
                  NIT/CI <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nit"
                  value={formData.nit}
                  onChange={(e) => setFormData(prev => ({ ...prev, nit: e.target.value }))}
                  className={formErrors.nit ? 'error' : ''}
                  placeholder="Ingrese NIT o CI"
                  maxLength={20}
                />
                {formErrors.nit && (
                  <span className="error-message">{formErrors.nit}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nombre">
                  Nombre <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  className={formErrors.nombre ? 'error' : ''}
                  placeholder="Nombre del cliente"
                  maxLength={100}
                />
                {formErrors.nombre && (
                  <span className="error-message">{formErrors.nombre}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="razon_social">
                  Razón Social <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) => setFormData(prev => ({ ...prev, razon_social: e.target.value }))}
                  className={formErrors.razon_social ? 'error' : ''}
                  placeholder="Razón social o nombre comercial"
                  maxLength={200}
                />
                {formErrors.razon_social && (
                  <span className="error-message">{formErrors.razon_social}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={formErrors.email ? 'error' : ''}
                  placeholder="correo@ejemplo.com"
                  maxLength={100}
                />
                {formErrors.email && (
                  <span className="error-message">{formErrors.email}</span>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : editingClient ? 'Actualizar Cliente' : 'Registrar Cliente'}
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Información adicional para nuevos clientes */}
          {viewMode === 'create' && (
            <div className="form-info">
              <h4>Información sobre Registro de Clientes</h4>
              <ul>
                <li>El NIT/CI debe ser único en el sistema</li>
                <li>Todos los campos marcados con (*) son obligatorios</li>
                <li>El email será usado para envío de comprobantes</li>
                <li>Los datos pueden ser editados posteriormente</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="client-stats">
        <div className="stats-card">
          <h4>Estadísticas de Clientes</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{Array.isArray(clients) ? clients.length : 0}</span>
              <span className="stat-label">Clientes Mostrados</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Number.isFinite(totalPages) ? totalPages : 1}
              </span>
              <span className="stat-label">Total Páginas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRegistration;

