import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User, Blueprint } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';
import Card from '../ui/Card';

type WizardStep = 'checking' | 'warning' | 'setup';

type AdminDataPayload = Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>;

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun, bypassFirstRunCheck, setCurrentUser, setAppUnlocked } = useAppDispatch();
  const { settings } = useAppState();

  const [step, setStep] = useState<WizardStep>('checking');
  const [existingDataInfo, setExistingDataInfo] = useState<{version: number, appName: string} | null>(null);
  const [appVersion, setAppVersion] = useState('');
  const [pendingAdminData, setPendingAdminData] = useState<AdminDataPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: 'admin',
    gameName: 'Admin',
    email: 'admin@example.com',
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
            
            fetch('/metadata.json').then(res => res.json()).then(meta => setAppVersion(meta.version));

            if (data.dataExists) {
                setExistingDataInfo({ version: data.version, appName: data.appName });
                setStep('warning');
            } else {
                setStep('setup');
            }
        } catch (e) {
            setError("Could not connect to the server to check for existing data. Please refresh.");
        }
    };
    checkExistingData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const validateAdminForm = (): AdminDataPayload | null => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return null;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return null;
    }
    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match.");
      return null;
    }
    if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) {
        setError('PIN must be 4-10 numbers.');
        return null;
    }
    setError('');

    const { confirmPassword, confirmPin, ...newUserPayload } = formData;
    return {
      ...newUserPayload,
      role: Role.DonegeonMaster,
    };
  }

  const handleSetupChoice = async (choice: 'guided' | 'scratch' | 'import') => {
      const adminData = validateAdminForm();
      if (!adminData) return;
      setIsSubmitting(true);

      if (choice === 'import') {
          setPendingAdminData(adminData);
          fileInputRef.current?.click();
      } else {
          try {
              const result = await completeFirstRun(adminData, choice, null);
              if (result && result.adminUser) {
                  setCurrentUser(result.adminUser);
                  setAppUnlocked(true);
              }
          } catch (e) {
              console.error("First run setup failed", e);
              setIsSubmitting(false);
          }
      }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !pendingAdminData) {
        setIsSubmitting(false);
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const blueprint = JSON.parse(content) as Blueprint;
            if (blueprint.name && blueprint.assets) {
                 const result = await completeFirstRun(pendingAdminData, 'import', blueprint);
                 if (result && result.adminUser) {
                     setCurrentUser(result.adminUser);
                     setAppUnlocked(true);
                 }
            } else {
                setError("Invalid blueprint file format.");
                setIsSubmitting(false);
            }
        } catch (err) {
            setError("Failed to read or parse the blueprint file.");
            setIsSubmitting(false);
        }
    };
    reader.readAsText(file);
  };
  
  const handleGoToLogin = () => {
      bypassFirstRunCheck();
  };
  
  const handleReset = () => {
      setStep('setup');
  }

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
                        <Button onClick={handleReset} className="!bg-red-600 hover:!bg-red-500">
                            Reset & Start Fresh
                        </Button>
                   </div>
              </Card>
          </div>
      );
  }

  if (step === 'setup') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 p-4">
            <div className="max-w-2xl w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
                <h1 className="font-medieval text-accent text-center mb-4">Welcome, {settings.terminology.admin}!</h1>
                <p className="text-stone-300 text-center mb-8">
                Let's set up your account. As the {settings.terminology.admin}, you will be in charge of your {settings.terminology.group.toLowerCase()}, {settings.terminology.tasks.toLowerCase()}, and adventurers.
                </p>
                <div className="space-y-6">
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
                </div>
            </div>

            <div className="max-w-4xl w-full text-center mt-10">
                <p className="text-stone-300 mb-6">Choose how to set up your new world. This will create your account and initialize the database.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Guided Setup Card */}
                    <button onClick={() => handleSetupChoice('guided')} disabled={isSubmitting} className="p-8 border-2 border-emerald-500 bg-emerald-900/40 rounded-xl text-left hover:bg-emerald-800/50 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <h3 className="text-2xl font-bold text-emerald-300">{isSubmitting ? 'Initializing...' : 'Guided Setup (Recommended)'}</h3>
                        <p className="text-stone-300 mt-2">Start with a set of sample quests, items, and markets. This includes a full tutorial to help everyone learn how to use the app.</p>
                    </button>
                    {/* Start from Scratch Card */}
                    <button onClick={() => handleSetupChoice('scratch')} disabled={isSubmitting} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <h3 className="text-2xl font-bold text-stone-200">{isSubmitting ? 'Initializing...' : 'Start from Scratch'}</h3>
                        <p className="text-stone-300 mt-2">Begin with a completely blank slate. You will create all quests, items, and markets yourself. Best for experienced administrators.</p>
                    </button>
                    {/* Import from Blueprint Card */}
                    <button onClick={() => handleSetupChoice('import')} disabled={isSubmitting} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                        <h3 className="text-2xl font-bold text-stone-200">{isSubmitting ? 'Initializing...' : 'Import from Blueprint'}</h3>
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