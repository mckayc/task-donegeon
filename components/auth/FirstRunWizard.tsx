import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User, Blueprint } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';
import Card from '../ui/Card';

type WizardStep = 'checking' | 'warning' | 'createAdmin' | 'setupChoice';

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun, bypassFirstRunCheck } = useAppDispatch();
  const { settings } = useAppState();

  const [step, setStep] = useState<WizardStep>('checking');
  const [existingDataInfo, setExistingDataInfo] = useState<{version: number, appName: string} | null>(null);
  const [appVersion, setAppVersion] = useState('');

  const [adminData, setAdminData] = useState<Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'> | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    gameName: '',
    email: '',
    birthday: '',
    password: '',
    confirmPassword: '',
    pin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkExistingData = async () => {
        try {
            const response = await fetch('/api/pre-run-check');
            const data = await response.json();
            
            // Also fetch current app version for comparison display
            fetch('/metadata.json').then(res => res.json()).then(meta => setAppVersion(meta.version));

            if (data.dataExists) {
                setExistingDataInfo({ version: data.version, appName: data.appName });
                setStep('warning');
            } else {
                setStep('createAdmin');
            }
        } catch (e) {
            setError("Could not connect to the server to check for existing data. Please refresh.");
            // We'll stay in the 'checking' state with an error message.
        }
    };
    checkExistingData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) {
        setError('PIN must be 4-10 numbers.');
        return;
    }
    setError('');

    const { confirmPassword, confirmPin, ...newUserPayload } = formData;
    const newAdminData = {
      ...newUserPayload,
      role: Role.DonegeonMaster,
    };
    
    setAdminData(newAdminData);
    setStep('setupChoice');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const blueprint = JSON.parse(content) as Blueprint;
            if (blueprint.name && blueprint.assets) {
                 completeFirstRun(adminData, 'import', blueprint);
            } else {
                setError("Invalid blueprint file format.");
            }
        } catch (err) {
            setError("Failed to read or parse the blueprint file.");
        }
    };
    reader.readAsText(file);
  };
  
  const handleGoToLogin = () => {
      // This tells the AppContext to ignore the first-run flag and proceed to the lock screen.
      bypassFirstRunCheck();
  };

  if (step === 'checking') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-900">
              {error ? (
                  <Card title="Connection Error">
                      <p className="text-red-400">{error}</p>
                  </Card>
              ) : (
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
              )}
          </div>
      );
  }

  if (step === 'warning') {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
              <Card title="Existing Data Detected!" className="max-w-xl text-center">
                   <p className="text-2xl text-amber-400 font-semibold mb-4">Warning!</p>
                   <p className="text-stone-300 mb-6">
                        The application has detected existing data from a previous installation of <span className="font-bold">{existingDataInfo?.appName || 'Task Donegeon'}</span>. Proceeding with setup will <strong className="text-red-400">permanently delete all existing users, quests, and settings.</strong>
                   </p>
                   <div className="text-sm text-stone-400 bg-stone-900/50 p-3 rounded-md mb-6">
                        <p>Detected Data Version: <span className="font-mono">{existingDataInfo?.version || 'Unknown'}</span></p>
                        <p>Current App Version: <span className="font-mono">{appVersion || '...'}</span></p>
                   </div>
                   <p className="text-stone-300 mb-8">
                       If you wish to keep your data, please use the "Go to Login" option. If you want to start over, you can reset the application.
                   </p>
                   <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={handleGoToLogin}>Go to Login (Safe)</Button>
                        <Button onClick={() => setStep('createAdmin')} className="!bg-red-600 hover:!bg-red-500">
                            Reset & Start Fresh
                        </Button>
                   </div>
              </Card>
          </div>
      );
  }

  if (step === 'createAdmin') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
            <div className="max-w-2xl w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
                <h1 className="font-medieval text-accent text-center mb-4">Welcome, {settings.terminology.admin}!</h1>
                <p className="text-stone-300 text-center mb-8">
                Let's set up your account. As the {settings.terminology.admin}, you will be in charge of your {settings.terminology.group.toLowerCase()}, {settings.terminology.tasks.toLowerCase()}, and adventurers.
                </p>
                <form onSubmit={handleAdminSubmit} className="space-y-6">
                <div className="space-y-4">
                    <UserFormFields formData={formData} handleChange={handleChange} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                    <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="PIN (4-10 digits)" id="pin" name="pin" type="password" value={formData.pin} onChange={handleChange} required />
                    <Input label="Confirm PIN" id="confirmPin" name="confirmPin" type="password" value={formData.confirmPin} onChange={handleChange} required />
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-center">{error}</p>}
                <div className="pt-4 text-center">
                    <Button type="submit" className="w-full md:w-auto">Create My Account</Button>
                </div>
                </form>
            </div>
        </div>
    );
  }

  if (step === 'setupChoice') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
            <div className="max-w-4xl w-full text-center">
                <h1 className="font-medieval text-accent text-4xl mb-4">How would you like to build your {settings.terminology.appName}?</h1>
                <p className="text-stone-300 mb-10">Choose how to set up your new world. This will only happen once.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Guided Setup Card */}
                    <button onClick={() => adminData && completeFirstRun(adminData, 'guided', null)} className="p-8 border-2 border-emerald-500 bg-emerald-900/40 rounded-xl text-left hover:bg-emerald-800/50 transition-colors transform hover:scale-105">
                        <h3 className="text-2xl font-bold text-emerald-300">Guided Setup (Recommended)</h3>
                        <p className="text-stone-300 mt-2">Start with a set of sample quests, items, and markets. This includes a full tutorial to help everyone learn how to use the app.</p>
                    </button>
                    {/* Start from Scratch Card */}
                    <button onClick={() => adminData && completeFirstRun(adminData, 'scratch', null)} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors transform hover:scale-105">
                        <h3 className="text-2xl font-bold text-stone-200">Start from Scratch</h3>
                        <p className="text-stone-300 mt-2">Begin with a completely blank slate. You will create all quests, items, and markets yourself. Best for experienced administrators.</p>
                    </button>
                    {/* Import from Blueprint Card */}
                    <button onClick={() => fileInputRef.current?.click()} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors transform hover:scale-105">
                        <h3 className="text-2xl font-bold text-stone-200">Import from Blueprint</h3>
                        <p className="text-stone-300 mt-2">Set up your world by importing a pre-made <code>Blueprint.json</code> file. Perfect for migrating or sharing a setup.</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json,application/json" className="hidden" />
                    </button>
                </div>
                {error && <p className="text-red-400 text-center mt-8">{error}</p>}
            </div>
        </div>
    );
  }
  
  return null;
};

export default FirstRunWizard;