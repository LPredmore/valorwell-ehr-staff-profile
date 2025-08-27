import React, { useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { IframeProvider, useIframe } from '@/context/IframeContext';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGuard } from '@/components/RoleGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { notifyParentNavigation, getIframeClasses } from '@/utils/iframeUtils';

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
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Enhanced Route Notifier with better error handling
const RouteNotifier: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, sendMessage, isReady } = useIframe();

  useEffect(() => {
    if (config.isIframeMode && isReady) {
      notifyParentNavigation(location.pathname + location.search + location.hash, {
        state: location.state,
        key: location.key,
      }).catch(error => {
        console.error('Failed to notify parent of navigation:', error);
      });
    }
  }, [location.pathname, location.search, location.hash, location.state, location.key, config.isIframeMode, isReady]);

  // Handle initial route from iframe config
  useEffect(() => {
    if (config.isIframeMode && config.initialRoute && config.initialRoute !== '/') {
      const currentPath = location.pathname + location.search + location.hash;
      if (currentPath !== config.initialRoute) {
        console.log('Navigating to initial iframe route:', config.initialRoute);
        navigate(config.initialRoute, { replace: true });
      }
    }
  }, [config.isIframeMode, config.initialRoute, navigate, location]);

  return null;
};

// Loading component for Suspense
const LoadingSpinner: React.FC = () => {
  const { config } = useIframe();
  const classes = getIframeClasses();
  
  return (
    <div className={`${classes.container} flex items-center justify-center bg-background`}>
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
};

// Iframe-aware Layout wrapper
const IframeAwareLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useIframe();
  
  // In iframe mode with both header and sidebar hidden, render children directly
  if (config.isIframeMode && config.hideHeader && config.hideSidebar) {
    const classes = getIframeClasses();
    return (
      <div className={classes.container}>
        <main className={classes.main}>
          {children}
        </main>
      </div>
    );
  }
  
  // Otherwise use the normal Layout component
  return <Layout>{children}</Layout>;
};

// Main App Routes component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <IframeAwareLayout>
              <Index />
            </IframeAwareLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route path="/templates" element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={['clinician', 'admin']}>
            <IframeAwareLayout>
              <TemplatesPage />
            </IframeAwareLayout>
          </RoleGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/templates/create" element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={['clinician', 'admin']}>
            <IframeAwareLayout>
              <CreateTemplatePage />
            </IframeAwareLayout>
          </RoleGuard>
        </ProtectedRoute>
      } />
      
      <Route path="/templates/:id/edit" element={
        <ProtectedRoute>
          <RoleGuard allowedRoles={['clinician', 'admin']}>
            <IframeAwareLayout>
              <EditTemplatePage />
            </IframeAwareLayout>
          </RoleGuard>
        </ProtectedRoute>
      } />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <IframeAwareLayout>
              <Profile />
            </IframeAwareLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback route for iframe mode */}
      <Route 
        path="*" 
        element={
          <ProtectedRoute>
            <IframeAwareLayout>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
                  <p className="text-muted-foreground">The requested page does not exist in the staff profile application.</p>
                </div>
              </div>
            </IframeAwareLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

// Connection Status Indicator for iframe mode
const IframeConnectionStatus: React.FC = () => {
  const { config, connectionStatus, lastError } = useIframe();
  
  if (!config.isIframeMode || connectionStatus === 'connected') {
    return null;
  }
  
  return (
    <div className="fixed top-2 right-2 z-50">
      <div className={`px-3 py-1 rounded text-sm ${
        connectionStatus === 'error' ? 'bg-destructive text-destructive-foreground' :
        connectionStatus === 'connecting' ? 'bg-warning text-warning-foreground' :
        'bg-muted text-muted-foreground'
      }`}>
        {connectionStatus === 'error' && `Connection Error${lastError ? `: ${lastError}` : ''}`}
        {connectionStatus === 'connecting' && 'Connecting to parent...'}
        {connectionStatus === 'disconnected' && 'Disconnected from parent'}
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary context="App Root" fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Application Error</h1>
          <p className="text-muted-foreground mb-4">
            The staff profile application encountered an error and needs to be reloaded.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Reload Application
          </button>
        </div>
      </div>
    }>
      <QueryClientProvider client={queryClient}>
        <IframeProvider>
          <AuthProvider>
            <HashRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <RouteNotifier />
                <IframeConnectionStatus />
                <Toaster />
                <ErrorBoundary context="Application Routes">
                  <AppRoutes />
                </ErrorBoundary>
              </Suspense>
            </HashRouter>
          </AuthProvider>
        </IframeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
