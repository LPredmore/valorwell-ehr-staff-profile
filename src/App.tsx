
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

// App content that waits for parent authentication
const AppContent: React.FC = () => {
  const { isReady, parentAuth, connectionStatus, lastError } = useIframe();

  useEffect(() => {
    console.log('AppContent state:', { isReady, parentAuth, connectionStatus });
  }, [isReady, parentAuth, connectionStatus]);

  // Show loading while establishing connection
  if (!isReady || connectionStatus === 'connecting') {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Connecting to parent application...</p>
        </div>
      </div>
    );
  }

  // Show error if connection failed
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

  // Show loading while waiting for parent authentication
  if (!parentAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Waiting for authentication...</p>
        </div>
      </div>
    );
  }

  // Authentication established - render Profile
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
