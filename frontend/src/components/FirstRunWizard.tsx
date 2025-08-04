import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { createAdmin } from '../services/authService';
import type { NewAdminData, User } from '../types';

interface FirstRunWizardProps {
  onAdminCreated: (data: { token: string; user: User }) => void;
}

export const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onAdminCreated }) => {
  const [formData, setFormData] = useState<NewAdminData>({
    firstName: '',
    lastName: '',
    gameName: '',
    birthDate: '',
    pin: '',
  });
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (Object.values(formData).some(val => val === '') || password === '') {
      setError('All fields are required.');
      return;
    }
    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
        setError('PIN must be exactly 4 digits.');
        return;
    }

    setIsLoading(true);
    try {
      const result = await createAdmin({ ...formData, password });
      onAdminCreated(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl text-green-400">Welcome, Donegeon Master!</h2>
        <p className="text-stone-400 mt-2">Create your master account to begin the adventure.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleChange} required />
          </div>
        </div>
        <div>
          <Label htmlFor="gameName">Game Name (Username)</Label>
          <Input id="gameName" name="gameName" type="text" value={formData.gameName} onChange={handleChange} required />
        </div>
        <div>
            <Label htmlFor="birthDate">Birthday</Label>
            <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pin">4-Digit PIN</Label>
          <Input id="pin" name="pin" type="password" maxLength={4} value={formData.pin} onChange={handleChange} required pattern="\d{4}" />
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="pt-2">
          <Button type="submit" isLoading={isLoading} className="w-full">
            {isLoading ? 'Forging Your Key...' : 'Create Master Account'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
