// src/pages/Menu/POS/POSLayout.tsx
import React, { useState } from 'react';
import type { AuthUser } from '../../../types/user.types';

// Importar componentes
import SalesComponent from './components/SalesComponent';
import StockControl from './components/StockControl';
import ClientRegistration from './components/ClientRegistration';
import UserManagement from './components/UserManagement';
import './POSLayout.css';

interface POSLayoutProps {
  user: AuthUser;
}

type ActiveView = 'sales' | 'stock' | 'clients' | 'reports' | 'users';

const POSLayout: React.FC<POSLayoutProps> = ({ user }) => {
  const [activeView, setActiveView] = useState<ActiveView>('sales');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Verificar permisos según rol
  const hasPermission = (requiredRoles: string[]): boolean => {
    return requiredRoles.includes(user.role);
  };

  const menuItems = [
    {
      id: 'sales' as ActiveView,
      label: 'Procesar Venta',
      icon: '🛒',
      roles: ['Cajero', 'Supervisor', 'Admin', 'SuperAdmin'],
      description: 'Registrar ventas'
    },
    {
      id: 'stock' as ActiveView,
      label: 'Control de Stock',
      icon: '📦',
      roles: ['Almacenero', 'Supervisor', 'Cajero', 'Admin', 'SuperAdmin'],
      description: 'Gestionar inventario'
    },
    {
      id: 'clients' as ActiveView,
      label: 'Registrar Cliente',
      icon: '👥',
      roles: ['Cajero', 'Admin', 'SuperAdmin', 'Supervisor'],
      description: 'Registrar clientes'
    },
    {
      id: 'users' as ActiveView,
      label: 'Gestión de Usuarios',
      icon: '👤',
      roles: ['SuperAdmin', 'Admin', 'Supervisor'],
      description: 'Crear empleados'
    },
    {
      id: 'reports' as ActiveView,
      label: 'Reportes',
      icon: '📊',
      roles: ['Supervisor', 'Admin', 'SuperAdmin'],
      description: 'Ver reportes'
    }
  ];

  const renderActiveComponent = () => {
    switch (activeView) {
      case 'sales':
        return <SalesComponent user={user} />;
      case 'stock':
        return <StockControl user={user} />;
      case 'clients':
        return <ClientRegistration user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'reports':
        return (
          <div className="coming-soon">
            <h3>Reportes</h3>
            <p>Módulo en desarrollo</p>
          </div>
        );
      default:
        return <SalesComponent user={user} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="pos-layout">
      {/* Header */}
      <header className="pos-header">
        <div className="header-left">
          <h1>Sistema POS</h1>
          <span className="user-info">
            Bienvenido, {user.nombre_completo} - {user.role}
          </span>
        </div>
        <div className="header-right">
          <span className="datetime">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="pos-main">
        {/* Sidebar */}
        <aside className={`pos-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="pos-sidebar-toggle" onClick={toggleSidebar}>
            {isSidebarCollapsed ? '→' : '←'}
          </button>
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              if (!hasPermission(item.roles)) return null;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <div className="nav-icon">{item.icon}</div>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <small className="nav-description">{item.description}</small>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="pos-content">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default POSLayout;
