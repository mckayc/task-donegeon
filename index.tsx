import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import AppProviders from './src/context/AppProviders';
import { swLogger } from './src/utils/swLogger';

// Extend the Window interface to include our custom function
declare global {
  interface Window {
    checkForUpdate?: () => Promise<void>;
  }
}

const dispatchUpdateAvailableEvent = (worker: ServiceWorker) => {
    window.dispatchEvent(new CustomEvent('swUpdateAvailable', { detail: worker }));
};

if ('serviceWorker' in navigator) {
  // Register the service worker immediately, not waiting for 'load'
  navigator.serviceWorker.register('/sw.js').then(registration => {
    console.log('SW registered: ', registration);
    swLogger.log('REGISTRATION_SUCCESS', { scope: registration.scope });

    // 1. Check for a waiting worker immediately on registration.
    // This catches updates that were downloaded before this page loaded.
    if (registration.waiting) {
      swLogger.log('UPDATE_WAITING_ON_LOAD', { state: registration.waiting.state });
      dispatchUpdateAvailableEvent(registration.waiting);
    }

    // 2. Listen for new updates that are found while the page is open.
    registration.addEventListener('updatefound', () => {
      swLogger.log('UPDATE_FOUND_EVENT_LISTENER');
      const newWorker = registration.installing;
      if (newWorker) {
        swLogger.log('NEW_WORKER_INSTALLING', { state: newWorker.state });
        newWorker.addEventListener('statechange', () => {
          swLogger.log('NEW_WORKER_STATE_CHANGE', { state: newWorker.state });
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            swLogger.log('NEW_WORKER_INSTALLED_AND_WAITING');
            dispatchUpdateAvailableEvent(newWorker);
          }
        });
      }
    });
  }).catch(registrationError => {
    console.log('SW registration failed: ', registrationError);
    swLogger.log('REGISTRATION_FAILED', { error: registrationError.message });
  });

  // 3. Listen for the new service worker taking control.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    swLogger.log('CONTROLLER_CHANGE_EVENT_TRIGGERED');
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });

  // 4. Expose a function for manual update checks from the UI.
  window.checkForUpdate = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;
        swLogger.log('MANUAL_UPDATE_CHECK_FROM_UI');
        await registration.update();
    } catch (error) {
        swLogger.log('MANUAL_UPDATE_CHECK_ERROR', { error: (error as Error).message });
        console.error('Error during manual SW update check:', error);
    }
  };
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
