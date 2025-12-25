// src/pages/Menu/POS/index.tsx
import React from 'react';
import type { AuthUser } from '../../../types/user.types';
import POSLayout from './POSLayout';

interface POSProps {
  user: AuthUser;
}

const POS: React.FC<POSProps> = ({ user }) => {
  return <POSLayout user={user} />;
};

export default POS;
