import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotificationsProvider } from './context/NotificationsContext';
import { AuthProvider } from './context/AuthContext';
import { DeveloperProvider } from './context/DeveloperContext';
import { DataProvider } from './context/DataProvider';
import { UIProvider } from './context/UIContext';
import { ActionsProvider } from './context/ActionsContext';
import ErrorBoundary from './components/system/ErrorBoundary';

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
    <ErrorBoundary>
      <NotificationsProvider>
        <AuthProvider>
          <DataProvider>
            <UIProvider>
              <ActionsProvider>
                <DeveloperProvider>
                  <App />
                </DeveloperProvider>
              </ActionsProvider>
            </UIProvider>
          </DataProvider>
        </AuthProvider>
      </NotificationsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
