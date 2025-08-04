import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { login } from '../services/authService';
import type { User } from '../types';

interface LoginScreenProps {
    onLoginSuccess: (data: { token: string; user: User }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [gameName, setGameName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!gameName || !password) {
            setError("Please enter your Game Name and Password.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(gameName, password);
            onLoginSuccess(result);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred while entering the Donegeon.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="text-3xl text-green-400">Welcome Back!</h2>
                <p className="text-stone-400 mt-2">Enter the Donegeon.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="gameName">Game Name</Label>
                    <Input 
                        id="gameName" 
                        name="gameName" 
                        type="text" 
                        value={gameName} 
                        onChange={(e) => setGameName(e.target.value)} 
                        required 
                        aria-label="Game Name"
                    />
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
                        aria-label="Password"
                    />
                </div>
                
                {error && <p role="alert" className="text-sm text-red-500 text-center">{error}</p>}

                <div className="pt-2">
                    <Button type="submit" isLoading={isLoading} className="w-full">
                        {isLoading ? 'Unlocking...' : 'Enter'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
