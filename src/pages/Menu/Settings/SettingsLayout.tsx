// src/pages/Menu/Settings/SettingsLayout.tsx
import React, { useState } from 'react';
import type { AuthUser } from '../../../types/user.types';


// Importar componentes
import CityManager from './components/CityManager';
import BranchManager from './components/BranchManager';
import CashRegisterManager from './components/CashRegisterManager';
import PaymentMethod from './components/PaymentMethod';

import './SettingsLayout.css';
interface SettingsLayoutProps {
  user: AuthUser;
} 

type SettingsView = 'cities' | 'branches' | 'cash_registers' | 'payment_methods';

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ user }) => {
  const [activeView, setActiveView] = useState<SettingsView>('cities');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Verificar permisos según rol
  const hasPermission = (requiredRoles: string[]): boolean => {
    return requiredRoles.includes(user.role);
  };

  interface MenuItem {
    id: SettingsView;
    label: string;
    description: string;
    icon: string;
    roles: string[];
  }

  const menuItems: MenuItem[] = [
    {
      id: 'cities',
      label: 'Ciudades',
      icon: '🌍',
      roles: ['SuperAdmin', 'Admin'],
      description: 'Gestionar ciudades'
    },
    {
      id: 'branches',
      label: 'Sucursales',
      icon: '🏢',
      roles: ['SuperAdmin', 'Admin'],
      description: 'Gestionar sucursales'
    },
    {
      id: 'cash_registers',
      label: 'Cajas POS',
      icon: '💰',
      roles: ['SuperAdmin', 'Admin'],
      description: 'Gestionar cajas registradoras'
    },
    {
      id: 'payment_methods',
      label: 'Métodos de Pago',
      icon: '💳',
      roles: ['SuperAdmin', 'Admin'],
      description: 'Gestionar métodos de pago'
    }
  ];

  const renderActiveComponent = () => {
    switch (activeView) {
      case 'cities':
        return <CityManager user={user} />;
      case 'branches':
        return <BranchManager user={user} />;
      case 'cash_registers':
        return <CashRegisterManager user={user} />;
      case 'payment_methods':
        return <PaymentMethod user={user} />;
      default:
        return <CityManager user={user} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="settings-layout">
      {/* Header */}
      <header className="settings-header">
        <div className="header-left">
          <h1>Configuracion</h1>
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

      <div className="settings-main">
        {/* Sidebar */}
        <aside className={`settings-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="settings-sidebar-toggle" onClick={toggleSidebar}>
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
        <main className="settings-content">
          {renderActiveComponent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
