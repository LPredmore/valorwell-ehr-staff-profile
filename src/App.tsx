
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { IframeProvider } from '@/context/IframeContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Profile } from '@/pages/Profile';
import './index.css';

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
        <IframeProvider>
          <AuthProvider>
            <Router>
              <Toaster />
              <Routes>
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </AuthProvider>
        </IframeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
