import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getIframeConfig, 
  setupParentMessageListener, 
  postMessageToParent 
} from '@/utils/iframeUtils';

interface IframeConfig {
  isIframe: boolean;
  hideHeader: boolean;
  hideSidebar: boolean;
  initialRoute: string;
  parentOrigin: string;
}

interface IframeContextType {
  config: IframeConfig;
  sendMessage: (type: string, data?: any) => void;
  parentAuth?: {
    user: any;
    token: string;
  };
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
  const [config] = useState<IframeConfig>(getIframeConfig());
  const [parentAuth, setParentAuth] = useState<{
    user: any;
    token: string;
  } | undefined>();

  useEffect(() => {
    if (!config.isIframe) return;

    // Set up message listener for parent communication
    const cleanup = setupParentMessageListener((type, data) => {
      switch (type) {
        case 'auth-state':
          setParentAuth(data);
          break;
        case 'navigate':
          // Handle navigation requests from parent
          window.location.hash = data.path;
          break;
        case 'config-update':
          // Handle configuration updates from parent
          console.log('Config update from parent:', data);
          break;
        default:
          console.log('Unknown message from parent:', type, data);
      }
    });

    // Notify parent that iframe is ready
    postMessageToParent('ready', {
      currentRoute: window.location.pathname,
    });

    return cleanup;
  }, [config.isIframe]);

  const sendMessage = (type: string, data?: any) => {
    postMessageToParent(type, data);
  };

  const value = {
    config,
    sendMessage,
    parentAuth,
  };

  return (
    <IframeContext.Provider value={value}>
      {children}
    </IframeContext.Provider>
  );
};