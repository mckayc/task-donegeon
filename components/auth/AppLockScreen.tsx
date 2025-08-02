import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const AppLockScreen: React.FC = () => {
  const { users, settings } = useAppState();
  const { setAppUnlocked, setCurrentUser, reinitializeApp } = useAppDispatch();
  
  const adminUsers = useMemo(() => users.filter(u => u.role === Role.DonegeonMaster), [users]);

  const [selectedAdminId, setSelectedAdminId] = useState(adminUsers.length > 0 ? adminUsers[0].id : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // Fail-safe check: If data exists but no admin is found, the app is in a broken state.
  if (users.length > 0 && adminUsers.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
              <Card className="max-w-xl text-center">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-400">Critical Error: No Administrator Found</CardTitle>
                  <CardDescription>Unrecoverable State!</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-6">
                      The application has detected existing data but cannot find any administrator accounts to unlock it. This can happen if the last administrator account was deleted or if the initial setup was corrupted.
                  </p>
                  <p className="text-foreground mb-8">
                      To resolve this, you must re-initialize the application. This will erase the current (corrupted) data and guide you through the first-run setup again.
                  </p>
                  <Button onClick={reinitializeApp} variant="destructive">
                      Reset & Re-initialize Application
                  </Button>
                </CardContent>
              </Card>
          </div>
      );
  }

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-accent text-4xl">{settings.terminology.appName}</CardTitle>
          <CardDescription>
            {adminUsers.length > 1 
                ? `Welcome, ${selectedAdminUser?.gameName || 'Administrator'}. Enter your password to unlock.` 
                : 'Enter the Master Password to unlock.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {adminUsers.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="admin-select">Select {settings.terminology.admin}</Label>
                <Select
                  value={selectedAdminId}
                  onValueChange={(value) => {
                    setSelectedAdminId(value);
                    setError('');
                    setPassword('');
                  }}
                >
                  <SelectTrigger id="admin-select">
                    <SelectValue placeholder="Select an admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers.map(admin => (
                      <SelectItem key={admin.id} value={admin.id}>{admin.gameName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <Input
                id="master-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={isChecking}>
                {isChecking ? 'Unlocking...' : 'Unlock'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppLockScreen;