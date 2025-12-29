// src/pages/Menu/Settings/index.tsx
import React from 'react';
import type { AuthUser } from '../../../types/user.types';
import SettingsLayout from './SettingsLayout';

interface SettingsProps {
  user: AuthUser;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  return <SettingsLayout user={user} />;
};

export default Settings;