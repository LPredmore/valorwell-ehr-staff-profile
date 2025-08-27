
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isInIframe } from './utils/iframeUtils'

// Apply iframe-specific classes and setup
const setupIframeEnvironment = () => {
  if (isInIframe()) {
    // Add iframe mode class to body
    document.body.classList.add('iframe-mode');
    
    // Ensure proper sizing for iframe
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Set up viewport meta tag if not present
    let viewport = document.querySelector('meta[name=viewport]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
    
    // Add iframe-specific meta tags
    const iframeMeta = document.createElement('meta');
    iframeMeta.setAttribute('name', 'referrer');
    iframeMeta.setAttribute('content', 'origin-when-cross-origin');
    document.head.appendChild(iframeMeta);
    
    console.log('Iframe environment setup complete');
  } else {
    console.log('Running in standalone mode');
  }
};

// Initialize iframe environment
setupIframeEnvironment();

// Handle iframe resize events
if (isInIframe()) {
  const handleResize = () => {
    const event = new CustomEvent('iframe-resize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight,
        timestamp: Date.now(),
      }
    });
    
    window.dispatchEvent(event);
    
    // Notify parent of size changes if in iframe
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          source: 'valorwell-staff-profile',
          type: 'resize',
          data: {
            width: window.innerWidth,
            height: window.innerHeight,
            timestamp: Date.now(),
          }
        }, '*');
      } catch (error) {
        console.warn('Could not notify parent of resize:', error);
      }
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // Initial size notification
  setTimeout(handleResize, 100);
}

// Error handling for iframe context
window.addEventListener('error', (event) => {
  if (isInIframe() && window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({
        source: 'valorwell-staff-profile',
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now(),
        }
      }, '*');
    } catch (error) {
      console.warn('Could not notify parent of error:', error);
    }
  }
});

// Render the app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
