
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
  const { setFirstRun, setCurrentUser, setAppUnlocked } = useAppDispatch();
  const { settings } = useAppState();

  const [step, setStep] = useState<WizardStep>('checking');
  const [existingDataInfo, setExistingDataInfo] = useState<{version: number, appName: string} | null>(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: 'admin', gameName: 'Admin', email: 'admin@example.com',
    birthday: '', password: '', confirmPassword: '', pin: '', confirmPin: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkExistingData = async () => {
        try {
            const response = await fetch('/api/pre-run-check');
            const data = await response.json();
            if (data.dataExists) {
                setExistingDataInfo({ version: data.version, appName: data.appName });
                setStep('warning');
            } else {
                setStep('setup');
            }
        } catch (e) {
            setError("Could not connect to the server. Please ensure it's running and refresh the page.");
        }
    };
    checkExistingData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const validateAndGetData = (): AdminDataPayload | null => {
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return null; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters long."); return null; }
    if (formData.pin !== formData.confirmPin) { setError("PINs do not match."); return null; }
    if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) { setError('PIN must be 4-10 numbers.'); return null; }
    setError('');
    const { confirmPassword, confirmPin, ...payload } = formData;
    return { ...payload, role: Role.DonegeonMaster };
  };

  const handleSetupChoice = async (choice: 'guided' | 'scratch' | 'import', blueprint: Blueprint | null = null) => {
    const adminUserData = validateAndGetData();
    if (!adminUserData) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/first-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserData, setupChoice: choice, blueprint }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Setup failed.');

      // On success, update the frontend state to log the new admin in
      setCurrentUser(data.user);
      setAppUnlocked(true);
      setFirstRun(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const blueprint = JSON.parse(content) as Blueprint;
        handleSetupChoice('import', blueprint);
      } catch (err) {
        setError("Failed to read or parse the blueprint file.");
      }
    };
    reader.readAsText(file);
  };
  
  const handleGoToLogin = () => {
    setFirstRun(false);
  };

  if (step === 'checking' || error) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-stone-900">
              <Card title="Connecting...">
                  {error ? <p className="text-red-400">{error}</p> : <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>}
              </Card>
          </div>
      );
  }

  if (step === 'warning') {
       return (
          <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
              <Card title="Existing Data Detected!" className="max-w-xl text-center">
                   <p className="text-2xl text-amber-400 font-semibold mb-4">Warning!</p>
                   <p className="text-stone-300 mb-6">The server has detected existing data. Proceeding with setup will <strong className="text-red-400">permanently delete all existing users, quests, and settings.</strong></p>
                   <p className="text-stone-300 mb-8">If you wish to keep your data, please restart the server. If you want to start over, you can reset the application.</p>
                   <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={handleGoToLogin}>Go to Login (Use Existing Data)</Button>
                        <Button onClick={() => setStep('setup')} className="!bg-red-600 hover:!bg-red-500">Reset & Start Fresh</Button>
                   </div>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 p-4">
        {/* Form and setup choice UI remains largely the same as original */}
        <div className="max-w-2xl w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
            <h1 className="font-medieval text-accent text-center mb-4">Welcome, {settings.terminology.admin}!</h1>
            <p className="text-stone-300 text-center mb-8">Let's set up your account.</p>
            <div className="space-y-4">
                <UserFormFields formData={formData} handleChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Password (min 6 chars)" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                    <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="PIN (4-10 digits)" id="pin" name="pin" type="password" value={formData.pin} onChange={handleChange} required />
                    <Input label="Confirm PIN" id="confirmPin" name="confirmPin" type="password" value={formData.confirmPin} onChange={handleChange} required />
                </div>
            </div>
        </div>
        <div className="max-w-4xl w-full text-center mt-10">
            <p className="text-stone-300 mb-6">Choose how to set up your new world.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button onClick={() => handleSetupChoice('guided')} disabled={isSubmitting} className="p-8 border-2 border-emerald-500 bg-emerald-900/40 rounded-xl text-left hover:bg-emerald-800/50 transition-colors disabled:opacity-50">
                    <h3 className="text-2xl font-bold text-emerald-300">Guided Setup</h3>
                    <p className="text-stone-300 mt-2">Start with sample quests, items, and users.</p>
                </button>
                <button onClick={() => handleSetupChoice('scratch')} disabled={isSubmitting} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors disabled:opacity-50">
                    <h3 className="text-2xl font-bold text-stone-200">Start from Scratch</h3>
                    <p className="text-stone-300 mt-2">Begin with a completely blank slate.</p>
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isSubmitting} className="p-8 border border-stone-700 bg-stone-800/50 rounded-xl text-left hover:bg-stone-700/60 transition-colors disabled:opacity-50">
                    <h3 className="text-2xl font-bold text-stone-200">Import from Blueprint</h3>
                    <p className="text-stone-300 mt-2">Set up by importing a `Blueprint.json` file.</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" className="hidden" />
                </button>
            </div>
            {error && <p className="text-red-400 text-center mt-8">{error}</p>}
        </div>
    </div>
  );
};

export default FirstRunWizard;
