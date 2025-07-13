
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AppLockScreen: React.FC = () => {
  const { users, settings } = useAppState();
  const { setAppUnlocked } = useAppDispatch();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    const adminUsers = users.filter(u => u.role === Role.DonegeonMaster);
    const isValidPassword = adminUsers.some(admin => admin.password === password);

    setTimeout(() => { // Simulate network delay slightly
        if (isValidPassword) {
            setAppUnlocked(true);
        } else {
            setError('Incorrect Master Password.');
            setPassword('');
        }
        setIsChecking(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-medieval text-accent">{settings.terminology.appName}</h1>
          <p className="text-stone-300 mt-2">Enter a Master Password to unlock.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Master Password"
            id="master-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isChecking}>
              {isChecking ? 'Unlocking...' : 'Unlock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppLockScreen;
