import React from 'react';
import RoutinesPage from '@/components/routines/RoutinesPage';

export default function Routines({ formMode }: { formMode?: 'new' | 'edit' }) {
  return <RoutinesPage {...(formMode ? { formMode } : {})} />;
}
