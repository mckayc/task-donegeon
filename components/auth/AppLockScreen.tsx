import React, { useState, useMemo, useEffect } from 'react';
import { Role, User } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import Avatar from '../user-interface/Avatar';
import { useAppState, useAppDispatch } from '../../context/AppContext';

const AppLockScreen: React.FC = () => {
  const { users, settings } = useAppState();
  const { setAppUnlocked, setCurrentUser } = useAppDispatch();
  
  const adminUsers = useMemo(() => users.filter(u => u.role === Role.DonegeonMaster), [users]);

  const [selectedAdminId, setSelectedAdminId] = useState(adminUsers.length > 0 ? adminUsers[0].id : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  
  useEffect(() => {
    // If there's only one admin, ensure they are selected by default.
    if (adminUsers.length === 1 && selectedAdminId !== adminUsers[0].id) {
        setSelectedAdminId(adminUsers[0].id);
    }
  }, [adminUsers, selectedAdminId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    const admin = adminUsers.find(u => u.id === selectedAdminId);
    if (!admin) {
        setError('Could not find the selected administrator.');
        setIsChecking(false);
        return;
    }

    const isValidPassword = admin.password === password;

    setTimeout(() => { // Simulate network delay slightly
        if (isValidPassword) {
            setAppUnlocked(true);
            setCurrentUser(admin);
        } else {
            setError('Incorrect Master Password.');
            setPassword('');
        }
        setIsChecking(false);
    }, 500);
  };

  const selectedAdminUser = adminUsers.find(u => u.id === selectedAdminId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-6">
            {selectedAdminUser && (
                <Avatar user={selectedAdminUser} className="w-24 h-24 mb-4 bg-emerald-800 rounded-full border-4 border-emerald-600 overflow-hidden mx-auto" />
            )}
          <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
          <p className="text-stone-300 mt-2">
            {selectedAdminUser 
                ? `Welcome, ${selectedAdminUser.gameName}. Enter your password to unlock.` 
                : 'Enter the Master Password to unlock.'
            }
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {adminUsers.length > 1 && (
            <Input
              as="select"
              label={`Select ${settings.terminology.admin}`}
              id="admin-select"
              value={selectedAdminId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedAdminId(e.target.value);
                setError('');
                setPassword('');
              }}
            >
              {adminUsers.map(admin => (
                <option key={admin.id} value={admin.id}>{admin.gameName}</option>
              ))}
            </Input>
          )}
          <Input
            label="Master Password"
            id="master-password"
            name="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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