/**
 * App.tsx — root component, providers + routes.
 *
 * The heavy App.jsx content (views, components) from v1 is migrated into
 * separate files under src/components/ and src/pages/.
 * This file is intentionally thin — it just wires providers and routes.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { AdModal } from '@/components/ads/AdModal';
import { useAds } from '@/hooks/useAds';

// Lazy-loaded pages for better initial load time
const Dashboard  = lazy(() => import('@/pages/Dashboard'));
const Routines   = lazy(() => import('@/pages/Routines'));
const Workout    = lazy(() => import('@/pages/Workout'));
const History    = lazy(() => import('@/pages/History'));
const AdminPanel = lazy(() => import('@/pages/admin/AdminPanel'));

function AppRoutes() {
  const { showAd, dismissAd } = useAds();

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                  element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/routines"          element={<Routines />} />
          <Route path="/routines/new"      element={<Routines formMode="new" />} />
          <Route path="/routines/:id/edit" element={<Routines formMode="edit" />} />
          <Route path="/workout"           element={<Workout />} />
          <Route path="/history"           element={<History />} />
          <Route path="/admin"             element={<AdminPanel />} />
          <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <AdModal isOpen={showAd} onClose={dismissAd} />
    </>
  );
}

function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[var(--bg-page)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <WorkoutProvider>
            <AppRoutes />
          </WorkoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
