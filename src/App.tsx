
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Page imports
import Index from '@/pages/Index';
import { Profile } from '@/pages/Profile';

// Template page imports
import { TemplatesPage } from '@/features/templates/pages/TemplatesPage';
import { CreateTemplatePage } from '@/features/templates/pages/CreateTemplatePage';
import { EditTemplatePage } from '@/features/templates/pages/EditTemplatePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary context="App Root">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Toaster />
            <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/templates" element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['clinician', 'admin']}>
                  <Layout>
                    <TemplatesPage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/templates/create" element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['clinician', 'admin']}>
                  <Layout>
                    <CreateTemplatePage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/templates/:id/edit" element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['clinician', 'admin']}>
                  <Layout>
                    <EditTemplatePage />
                  </Layout>
                </RoleGuard>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
