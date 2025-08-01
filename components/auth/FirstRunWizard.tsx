import React, { useState, useRef } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User, Blueprint } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import UserFormFields from '../users/UserFormFields';

type AdminDataPayload = Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'>;

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun, setCurrentUser, setAppUnlocked } = useAppDispatch();
  const { settings } = useAppState();

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

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full bg-card border rounded-2xl shadow-2xl p-8 md:p-12">
              <h1 className="font-display text-accent text-center mb-4 text-3xl">Welcome, {settings.terminology.admin}!</h1>
              <p className="text-muted-foreground text-center mb-8">
              Let's set up your account. As the {settings.terminology.admin}, you will be in charge of your {settings.terminology.group.toLowerCase()}, {settings.terminology.tasks.toLowerCase()}, and adventurers.
              </p>
              <div className="space-y-6">
                  <div className="space-y-4">
                      <UserFormFields formData={formData} handleChange={handleChange} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="pin">PIN (4-10 digits)</Label>
                          <Input id="pin" name="pin" type="password" value={formData.pin} onChange={handleChange} required />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="confirmPin">Confirm PIN</Label>
                          <Input id="confirmPin" name="confirmPin" type="password" value={formData.confirmPin} onChange={handleChange} required />
                        </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="max-w-4xl w-full text-center mt-10">
              <p className="text-muted-foreground mb-6">Choose how to set up your new world. This will create your account and initialize the database.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Guided Setup Card */}
                  <div className="p-8 border-2 border-primary bg-primary/20 rounded-xl text-left">
                      <h3 className="text-2xl font-bold text-primary-foreground">{isSubmitting ? 'Initializing...' : 'Guided Setup (Recommended)'}</h3>
                      <p className="text-muted-foreground mt-2">Start with a set of sample quests, items, and markets. This includes a full tutorial to help everyone learn how to use the app.</p>
                       <Button onClick={() => handleSetupChoice('guided')} disabled={isSubmitting} className="mt-4">
                        Choose Guided Setup
                      </Button>
                  </div>
                  {/* Start from Scratch Card */}
                  <div className="p-8 border bg-card rounded-xl text-left">
                      <h3 className="text-2xl font-bold text-card-foreground">{isSubmitting ? 'Initializing...' : 'Start from Scratch'}</h3>
                      <p className="text-muted-foreground mt-2">Begin with a completely blank slate. You will create all quests, items, and markets yourself. Best for experienced administrators.</p>
                      <Button onClick={() => handleSetupChoice('scratch')} disabled={isSubmitting} variant="secondary" className="mt-4">
                        Start Fresh
                      </Button>
                  </div>
                  {/* Import from Blueprint Card */}
                  <div className="p-8 border bg-card rounded-xl text-left">
                      <h3 className="text-2xl font-bold text-card-foreground">{isSubmitting ? 'Initializing...' : 'Import from Blueprint'}</h3>
                      <p className="text-muted-foreground mt-2">Set up your world by importing a pre-made <code>Blueprint.json</code> file. Perfect for migrating or sharing a setup.</p>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json,application/json" className="hidden" />
                      <Button onClick={() => handleSetupChoice('import')} disabled={isSubmitting} variant="secondary" className="mt-4">
                        Import File
                      </Button>
                  </div>
              </div>
              {error && <p className="text-red-500 text-center mt-8">{error}</p>}
          </div>
      </div>
  );
};

export default FirstRunWizard;