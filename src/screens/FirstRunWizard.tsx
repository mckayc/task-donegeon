
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatusIndicator } from '../components/StatusIndicator';
import { ConnectionStatus, Status } from '../types';
import { Database, BrainCircuit, KeyRound } from 'lucide-react';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { Button } from '../components/ui/Button';

const JWTInstructions = () => (
  <div className="mt-4 p-4 bg-donegeon-gray-dark/50 border border-donegeon-gray rounded-md">
    <p className="font-semibold text-donegeon-gold">Action Required: Configure JWT Secret</p>
    <p className="text-sm mt-2">To secure your application, you need to set a unique JWT Secret.</p>
    <p className="text-sm mt-2">In your <code>.env</code> or <code>docker-compose.yml</code> file, set the <code>JWT_SECRET</code> environment variable to a random string of at least 60 characters.</p>
    <pre className="mt-2 p-2 bg-gray-900/70 rounded-md text-xs text-donegeon-parchment overflow-x-auto">
      JWT_SECRET=your_super_long_and_random_secret_string_here
    </pre>
  </div>
);

const GeminiInstructions = () => (
  <div className="mt-4 p-4 bg-donegeon-gray-dark/50 border border-donegeon-gray rounded-md">
    <p className="font-semibold text-donegeon-gold">Action Required: Configure Gemini API Key</p>
    <p className="text-sm mt-2">To enable AI features, you need to provide a Google Gemini API key.</p>
    <p className="text-sm mt-2">In your <code>.env</code> or <code>docker-compose.yml</code> file, set the <code>API_KEY</code> environment variable.</p>
    <pre className="mt-2 p-2 bg-gray-900/70 rounded-md text-xs text-donegeon-parchment overflow-x-auto">
      API_KEY=your_gemini_api_key_here
    </pre>
  </div>
);

const DBInstructions = () => (
  <div className="mt-4 p-4 bg-donegeon-gray-dark/50 border border-donegeon-gray rounded-md">
    <p className="font-semibold text-donegeon-gold">Action Required: Set Custom Database Path</p>
    <p className="text-sm mt-2">For data persistence, it is required to specify a custom data path outside of the default.</p>
    <p className="text-sm mt-2">In your <code>.env</code> or <code>docker-compose.yml</code> file, set the <code>APP_DATA_PATH</code> to a custom directory, for example: <code>/path/to/your/data</code>.</p>
    <pre className="mt-2 p-2 bg-gray-900/70 rounded-md text-xs text-donegeon-parchment overflow-x-auto">
      # Example for docker-compose.yml environment:
      APP_DATA_PATH=./my-donegeon-data
    </pre>
  </div>
);

interface FirstRunWizardProps {
    onSetupComplete: (token: string) => void;
}

const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onSetupComplete }) => {
  const [statuses, setStatuses] = useState<ConnectionStatus>({
    db: { status: Status.LOADING, customPath: false },
    gemini: Status.LOADING,
    jwt: Status.LOADING,
  });
  const [skipSetup, setSkipSetup] = useState({ db: false, gemini: false, jwt: false });
  const [isCreateUserDialogOpen, setCreateUserDialogOpen] = useState(false);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setStatuses({
          db: {
            status: data.db.customPath ? Status.SUCCESS : Status.ERROR,
            customPath: data.db.customPath,
          },
          gemini: data.gemini === 'CONNECTED' ? Status.SUCCESS : Status.ERROR,
          jwt: data.jwt === 'CONFIGURED' ? Status.SUCCESS : Status.ERROR,
        });
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        setStatuses({
          db: { status: Status.ERROR, customPath: false },
          gemini: Status.ERROR,
          jwt: Status.ERROR,
        });
      }
    };
    fetchStatuses();
  }, []);
  
  const isWizardComplete =
    (statuses.db.status === Status.SUCCESS || skipSetup.db) &&
    (statuses.gemini === Status.SUCCESS || skipSetup.gemini) &&
    (statuses.jwt === Status.SUCCESS || skipSetup.jwt);

  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-medieval text-donegeon-text animate-fade-in">
      <CreateUserDialog 
        isOpen={isCreateUserDialogOpen} 
        onClose={() => setCreateUserDialogOpen(false)}
        onUserCreated={onSetupComplete}
      />
      <header className="text-center mb-8">
        <span className="text-8xl md:text-9xl" role="img" aria-label="Wizard emoji">🧙</span>
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-gold mt-4" style={{ textShadow: '2px 2px 4px #000' }}>
          Welcome to Task Donegeon!
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-2 max-w-2xl mx-auto">
          You are about to embark on a quest to turn everyday chores into an epic adventure. First, we must ensure the realm is ready.
        </p>
      </header>
      
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Realm Setup Checklist</CardTitle>
            <CardDescription>System status required for your quest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <StatusIndicator
                icon={<Database className="h-6 w-6 text-donegeon-gold" />}
                title="Database Connection"
                status={statuses.db.status}
                successMessage="Custom path set"
                errorMessage="Custom path not set"
                instructions={<DBInstructions />}
                isSkipped={skipSetup.db}
                onSkipToggle={() => setSkipSetup(prev => ({...prev, db: !prev.db}))}
              />
              <StatusIndicator
                icon={<BrainCircuit className="h-6 w-6 text-donegeon-gold" />}
                title="Gemini API"
                status={statuses.gemini}
                successMessage="API key configured"
                errorMessage="API key not configured"
                instructions={<GeminiInstructions />}
                isSkipped={skipSetup.gemini}
                onSkipToggle={() => setSkipSetup(prev => ({...prev, gemini: !prev.gemini}))}
              />
              <StatusIndicator
                icon={<KeyRound className="h-6 w-6 text-donegeon-gold" />}
                title="JWT Authentication"
                status={statuses.jwt}
                successMessage="Secret key configured"
                errorMessage="Secret key not configured"
                instructions={<JWTInstructions />}
                isSkipped={skipSetup.jwt}
                onSkipToggle={() => setSkipSetup(prev => ({...prev, jwt: !prev.jwt}))}
              />
          </CardContent>
        </Card>
        <div className="text-center mt-8">
          <Button 
            size="lg"
            onClick={() => setCreateUserDialogOpen(true)}
            disabled={!isWizardComplete}
          >
            Create Donegeon Master
          </Button>
          {!isWizardComplete && (
            <p className="text-sm text-gray-400 mt-2">
              Please complete or skip all setup steps to continue.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default FirstRunWizard;
