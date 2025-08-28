
/**
 * Enhanced utilities for detecting and working with iframe environments
 */

export interface IframeConfig {
  isIframe: boolean;
  hideHeader: boolean;
  hideSidebar: boolean;
  initialRoute: string;
  parentOrigin: string;
  isIframeMode: boolean;
}

/**
 * Enhanced iframe detection with multiple fallback methods
 */
export const isInIframe = (): boolean => {
  try {
    // Method 1: Compare window references
    if (window.self !== window.top) {
      return true;
    }
    
    // Method 2: Check for parent window differences
    if (window.parent && window.parent !== window.self) {
      return true;
    }
    
    // Method 3: Check frameElement (works for same-origin)
    if (window.frameElement) {
      return true;
    }
    
    // Method 4: Check location ancestor origins
    if (window.location !== window.parent.location) {
      return true;
    }
    
    return false;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    console.log('Iframe detected via cross-origin exception');
    return true;
  }
};

/**
 * Gets comprehensive iframe configuration from URL parameters and environment
 */
export const getIframeConfig = (): IframeConfig => {
  const urlParams = new URLSearchParams(window.location.search);
  const isIframe = isInIframe();
  
  const config = {
    isIframe,
    hideHeader: urlParams.get('hideHeader') === 'true' || isIframe,
    hideSidebar: urlParams.get('hideSidebar') === 'true' || isIframe,
    initialRoute: urlParams.get('route') || '/profile',
    parentOrigin: urlParams.get('parentOrigin') || import.meta.env.VITE_PARENT_ORIGIN || '*',
    isIframeMode: isIframe || import.meta.env.VITE_IS_IFRAME_MODE === 'true',
  };
  
  console.log('getIframeConfig: Generated config:', config);
  return config;
};

/**
 * Enhanced message posting with retry logic and error handling
 */
export const postMessageToParent = (
  type: string, 
  data?: any, 
  options: { 
    retries?: number; 
    timeout?: number; 
    requireAck?: boolean 
  } = {}
): Promise<boolean> => {
  const { retries = 3, timeout = 5000, requireAck = false } = options;
  
  return new Promise((resolve, reject) => {
    if (!isInIframe() || !window.parent) {
      console.warn('Not in iframe or no parent window available');
      resolve(false);
      return;
    }

    const config = getIframeConfig();
    const messageId = `${type}_${Date.now()}_${Math.random()}`;
    
    const message = {
      source: 'valorwell-staff-profile',
      type,
      data,
      messageId,
      timestamp: new Date().toISOString(),
    };

    let attempt = 0;
    let ackReceived = false;

    const sendMessage = () => {
      try {
        window.parent.postMessage(message, config.parentOrigin);
        console.log(`Message sent to parent (attempt ${attempt + 1}):`, type, data);
        
        if (!requireAck) {
          resolve(true);
          return;
        }

        // Wait for acknowledgment if required
        const ackHandler = (event: MessageEvent) => {
          if (event.data?.type === 'ack' && event.data?.messageId === messageId) {
            ackReceived = true;
            window.removeEventListener('message', ackHandler);
            resolve(true);
          }
        };

        window.addEventListener('message', ackHandler);
        
        setTimeout(() => {
          if (!ackReceived) {
            window.removeEventListener('message', ackHandler);
            
            if (attempt < retries - 1) {
              attempt++;
              setTimeout(sendMessage, 1000 * attempt); // Exponential backoff
            } else {
              reject(new Error(`Failed to send message after ${retries} attempts`));
            }
          }
        }, timeout);

      } catch (error) {
        console.error('Error sending message to parent:', error);
        
        if (attempt < retries - 1) {
          attempt++;
          setTimeout(sendMessage, 1000 * attempt);
        } else {
          reject(error);
        }
      }
    };

    sendMessage();
  });
};

/**
 * Enhanced parent message listener with proper cleanup and error handling
 */
export const setupParentMessageListener = (
  callback: (type: string, data: any, origin: string) => void,
  options: { 
    allowedOrigins?: string[]; 
    validateSource?: boolean 
  } = {}
) => {
  const { allowedOrigins = [], validateSource = true } = options;
  const config = getIframeConfig();

  const handleMessage = (event: MessageEvent) => {
    try {
      // Validate origin if specified
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
        console.warn('Message from unauthorized origin:', event.origin);
        return;
      }

      // Validate message structure
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Validate source if required
      if (validateSource && event.data.target !== 'valorwell-staff-profile') {
        return;
      }

      console.log('Received message from parent:', event.data);
      callback(event.data.type, event.data.data, event.origin);

      // Send acknowledgment if requested
      if (event.data.requireAck) {
        window.parent?.postMessage({
          source: 'valorwell-staff-profile',
          type: 'ack',
          messageId: event.data.messageId,
        }, event.origin);
      }
    } catch (error) {
      console.error('Error handling parent message:', error, event);
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
    console.log('Parent message listener cleaned up');
  };
};

/**
 * Notifies parent of navigation events with enhanced data
 */
export const notifyParentNavigation = async (path: string, additionalData?: any) => {
  try {
    await postMessageToParent('navigation', { 
      path,
      hash: window.location.hash,
      search: window.location.search,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  } catch (error) {
    console.error('Failed to notify parent of navigation:', error);
  }
};

/**
 * Notifies parent of authentication events with enhanced security
 */
export const notifyParentAuth = async (event: 'login' | 'logout' | 'session-refresh', user?: any) => {
  try {
    await postMessageToParent('auth', { 
      event, 
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        // Don't send sensitive data
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to notify parent of auth event:', error);
  }
};

/**
 * Notifies parent of form submissions and data changes
 */
export const notifyParentDataChange = async (type: string, data: any, context?: string) => {
  try {
    await postMessageToParent('data-change', {
      type,
      data,
      context,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to notify parent of data change:', error);
  }
};

/**
 * Requests data from parent application
 */
export const requestParentData = async (type: string, params?: any): Promise<any> => {
  try {
    return new Promise((resolve, reject) => {
      const messageId = `request_${Date.now()}_${Math.random()}`;
      
      const responseHandler = (event: MessageEvent) => {
        if (event.data?.type === 'response' && event.data?.messageId === messageId) {
          window.removeEventListener('message', responseHandler);
          
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error || 'Request failed'));
          }
        }
      };

      window.addEventListener('message', responseHandler);
      
      postMessageToParent('request', {
        type,
        params,
        messageId,
        responseRequired: true,
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('message', responseHandler);
        reject(new Error('Request timeout'));
      }, 10000);
    });
  } catch (error) {
    console.error('Failed to request data from parent:', error);
    throw error;
  }
};

/**
 * Gets iframe-specific styling classes
 */
export const getIframeClasses = () => {
  const config = getIframeConfig();
  
  if (!config.isIframeMode) {
    return {
      container: 'min-h-screen',
      main: 'p-6',
      header: '',
      content: ''
    };
  }

  return {
    container: 'h-full iframe-container',
    main: 'p-4 h-full overflow-auto iframe-main',
    header: config.hideHeader ? 'hidden' : 'iframe-header',
    content: 'iframe-content'
  };
};
