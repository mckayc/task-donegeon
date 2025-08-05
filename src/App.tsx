import React, { useState, useEffect, useCallback } from 'react';
import { StatusAPIResponse } from './types';
import { LoaderCircle } from 'lucide-react';
import FirstRunWizard from './components/FirstRunWizard';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const LoadingScreen: React.FC = () => (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center text-donegeon-text">
        <LoaderCircle className="h-12 w-12 animate-spin text-donegeon-gold mb-4" />
        <h1 className="text-3xl font-medieval">Preparing the Donegeon...</h1>
    </div>
);

type AuthStatus = 'pending' | 'authenticated' | 'unauthenticated';

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('pending');
  const [appStatus, setAppStatus] = useState<StatusAPIResponse | null>(null);

  const checkStatusAndAuth = useCallback(async () => {
    try {
        const meResponse = await fetch('/api/me');
        if (meResponse.ok) {
            setAuthStatus('authenticated');
            return;
        }
        const statusResponse = await fetch('/api/status');
        if (!statusResponse.ok) throw new Error('Failed to fetch app status');
        const statusData: StatusAPIResponse = await statusResponse.json();
        setAppStatus(statusData);
        setAuthStatus('unauthenticated');
    } catch (error) {
        console.error("Auth check failed:", error);
        setAuthStatus('unauthenticated');
        setAppStatus(prev => prev || { firstRun: true, admins: [], db: 'ERROR', gemini: 'NOT_CONFIGURED', jwt: 'NOT_CONFIGURED' });
    }
  }, []);

  useEffect(() => {
    checkStatusAndAuth();
  }, [checkStatusAndAuth]);

  const handleLoginSuccess = () => {
    setAuthStatus('authenticated');
  };

  const handleLogout = async () => {
    setAuthStatus('pending');
    await fetch('/api/auth/logout', { method: 'POST' });
    checkStatusAndAuth();
  };
  
  const handleSetupComplete = () => {
     setAuthStatus('pending');
     checkStatusAndAuth();
  }

  if (authStatus === 'pending' || (authStatus === 'unauthenticated' && !appStatus)) {
      return <LoadingScreen />;
  }
  
  if (authStatus === 'authenticated') {
      return <Dashboard onLogout={handleLogout} />;
  }

  if (appStatus?.firstRun) {
     return <FirstRunWizard onSetupComplete={handleSetupComplete} />;
  }

  return <LoginScreen admins={appStatus?.admins || []} onLoginSuccess={handleLoginSuccess} />;
};

export default App;
