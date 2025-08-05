import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import UserIcon from '@/components/icons/UserIcon';
import KeyIcon from '@/components/icons/KeyIcon';

const SetupWizard: React.FC = () => {
  const [jwtSecret, setJwtSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { completeSetup } = useAuth();

  const generateSecret = useCallback(() => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const secret = btoa(String.fromCharCode.apply(null, Array.from(array)));
    setJwtSecret(secret);
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide a username and password.");
      return;
    }
    setError('');
    setIsLoading(true);
    const success = await completeSetup(username, password);
    if (!success) {
      setError("Failed to create the master account. The server might be down or setup may already be complete.");
      setIsLoading(false);
    }
    // On success, the useAuth hook will change the app state, no need to setIsLoading(false)
  };

  return (
    <Card>
      <form onSubmit={handleAdminSubmit}>
        <CardHeader>
          <CardTitle>Welcome to Task Donegeon Setup</CardTitle>
          <CardDescription>
            This is a one-time setup to secure your application and create the master account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <KeyIcon className="h-6 w-6 text-brand-brown-300"/>
                    <h3 className="text-xl font-cinzel font-bold text-brand-brown-100">Step 1: Secure Your Donegeon</h3>
                </div>
                <p className="text-sm text-brand-brown-300">
                    Your application is secured by a secret key. For easy testing, a default, insecure key is used if you don't provide one in your environment.
                </p>
                <div className="p-4 bg-red-900/40 border border-red-700 rounded-md text-red-200">
                    <h4 className="font-bold font-cinzel">Production Environment Security</h4>
                    <p className="mt-1 text-sm">
                        The default key is <strong className="font-bold">NOT SECURE</strong> and must be replaced for production use.
                        Generate a strong secret below and set it as the <code className="bg-brand-gray-900 px-1 py-0.5 rounded">JWT_SECRET</code> environment variable for your service.
                    </p>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="jwt-secret">Generate a Secure Secret Key</Label>
                    <div className="flex gap-2">
                        <Input id="jwt-secret" value={jwtSecret} placeholder="Click 'Generate' to create a key" readOnly className="font-mono text-xs"/>
                        <Button type="button" variant="secondary" onClick={generateSecret}>Generate</Button>
                    </div>
                </div>
            </div>

            <div className="w-full border-t border-brand-brown-700/50"></div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <UserIcon className="h-6 w-6 text-brand-brown-300"/>
                    <h3 className="text-xl font-cinzel font-bold text-brand-brown-100">Step 2: Create Donegeon Master</h3>
                </div>
                {error && <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md border border-red-600">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="username">Master Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., DungeonMaster" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
            </div>

        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : (
                <>
                  <UserIcon className="mr-2 h-4 w-4"/>
                  Create Master Account &amp; Complete Setup
                </>
              )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SetupWizard;
