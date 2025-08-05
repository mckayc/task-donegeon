

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import { StatusIndicator } from './components/StatusIndicator';
import { ConnectionStatus, Status, StatusAPIResponse } from './types';
import { Database, BrainCircuit, KeyRound, ChevronRight, LoaderCircle, UserPlus } from 'lucide-react';
import { Switch } from './components/ui/Switch';
import { Label } from './components/ui/Label';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [statuses, setStatuses] = useState<ConnectionStatus>({
    db: Status.LOADING,
    gemini: Status.LOADING,
    jwt: Status.LOADING,
  });
  const [skipped, setSkipped] = useState({
    db: false,
    gemini: false,
    jwt: false,
  });
  const [adminForm, setAdminForm] = useState({
    firstName: '',
    lastName: '',
    gameName: '',
    birthday: '',
    pin: '',
    password: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Network response was not ok');
        const data: StatusAPIResponse = await response.json();

        setIsFirstRun(data.firstRun);
        setStatuses({
          db: data.db === 'CONNECTED_CUSTOM' ? Status.SUCCESS : data.db === 'CONNECTED_DEFAULT' ? Status.WARNING : Status.ERROR,
          gemini: data.gemini === 'CONNECTED' ? Status.SUCCESS : Status.ERROR,
          jwt: data.jwt === 'CONFIGURED' ? Status.SUCCESS : Status.ERROR,
        });
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
        setIsFirstRun(true); // Assume first run on error
        setStatuses({ db: Status.ERROR, gemini: Status.ERROR, jwt: Status.ERROR });
      }
    };

    fetchStatuses();
  }, [formSuccess]);

  const handleAdminFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };
  
  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await fetch('/api/users/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An unknown error occurred.');
      }
      setFormSuccess('Donegeon Master account created! The application will now reload.');
      setTimeout(() => window.location.reload(), 3000);

    } catch (error) {
        if (error instanceof Error) {
            setFormError(error.message);
        } else {
            setFormError('An unexpected error occurred.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };


  const allConfigured = useMemo(() => {
    const dbOk = statuses.db === Status.SUCCESS || skipped.db;
    const geminiOk = statuses.db === Status.LOADING || statuses.gemini === Status.SUCCESS || skipped.gemini;
    const jwtOk = statuses.db === Status.LOADING || statuses.jwt === Status.SUCCESS || skipped.jwt;
    return dbOk && geminiOk && jwtOk;
  }, [statuses, skipped]);

  const WizardStatusItem = ({ statusKey, title, icon, successMessage, errorMessage, warningMessage, instructions }) => (
    <details className="group border-b border-donegeon-gray pb-4">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <StatusIndicator
          icon={icon}
          title={title}
          status={statuses[statusKey]}
          successMessage={successMessage}
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
        <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
      </summary>
      <div className="mt-4 pl-10 pr-4 text-sm text-gray-300 space-y-3">
        {instructions}
        <div className="flex items-center space-x-2 pt-2">
          <Switch id={`skip-${statusKey}`} checked={skipped[statusKey]} onCheckedChange={(checked) => setSkipped(prev => ({ ...prev, [statusKey]: checked }))} />
          <Label htmlFor={`skip-${statusKey}`}>Skip this check</Label>
        </div>
      </div>
    </details>
  );

  const renderLoadingScreen = () => (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center text-donegeon-text">
        <LoaderCircle className="h-12 w-12 animate-spin text-donegeon-gold mb-4" />
        <h1 className="text-3xl font-medieval">Preparing the Donegeon...</h1>
    </div>
  )

  const renderWizard = () => (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-gold" style={{ textShadow: '2px 2px 4px #000' }}>
          <span role="img" aria-label="wizard emoji" className="mr-4">🧙‍♂️</span>First Run Wizard
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-4 max-w-2xl mx-auto">
          Welcome to Task Donegeon! Let's set up your instance. Follow the steps below to ensure all systems are ready for adventure.
        </p>
      </header>
      
      <main className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <WizardStatusItem
                statusKey="db"
                title="Database Connection"
                icon={<Database className="h-6 w-6 text-donegeon-gold" />}
                successMessage="Custom path connected"
                errorMessage="Connection failed"
                warningMessage="Using default database"
                instructions={<p>For production, create a <code>.env</code> file and set <code>DATABASE_PATH=/path/to/your/db.sqlite</code> to use a persistent database.</p>}
              />
              <WizardStatusItem
                statusKey="gemini"
                title="Gemini API"
                icon={<BrainCircuit className="h-6 w-6 text-donegeon-gold" />}
                successMessage="API key configured"
                errorMessage="API key not configured"
                warningMessage=""
                instructions={<p>The Gemini API is required for AI-powered features. Create a <code>.env</code> file and add your key: <code>API_KEY=your_google_ai_api_key</code></p>}
              />
              <WizardStatusItem
                statusKey="jwt"
                title="JWT Authentication"
                icon={<KeyRound className="h-6 w-6 text-donegeon-gold" />}
                successMessage="Secret key configured"
                errorMessage="Secret key not configured"
                warningMessage=""
                instructions={<p>A JWT secret is vital for security. Create a <code>.env</code> file and set a long, random string: <code>JWT_SECRET=your_super_secret_string</code></p>}
              />
            </div>
          </CardContent>
        </Card>
        
        {allConfigured && (
          <div className="animate-fade-in mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><UserPlus className="mr-3 h-7 w-7"/>Create Donegeon Master Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" type="text" value={adminForm.firstName} onChange={handleAdminFormChange} required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" type="text" value={adminForm.lastName} onChange={handleAdminFormChange} required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="gameName">Game Name (Username)</Label>
                    <Input id="gameName" name="gameName" type="text" value={adminForm.gameName} onChange={handleAdminFormChange} required />
                  </div>
                   <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input id="birthday" name="birthday" type="date" value={adminForm.birthday} onChange={handleAdminFormChange} required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pin">PIN (4-6 digits)</Label>
                      <Input id="pin" name="pin" type="password" pattern="\d{4,6}" title="Enter a 4 to 6 digit PIN" value={adminForm.pin} onChange={handleAdminFormChange} required />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" name="password" type="password" minLength={8} value={adminForm.password} onChange={handleAdminFormChange} required />
                    </div>
                  </div>
                   {formError && <p className="text-sm text-donegeon-red text-center">{formError}</p>}
                   {formSuccess && <p className="text-sm text-donegeon-green text-center">{formSuccess}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );

  const renderDashboard = () => (
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
                warningMessage="Using default connection"
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
          Welcome, adventurer! The system is ready for your quest.
        </p>
      </main>
    </div>
  )

  if (isFirstRun === null) {
    return renderLoadingScreen();
  }
  return isFirstRun ? renderWizard() : renderDashboard();
};

export default App;
