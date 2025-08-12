import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { UIStateProvider } from './context/UIStateContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { DeveloperProvider } from './context/DeveloperContext';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
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
    <NotificationsProvider>
      <AppProvider>
        <UIStateProvider>
          <DeveloperProvider>
            <App />
          </DeveloperProvider>
        </UIStateProvider>
      </AppProvider>
    </NotificationsProvider>
  </React.StrictMode>
);
