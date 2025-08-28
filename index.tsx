import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import AppProviders from './src/context/AppProviders';
import { swLogger } from './src/utils/swLogger';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      swLogger.log('REGISTRATION_SUCCESS', { scope: registration.scope });
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
      swLogger.log('REGISTRATION_FAILED', { error: registrationError.message });
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