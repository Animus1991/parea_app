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

import React from 'react';
type EBProps = { children: React.ReactNode };
type EBState = { hasError: boolean; error: any };
class ErrorBoundary extends React.Component<EBProps, EBState> {
  public declare props: EBProps;
  public state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: 20, color: 'red'}}><h1>Something went wrong.</h1><pre>{this.state.error?.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
