


import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { StatusIndicator } from './StatusIndicator';
import { ConnectionStatus, Status, StatusAPIResponse } from '../types';
import { Database, BrainCircuit, KeyRound, ChevronRight, LoaderCircle, UserPlus, Wand2, PartyPopper } from 'lucide-react';
import { Switch } from './ui/Switch';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Button } from './ui/Button';


interface WizardStatusItemProps {
  statusKey: keyof ConnectionStatus;
  title: string;
  icon: React.ReactNode;
  successMessage: string;
  errorMessage: string;
  warningMessage?: string;
  instructions: React.ReactNode;
  status: Status;
  isSkipped: boolean;
  onSkipChange: (checked: boolean) => void;
}

const WizardStatusItem: React.FC<WizardStatusItemProps> = ({ statusKey, title, icon, successMessage, errorMessage, warningMessage, instructions, status, isSkipped, onSkipChange }) => (
    <details className="group border-b border-donegeon-gray pb-4" open={status !== Status.SUCCESS}>
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <StatusIndicator
          icon={icon}
          title={title}
          status={status}
          successMessage={successMessage}
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
        <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
      </summary>
      <div className="mt-4 pl-10 pr-4 text-sm text-gray-300 space-y-3">
        {instructions}
        <div className="flex items-center space-x-2 pt-2">
          <Switch id={`skip-${statusKey}`} checked={isSkipped} onCheckedChange={onSkipChange} />
          <Label htmlFor={`skip-${statusKey}`}>Skip this check</Label>
        </div>
      </div>
    </details>
  );

