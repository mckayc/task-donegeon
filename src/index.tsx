import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AppProviders from './context/AppProviders';
import { logger } from './utils/logger';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      logger.log('SW registered: ', registration);
    }).catch(registrationError => {
      logger.error('SW registration failed: ', registrationError);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);