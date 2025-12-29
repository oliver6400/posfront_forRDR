// src/pages/Menu/Menu.tsx
import React, { useState } from 'react';
import POS from './POS';
import Settings from './Settings';
import type { AuthUser } from '../../types/user.types';
import './Menu.css';

interface MenuOption {
  id: string;
  label: string;
  icon: string;
  roles: string[];
}

interface MenuProps {
  user: AuthUser;
}

const menuOptions: MenuOption[] = [
  {
    id: 'pos',
    label: 'Sistema POS',
    icon: '🛒',
    roles: ['Cajero', 'Supervisor', 'Admin', 'SuperAdmin'],
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: '📊',
    roles: ['Supervisor', 'Admin', 'SuperAdmin'],
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: '👥',
    roles: ['Admin', 'SuperAdmin', 'Supervisor'],
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: '⚙️',
    roles: ['SuperAdmin', 'Admin'],
  }
  // Puedes agregar más opciones aquí
];

const Menu: React.FC<MenuProps> = ({ user }) => {
  const [activeOption, setActiveOption] = useState<string>('pos'); // Default al POS
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  const toggleMenu = () => {
    setIsMenuCollapsed(!isMenuCollapsed);
  };

  // Filtrar opciones basadas en el rol del usuario
  const availableOptions = menuOptions.filter(option =>
    option.roles.includes(user.role)
  );

  const renderActiveComponent = () => {
    switch (activeOption) {
      case 'pos':
        return <POS user={user} />; // Pasar el usuario real aquí
      case 'reports':
        return (
          <div className="coming-soon">
            <h3>Reportes</h3>
            <p>Módulo en desarrollo</p>
          </div>
        );
      case 'users':
        return (
          <div className="coming-soon">
            <h3>Gestión de Usuarios</h3>
            <p>Módulo en desarrollo</p>
          </div>
        );
      case 'settings':
        return <Settings user={user} />;
      default:
        return <POS user={user} />;
    }
  };

  // Si solo hay una opción disponible (POS), renderizar directamente
  if (availableOptions.length === 1 && availableOptions[0].id === 'pos') {
    return <POS user={user} />;
  }

  return (
    <div className="menu-container">
      {/* Solo mostrar menú si hay múltiples opciones */}
      {availableOptions.length > 1 && (
        <div className={`menu-header ${isMenuCollapsed ? 'collapsed' : ''}`}>
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuCollapsed ? '→' : '←'}
          </button>
          <div className="menu-header-content">
            <h2>Menú Principal</h2>
            <p>Bienvenido, {user.nombre_completo} - {user.role}</p>

            <nav className="menu-options">
              {availableOptions.map((option) => (
                <button
                  key={option.id}
                  className={`menu-option ${activeOption === option.id ? 'active' : ''}`}
                  onClick={() => setActiveOption(option.id)}
                >
                  <span className="menu-icon">{option.icon}</span>
                  <span className="menu-label">{option.label}</span>
                </button>
              ))}
            </nav>
            </div>
          </div>
      )}

          {/* Renderizar el componente activo */}
          <div className="menu-content">
            {renderActiveComponent()}
          </div>
        </div>
      );
};

      export default Menu;
