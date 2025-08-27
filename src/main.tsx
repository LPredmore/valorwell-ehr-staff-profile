import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { isInIframe } from './utils/iframeUtils'

// Apply iframe-specific classes
if (isInIframe()) {
  document.body.classList.add('iframe-mode');
}

createRoot(document.getElementById("root")!).render(<App />);
