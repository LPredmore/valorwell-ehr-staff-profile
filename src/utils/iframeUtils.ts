/**
 * Utilities for detecting and working with iframe environments
 */

/**
 * Detects if the application is running inside an iframe
 */
export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
};

/**
 * Gets the iframe configuration from URL parameters or parent communication
 */
export const getIframeConfig = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    isIframe: isInIframe(),
    hideHeader: urlParams.get('hideHeader') === 'true',
    hideSidebar: urlParams.get('hideSidebar') === 'true',
    initialRoute: urlParams.get('route') || '/',
    parentOrigin: urlParams.get('parentOrigin') || '*',
  };
};

/**
 * Safely posts a message to the parent window
 */
export const postMessageToParent = (type: string, data?: any) => {
  if (isInIframe() && window.parent) {
    const config = getIframeConfig();
    window.parent.postMessage(
      {
        source: 'valorwell-microfrontend',
        type,
        data,
      },
      config.parentOrigin
    );
  }
};

/**
 * Sets up a listener for messages from the parent window
 */
export const setupParentMessageListener = (
  callback: (type: string, data: any) => void
) => {
  const handleMessage = (event: MessageEvent) => {
    // Validate message structure
    if (
      event.data &&
      typeof event.data === 'object' &&
      event.data.target === 'valorwell-microfrontend'
    ) {
      callback(event.data.type, event.data.data);
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};

/**
 * Notifies parent of navigation events
 */
export const notifyParentNavigation = (path: string) => {
  postMessageToParent('navigation', { path });
};

/**
 * Notifies parent of authentication events
 */
export const notifyParentAuth = (event: 'login' | 'logout', user?: any) => {
  postMessageToParent('auth', { event, user });
};