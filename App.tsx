import React from 'react';
import { useAuth } from './hooks/useAuth';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DungeonIcon from './components/icons/DungeonIcon';
import FullScreenLoader from './components/ui/FullScreenLoader';

function App() {
  const { status, isAuthenticated } = useAuth();

  const renderContent = () => {
    if (status === 'loading') {
      return <FullScreenLoader />;
    }
    if (status === 'needs-setup') {
      return <SetupWizard />;
    }
    if (status === 'ready' && !isAuthenticated) {
      return <Login />;
    }
    if (status === 'authenticated') {
      return <Dashboard />;
    }
    // Fallback case
    return <Login />;
  };

  return (
    <main className="bg-brand-gray-900 min-h-screen text-brand-brown-100 font-quattrocento flex flex-col items-center justify-center p-4 selection:bg-brand-green-500 selection:text-brand-gray-900">
      <div className="absolute top-8 left-8 flex items-center gap-4 text-brand-gray-300">
        <DungeonIcon className="h-10 w-10"/>
        <h1 className="font-cinzel text-3xl font-bold tracking-wider">Task Donegeon</h1>
      </div>
      <div className="w-full max-w-md">
        {renderContent()}
      </div>
    </main>
  );
}

export default App;
