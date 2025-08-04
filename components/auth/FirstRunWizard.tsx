import React, { useState, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User, Blueprint } from '../../types';
import { Button, Input } from '../ui';
import UserFormFields from '../users/UserFormFields';

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun } = useAppDispatch();
  const { settings } = useAppState();

  const [step, setStep] = useState<'createAdmin' | 'setupChoice'>('createAdmin');
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
