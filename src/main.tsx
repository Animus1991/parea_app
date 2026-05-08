import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Suppress unhandled Google Maps script errors in dev overlay
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('Google Maps') || e.message.includes('InvalidKeyMapError') || e.message === 'Script error.')) {
     // Prevent Vite error overlay
     e.preventDefault();
     console.warn('Suppressed global script error:', e.message);
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('Google Maps') || e.reason.message.includes('InvalidKeyMapError'))) {
     e.preventDefault();
     console.warn('Suppressed global rejection:', e.reason.message);
  }
});

// Also define gm_authFailure to catch auth errors quietly
(window as any).gm_authFailure = () => {
  console.warn('Google Maps Authentication Failed. API Key may be invalid or restricted.');
};

import { LanguageProvider } from './lib/i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
