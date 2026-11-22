import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { bootstrap } from './lib/bootstrap';
import { registerServiceWorker } from './lib/serviceWorker';
import { LanguageProvider } from './lib/LanguageProvider';
import { MotionConfig } from 'motion/react';
import { RootErrorFallback } from './components/common/RootErrorFallback';

bootstrap();

// Suppress unhandled Google Maps script errors in dev overlay
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('Google Maps') || e.message.includes('InvalidKeyMapError') || e.message === 'Script error.')) {
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

(window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
  console.warn('Google Maps Authentication Failed. API Key may be invalid or restricted.');
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: unknown }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <RootErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          {/* WCAG 2.3.3 — JS-driven (motion) animations also honour prefers-reduced-motion, like the CSS ones. */}
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

registerServiceWorker();
