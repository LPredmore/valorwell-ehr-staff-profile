
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IframeProvider, useIframe } from '@/context/IframeContext';
import { Toaster } from '@/components/ui/toaster';
import { Profile } from '@/pages/Profile';
import { Loader2, AlertCircle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// App content that handles authentication flexibly
const AppContent: React.FC = () => {
  const { isReady, parentAuth, connectionStatus, lastError, config } = useIframe();

  useEffect(() => {
    console.log('AppContent: Current state:', { 
      isReady, 
      hasParentAuth: !!parentAuth, 
      connectionStatus,
      isIframeMode: config.isIframeMode 
    });
  }, [isReady, parentAuth, connectionStatus, config.isIframeMode]);

  // Show loading only while connecting, not waiting for auth
  if (!isReady || connectionStatus === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {config.isIframeMode ? 'Connecting to parent application...' : 'Loading application...'}
          </p>
        </div>
      </div>
    );
  }

  // Show error only for actual connection errors, not missing auth
  if (connectionStatus === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Failed to connect to parent application.
            {lastError && ` Error: ${lastError}`}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Always render Profile - it will handle its own auth (parent or local)
  console.log('AppContent: Rendering Profile component');
  return <Profile />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IframeProvider>
        <AppContent />
        <Toaster />
      </IframeProvider>
    </QueryClientProvider>
  );
}

export default App;
