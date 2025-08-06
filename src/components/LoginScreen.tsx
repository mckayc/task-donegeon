import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { AdminUser } from '../types';
import { LoaderCircle, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  admins: AdminUser[];
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ admins, onLoginSuccess }) => {
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (admins.length > 0) {
      setSelectedAdmin(admins[0].gameName);
    }
  }, [admins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameName: selectedAdmin, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed.');
      }
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-accent" style={{ textShadow: '2px 2px 4px #000' }}>
          Task Donegeon
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-2">The Gamified Chore Tracker</p>
      </header>

      <main className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <ShieldCheck className="mr-3 h-7 w-7"/> Donegeon Master Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="gameName">Game Name</Label>
                {admins.length > 1 ? (
                  <select
                    id="gameName"
                    name="gameName"
                    value={selectedAdmin}
                    onChange={(e) => setSelectedAdmin(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-sm text-donegeon-text ring-offset-background focus:outline-none focus:ring-2 focus:ring-donegeon-accent"
                    required
                  >
                    {admins.map(admin => (
                      <option key={admin.id} value={admin.gameName} className="bg-donegeon-brown-dark">
                        {admin.gameName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="flex h-10 w-full items-center rounded-md border border-donegeon-gray bg-donegeon-parchment/10 px-3 py-2 text-lg">
                    {selectedAdmin}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-donegeon-red text-center">{error}</p>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Enter the Donegeon'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LoginScreen;