
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  getIframeConfig, 
  setupParentMessageListener, 
  postMessageToParent,
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
  const [config] = useState<IframeConfig>(() => getIframeConfig());
  const [parentAuth, setParentAuth] = useState<ParentAuth | undefined>();
  const [isReady, setIsReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string>();

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

    console.log('Setting up iframe communication for profile-only app');

    // Set up message listener for parent communication
    const cleanup = setupParentMessageListener(
      (type, data, origin) => {
        console.log('Received message from parent:', { type, data, origin });
        
        try {
          switch (type) {
            case 'auth-state':
              setParentAuth(data);
              setConnectionStatus('connected');
              setIsReady(true);
              console.log('Parent auth state received:', data);
              
              // Notify parent that we're showing the profile
              sendMessage('navigation', { 
                path: '/profile',
                timestamp: new Date().toISOString()
              });
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
              console.log('Unhandled message type from parent:', type);
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

    // Notify parent that profile app is ready
    const initializeConnection = async () => {
      try {
        await postMessageToParent('ready', {
          currentRoute: '/profile',
          appType: 'staff-profile',
          capabilities: {
            profileEdit: true,
            auth: true,
          },
          timestamp: new Date().toISOString(),
        });
        
        // Request initial auth state from parent
        await postMessageToParent('request-auth-state');
        
        console.log('Profile app initialization complete');
      } catch (error) {
        console.error('Failed to initialize iframe connection:', error);
        setLastError(error instanceof Error ? error.message : 'Failed to connect to parent');
        setConnectionStatus('error');
      }
    };

    // Initialize connection
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

  const value: IframeContextType = {
    config,
    sendMessage,
    parentAuth,
    isReady,
    connectionStatus,
    lastError,
  };

  return (
    <IframeContext.Provider value={value}>
      {children}
    </IframeContext.Provider>
  );
};
