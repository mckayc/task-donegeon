
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { StatusIndicator } from './components/StatusIndicator';
import { ConnectionStatus, Status } from './types';
import { Database, BrainCircuit, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  const [statuses, setStatuses] = useState<ConnectionStatus>({
    db: Status.LOADING,
    gemini: Status.LOADING,
    jwt: Status.LOADING,
  });

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setStatuses({
          db: data.db === 'CONNECTED' ? Status.SUCCESS : Status.ERROR,
          gemini: data.gemini === 'CONNECTED' ? Status.SUCCESS : Status.ERROR,
          jwt: data.jwt === 'CONFIGURED' ? Status.SUCCESS : Status.ERROR,
        });
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        setStatuses({
          db: Status.ERROR,
          gemini: Status.ERROR,
          jwt: Status.ERROR,
        });
      }
    };

    fetchStatuses();
  }, []);

  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-gold" style={{ textShadow: '2px 2px 4px #000' }}>
          Task Donegeon
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-2">The Gamified Chore Tracker</p>
      </header>
      
      <main>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <StatusIndicator
                icon={<Database className="h-6 w-6 text-donegeon-gold" />}
                title="Database Connection"
                status={statuses.db}
                successMessage="Connection established"
                errorMessage="Connection failed"
              />
              <StatusIndicator
                icon={<BrainCircuit className="h-6 w-6 text-donegeon-gold" />}
                title="Gemini API"
                status={statuses.gemini}
                successMessage="API key configured"
                errorMessage="API key not configured"
              />
              <StatusIndicator
                icon={<KeyRound className="h-6 w-6 text-donegeon-gold" />}
                title="JWT Authentication"
                status={statuses.jwt}
                successMessage="Secret key configured"
                errorMessage="Secret key not configured"
              />
            </div>
          </CardContent>
        </Card>
        <p className="text-center mt-6 text-sm text-gray-400">
          Welcome, adventurer! The system is preparing for your quest.
        </p>
      </main>
    </div>
  );
};

export default App;
