import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';

const LoginForm: React.FC = () => {
    const { setCurrentUser, setAppUnlocked } = useAppDispatch();
    
    const [password, setPassword] = useState('');
    const [identifier, setIdentifier] = useState(''); // Can be username or email
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // This would be the new API call
            // const response = await fetch('/api/auth/login', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ identifier, password }),
            // });
            // const data = await response.json();
            // if (!response.ok) throw new Error(data.error || 'Login failed.');
            //
            // setCurrentUser(data.user);
            // setAppUnlocked(true);
            
            setError("Login API not fully implemented yet.");

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    return (
        <>
            <h2 className="text-3xl font-medieval text-stone-100 text-center mb-6">Adventurer Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <Input label="Username or Email" id="identifier" name="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                <Input label="Password" id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <p className="text-red-400 text-center">{error}</p>}
                <div className="pt-2"><Button type="submit" className="w-full">Login</Button></div>
            </form>
        </>
    );
};


const AuthPage: React.FC = () => {
    const { settings } = useAppState();
    // The setIsSwitchingUser logic would be adapted based on the new auth flow.
    // For now, we'll just show the login form.

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
            <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
                <div className="text-center mb-8">
                    <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
                </div>
                <LoginForm />
                {/* The registration form and switch profile button would be added here */}
            </div>
        </div>
    );
};

export default AuthPage;
