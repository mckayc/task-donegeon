
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoaderCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetch('/api/users/admins');
        if (!response.ok) throw new Error('Failed to fetch users.');
        const data: User[] = await response.json();
        setAdmins(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUserId, password })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Login failed.');
        }
        const { token } = await response.json();
        onLoginSuccess(token);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid credentials.');
        setPassword('');
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderLoginPrompt = () => {
    if (admins.length === 1) {
      return <p className="text-center text-xl text-donegeon-text">Welcome back, <span className="text-donegeon-gold">{admins[0].gameName}</span>!</p>;
    }
    if (admins.length > 1) {
      return (
        <div className="space-y-2">
            <label htmlFor="user-select" className="text-sm font-medium text-gray-300">Select Profile</label>
            <Select id="user-select" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.gameName}</option>
                ))}
            </Select>
        </div>
      );
    }
    return <p className="text-center text-gray-400">No admin users found. Please set up the application.</p>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-donegeon-gray-dark flex items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-donegeon-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <span className="text-8xl" role="img" aria-label="Castle emoji">🏰</span>
        <h1 className="text-5xl font-bold text-donegeon-gold mt-4" style={{ textShadow: '2px 2px 4px #000' }}>
          Task Donegeon
        </h1>
      </header>
      <main className="w-full max-w-sm">
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Master Login</CardTitle>
                    <CardDescription>Enter the realm with your password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderLoginPrompt()}
                    <div className="space-y-2">
                        <label htmlFor="password-input" className="text-sm font-medium text-gray-300">Password</label>
                        <Input 
                            id="password-input" 
                            type="password" 
                            placeholder="••••••••" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={admins.length === 0 || isSubmitting}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                    {error && <p className="text-sm text-donegeon-red mb-4 text-center">{error}</p>}
                    <Button type="submit" className="w-full" disabled={admins.length === 0 || isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : 'Enter Dungeon'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
      </main>
    </div>
  );
};
