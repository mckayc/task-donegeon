
import React, { useState, useEffect, useCallback } from 'react';
import FirstRunWizard from './screens/FirstRunWizard';
import { LoginScreen } from './screens/LoginScreen';
import { Dashboard } from './screens/Dashboard';
import { LoaderCircle } from 'lucide-react';

type ViewState = 'LOADING' | 'WIZARD' | 'LOGIN' | 'DASHBOARD';

const App: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('LOADING');
    const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem('authToken'));

    useEffect(() => {
        if (authToken) {
            setViewState('DASHBOARD');
            return;
        }

        const checkInitialState = async () => {
            try {
                const response = await fetch('/api/status');
                if (!response.ok) throw new Error('Failed to fetch server status.');
                const data = await response.json();
                
                if (data.usersExist) {
                    setViewState('LOGIN');
                } else {
                    setViewState('WIZARD');
                }
            } catch (error) {
                console.error(error);
                // Maybe show an error screen later
                setViewState('LOGIN'); // Default to login on error
            }
        };

        checkInitialState();
    }, [authToken]);

    const handleLogin = useCallback((token: string) => {
        sessionStorage.setItem('authToken', token);
        setAuthToken(token);
    }, []);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('authToken');
        setAuthToken(null);
        setViewState('LOGIN');
    }, []);

    if (viewState === 'LOADING') {
        return (
            <div className="min-h-screen bg-donegeon-gray-dark flex items-center justify-center">
                <LoaderCircle className="h-12 w-12 animate-spin text-donegeon-gold" />
            </div>
        );
    }
    
    if (viewState === 'DASHBOARD') {
        return <Dashboard onLogout={handleLogout} />;
    }

    if (viewState === 'LOGIN') {
        return <LoginScreen onLoginSuccess={handleLogin} />;
    }

    // Default to WIZARD
    return <FirstRunWizard onSetupComplete={handleLogin} />;
};

export default App;