const FirstRunWizard: React.FC<{ onSetupComplete: () => void }> = ({ onSetupComplete }) => {
  const [apiResponse, setApiResponse] = useState<StatusAPIResponse | null>(null);
  const [statuses, setStatuses] = useState<ConnectionStatus>({ db: Status.LOADING, gemini: Status.LOADING, jwt: Status.LOADING });
  const [skipped, setSkipped] = useState({ db: false, gemini: false, jwt: false });
  const [adminForm, setAdminForm] = useState({ firstName: '', lastName: '', gameName: '', birthday: '', pin: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminCreated, setIsAdminCreated] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);


  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Network response was not ok');
        const data: StatusAPIResponse = await response.json();
        setApiResponse(data);
        setStatuses({
          db: data.db === 'CONNECTED_CUSTOM' ? Status.SUCCESS : data.db === 'CONNECTED_DEFAULT' ? Status.WARNING : Status.ERROR,
          gemini: data.gemini === 'CONNECTED' ? Status.SUCCESS : Status.ERROR,
          jwt: data.jwt === 'CONFIGURED' ? Status.SUCCESS : Status.ERROR,
        });
      } catch (error) {
        setApiResponse(null);
        setStatuses({ db: Status.ERROR, gemini: Status.ERROR, jwt: Status.ERROR });
      }
    };
    fetchStatuses();
  }, []);
  
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
      if (!response.ok) throw new Error(data.message || 'An unknown error occurred.');
      setFormSuccess('Donegeon Master account created!');
      setIsAdminCreated(true);
    } catch (error) {
        setFormError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedError(null);
    setSeedMessage(null);
    try {
      // We need to re-login silently to get a cookie for the seed request
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName: adminForm.gameName, password: adminForm.password }),
      });

      const response = await fetch('/api/setup/seed-data', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setSeedMessage('Sample data created! Finishing setup...');
      setTimeout(() => onSetupComplete(), 2000);
    } catch (error) {
        setSeedError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        setIsSeeding(false);
    }
  };

  const allConfigured = useMemo(() => {
    const dbOk = statuses.db === Status.SUCCESS || statuses.db === Status.WARNING || skipped.db;
    const geminiOk = statuses.gemini === Status.SUCCESS || skipped.gemini;
    const jwtOk = statuses.jwt === Status.SUCCESS || skipped.jwt;
    return dbOk && geminiOk && jwtOk;
  }, [statuses, skipped]);
  
  const dbInstructions = (
    <>
      {apiResponse?.dbPath && <p>Current Path: <code className="text-donegeon-accent bg-black/20 p-1 rounded">{apiResponse.dbPath}</code></p>}
      <p>For production, create a <code>.env</code> file and set <code>APP_DATA_PATH=/path/to/your/data-directory</code> to control where the database and other assets are stored.</p>
    </>
  );

  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-accent flex flex-col items-center" style={{ textShadow: '2px 2px 4px #000' }}>
            <span role="img" aria-label="wizard emoji" className="text-7xl md:text-8xl mb-4">🧙‍♂️</span>
            First Run Wizard
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-4 max-w-2xl mx-auto">
          Welcome to Task Donegeon! Let's set up your instance. Follow the steps below.
        </p>
      </header>
      
      <main className="w-full max-w-3xl">
        <Card>
          <CardHeader><CardTitle>Step 1: System Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <WizardStatusItem statusKey="db" title="Database Connection" icon={<Database className="h-6 w-6 text-donegeon-accent" />}
                successMessage="Using custom data path" errorMessage="Connection failed" warningMessage="Using default data path"
                instructions={dbInstructions}
                status={statuses.db} isSkipped={skipped.db} onSkipChange={(checked) => setSkipped(p => ({...p, db: checked}))} />
              <WizardStatusItem statusKey="gemini" title="Gemini API" icon={<BrainCircuit className="h-6 w-6 text-donegeon-accent" />}
                successMessage="API key configured" errorMessage="API key not configured"
                instructions={<p>The Gemini API is required for AI features. In <code>.env</code> add: <code>API_KEY=your_key</code></p>}
                status={statuses.gemini} isSkipped={skipped.gemini} onSkipChange={(checked) => setSkipped(p => ({...p, gemini: checked}))} />
              <WizardStatusItem statusKey="jwt" title="JWT Authentication" icon={<KeyRound className="h-6 w-6 text-donegeon-accent" />}
                successMessage="Secret key configured" errorMessage="Secret key not configured"
                instructions={<p>A JWT secret is vital for security. In <code>.env</code> set a long, random string: <code>JWT_SECRET=your_secret</code></p>}
                status={statuses.jwt} isSkipped={skipped.jwt} onSkipChange={(checked) => setSkipped(p => ({...p, jwt: checked}))} />
            </div>
          </CardContent>
        </Card>
        
        {allConfigured && (
          <div className="animate-fade-in mt-8">
            <Card>
              <CardHeader><CardTitle className="flex items-center"><UserPlus className="mr-3 h-7 w-7"/>Step 2: Create Donegeon Master Account</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAdminFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input id="firstName" name="firstName" placeholder="First Name" type="text" value={adminForm.firstName} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                    <Input id="lastName" name="lastName" placeholder="Last Name" type="text" value={adminForm.lastName} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                  </div>
                  <Input id="gameName" name="gameName" placeholder="Game Name (Username)" type="text" value={adminForm.gameName} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                  <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input id="birthday" name="birthday" type="date" value={adminForm.birthday} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input id="pin" name="pin" type="password" placeholder="PIN (4-6 digits)" pattern="\d{4,6}" title="Enter a 4 to 6 digit PIN" value={adminForm.pin} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                     <Input id="password" name="password" type="password" placeholder="Password (min 8 chars)" minLength={8} value={adminForm.password} onChange={handleAdminFormChange} required disabled={isAdminCreated}/>
                  </div>
                   {formError && <p className="text-sm text-donegeon-red text-center">{formError}</p>}
                   {formSuccess && <p className="text-sm text-donegeon-green text-center flex items-center justify-center"><PartyPopper className="mr-2 h-5 w-5"/>{formSuccess}</p>}
                  <Button type="submit" className="w-full" disabled={isSubmitting || isAdminCreated}>
                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdminCreated && (
            <div className="animate-fade-in mt-8">
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Wand2 className="mr-3 h-7 w-7" />Step 3: Populate Your Realm (Optional)</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-6 text-center text-donegeon-text/90">Want to get started right away? We can create some sample explorers and tasks for you.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={handleSeedData} disabled={isSeeding || !!seedMessage}>
                                {isSeeding ? <LoaderCircle className="animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4"/>Create Sample Data</>}
                            </Button>
                             <Button onClick={onSetupComplete} variant="outline">
                                Skip & Finish Setup
                            </Button>
                        </div>
                         {seedError && <p className="mt-4 text-sm text-donegeon-red text-center">{seedError}</p>}
                         {seedMessage && <p className="mt-4 text-sm text-donegeon-green text-center">{seedMessage}</p>}
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
};

export default FirstRunWizard;