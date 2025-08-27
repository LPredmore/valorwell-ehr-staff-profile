
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getIframeConfig, 
  setupParentMessageListener, 
  postMessageToParent,
  notifyParentAuth,
  IframeConfig
} from '@/utils/iframeUtils';

interface ParentAuth {
  user: any;
  token: string;
  sessionId?: string;
  expiresAt?: string;
}

interface IframeContextType {
  config: IframeConfig;
  sendMessage: (type: string, data?: any) => Promise<boolean>;
  parentAuth?: ParentAuth;
  isReady: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError?: string;
  refreshConfig: () => void;
}

const IframeContext = createContext<IframeContextType | undefined>(undefined);

export const useIframe = () => {
  const context = useContext(IframeContext);
  if (context === undefined) {
    throw new Error('useIframe must be used within an IframeProvider');
  }
  return context;
};

export const IframeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [config, setConfig] = useState<IframeConfig>(() => getIframeConfig());
  const [parentAuth, setParentAuth] = useState<ParentAuth | undefined>();
  const [isReady, setIsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string>();

  const refreshConfig = useCallback(() => {
    const newConfig = getIframeConfig();
    setConfig(newConfig);
    console.log('Iframe config refreshed:', newConfig);
  }, []);

  const sendMessage = useCallback(async (type: string, data?: any): Promise<boolean> => {
    try {
      await postMessageToParent(type, data);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      setConnectionStatus('error');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!config.isIframeMode) {
      setIsReady(true);
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    console.log('Setting up iframe communication with config:', config);

    // Set up message listener for parent communication
    const cleanup = setupParentMessageListener(
      (type, data, origin) => {
        console.log('Received message from parent:', { type, data, origin });
        
        try {
          switch (type) {
            case 'auth-state':
              setParentAuth(data);
              setConnectionStatus('connected');
              console.log('Parent auth state updated:', data);
              break;
              
            case 'navigate':
              // Handle navigation requests from parent
              if (data.path) {
                if (data.replace) {
                  window.location.replace(`#${data.path}`);
                } else {
                  window.location.hash = data.path;
                }
                console.log('Navigated to:', data.path);
              }
              break;
              
            case 'config-update':
              // Handle configuration updates from parent
              setConfig(current => ({
                ...current,
                ...data,
              }));
              console.log('Config updated by parent:', data);
              break;
              
            case 'refresh-auth':
              // Handle auth refresh requests
              notifyParentAuth('session-refresh');
              break;
              
            case 'ready-ack':
              setIsReady(true);
              setConnectionStatus('connected');
              console.log('Parent acknowledged ready state');
              break;
              
            case 'ping':
              // Respond to parent ping with pong
              sendMessage('pong', { timestamp: new Date().toISOString() });
              break;
              
            default:
              console.log('Unknown message type from parent:', type, data);
          }
        } catch (error) {
          console.error('Error handling parent message:', error);
          setLastError(error instanceof Error ? error.message : 'Unknown error');
          setConnectionStatus('error');
        }
      },
      {
        allowedOrigins: config.parentOrigin !== '*' ? [config.parentOrigin] : [],
        validateSource: true
      }
    );

    // Notify parent that iframe is ready and send initial state
    const initializeConnection = async () => {
      try {
        await postMessageToParent('ready', {
          currentRoute: window.location.hash || '#/',
          config: config,
          capabilities: {
            navigation: true,
            auth: true,
            dataSync: true,
          },
          timestamp: new Date().toISOString(),
        });
        
        // Request initial auth state from parent
        await postMessageToParent('request-auth-state');
        
        console.log('Iframe initialization complete');
      } catch (error) {
        console.error('Failed to initialize iframe connection:', error);
        setLastError(error instanceof Error ? error.message : 'Failed to connect to parent');
        setConnectionStatus('error');
      }
    };

    // Initialize connection with a slight delay to ensure everything is set up
    const initTimer = setTimeout(initializeConnection, 100);

    // Set up periodic health check
    const healthCheckInterval = setInterval(() => {
      if (connectionStatus === 'connected') {
        sendMessage('health-check', { timestamp: new Date().toISOString() });
      }
    }, 30000); // Every 30 seconds

    // Cleanup function
    return () => {
      clearTimeout(initTimer);
      clearInterval(healthCheckInterval);
      cleanup();
      console.log('Iframe context cleanup completed');
    };
  }, [config.isIframeMode, config.parentOrigin, sendMessage, connectionStatus]);

  // Handle URL parameter changes
  useEffect(() => {
    const handlePopState = () => {
      refreshConfig();
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [refreshConfig]);

  // Handle authentication state changes
  useEffect(() => {
    if (parentAuth && config.isIframeMode) {
      console.log('Parent auth available, syncing with local state');
      // Could integrate with local auth context here if needed
    }
  }, [parentAuth, config.isIframeMode]);

  const value: IframeContextType = {
    config,
    sendMessage,
    parentAuth,
    isReady,
    connectionStatus,
    lastError,
    refreshConfig,
  };

  return (
    <IframeContext.Provider value={value}>
      {children}
    </IframeContext.Provider>
  );
};
