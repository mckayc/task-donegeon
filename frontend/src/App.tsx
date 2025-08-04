import React, { useState, useEffect, useCallback } from 'react';
import { FirstRunWizard } from './components/FirstRunWizard';
import { LoginScreen } from './components/LoginScreen';
import { checkAdminExists } from './services/authService';
import { Dashboard } from './components/Dashboard';
import { User } from './types';

const App: React.FC = () => {
  // null: loading, false: no admin, true: admin exists
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchAdminStatus = useCallback(async () => {
    try {
      const exists = await checkAdminExists();
      setAdminExists(exists);
    } catch (error) {
      console.error("Failed to check for admin:", error);
      setAdminExists(true); // Fallback to login screen on error
    }
  }, []);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);
  
  const handleLoginSuccess = (data: { token: string; user: User }) => {
    // In a real app, you'd store the token securely (e.g., in an HttpOnly cookie or memory)
    // For simplicity here, we'll just use it to set the authenticated state.
    console.log("Authentication successful, token received.");
    setCurrentUser(data.user);
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    if (adminExists === null) {
      return (
        <div className="text-center" aria-label="Loading application">
            <svg className="animate-spin mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-xl">Entering the Donegeon...</p>
        </div>
      );
    }

    if (isAuthenticated && currentUser) {
      return <Dashboard user={currentUser} />;
    }

    if (adminExists === false) {
      return <FirstRunWizard onAdminCreated={handleLoginSuccess} />;
    }
    
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
              Task Donegeon
          </h1>
      </header>
      <main className="w-full flex justify-center">
          {renderContent()}
      </main>
    </div>
  );
};

export default App;
