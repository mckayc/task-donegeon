import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';
import Avatar from '../ui/Avatar';

const LoginForm: React.FC<{ onSwitchMode: () => void; }> = ({ onSwitchMode }) => {
    const { users } = useAppState();
    const { setCurrentUser, setAppUnlocked } = useAppDispatch();
    
    const [password, setPassword] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u =>
            (u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase())
        );

        if (user) {
            if (user.password) {
                if (user.password === password) {
                    setCurrentUser(user);
                    setAppUnlocked(true);
                } else {
                    setError('Invalid password.');
                }
            } else {
                setError(`${user.gameName} logs in with a PIN. Please use the "Switch Profile" button.`);
            }
        } else {
            setError('Invalid username or email.');
        }
    };

    return (
        <>
            <h2 className="text-3xl font-medieval text-stone-100 text-center mb-6">Adventurer Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <Input
                    label="Username or Email"
                    id="identifier"
                    name="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                />
                <Input
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-400 text-center">{error}</p>}
                <div className="pt-2">
                    <Button type="submit" className="w-full">Login</Button>
                </div>
            </form>
            <p className="text-center mt-6 text-stone-400 text-sm">
                Don't have an account?{' '}
                <button onClick={onSwitchMode} className="font-semibold text-accent hover:opacity-80 underline">
                    Register Here
                </button>
            </p>
        </>
    );
};

const RegisterForm: React.FC<{ onSwitchMode: () => void }> = ({ onSwitchMode }) => {
    const { users } = useAppState();
    const { addUser, setCurrentUser } = useAppDispatch();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        gameName: '',
        email: '',
        birthday: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password || formData.confirmPassword) {
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (formData.password.length < 6) {
                setError("Password must be at least 6 characters long.");
                return;
            }
        }

        if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
            setError("Username is already taken.");
            return;
        }
        if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
            setError("Email is already in use.");
            return;
        }

        const { confirmPassword, ...newUserPayload } = formData;
        const newUser: Omit<User, 'id' | 'personalPurse' | 'personalExperience' | 'guildBalances' | 'avatar' | 'ownedAssetIds' | 'ownedThemes' | 'hasBeenOnboarded'> = {
            ...newUserPayload,
            password: formData.password || undefined,
            role: Role.Explorer,
            pin: '',
        };

        const createdUser = await addUser(newUser);
        if (createdUser) {
            setCurrentUser(createdUser);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-medieval text-stone-100 text-center mb-6">Create an Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <UserFormFields formData={formData} handleChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Password (optional, min 6 char)" id="reg-password" name="password" type="password" value={formData.password} onChange={handleChange} />
                    <Input label="Confirm Password" id="reg-confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                </div>

                {error && <p className="text-red-400 text-center">{error}</p>}

                <div className="pt-2">
                    <Button type="submit" className="w-full">Register</Button>
                </div>
            </form>
            <p className="text-center mt-6 text-stone-400 text-sm">
                Already have an account?{' '}
                <button onClick={onSwitchMode} className="font-semibold text-accent hover:opacity-80 underline">
                    Login Here
                </button>
            </p>
        </>
    );
};

const AuthPage: React.FC = () => {
    const { settings } = useAppState();
    const { setIsSwitchingUser } = useAppDispatch();
    const [isLoginMode, setIsLoginMode] = useState(true);
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
            <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
                <div className="text-center mb-8">
                    <h1 className="font-medieval text-accent">{settings.terminology.appName}</h1>
                </div>

                {isLoginMode ? (
                    <LoginForm onSwitchMode={() => setIsLoginMode(false)} />
                ) : (
                    <RegisterForm onSwitchMode={() => setIsLoginMode(true)} />
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-stone-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-stone-800 text-stone-400">OR</span>
                    </div>
                </div>

                <Button variant="secondary" onClick={() => setIsSwitchingUser(true)} className="w-full">
                    Switch Profile (PIN Login)
                </Button>
            </div>
        </div>
    );
};

export default AuthPage;