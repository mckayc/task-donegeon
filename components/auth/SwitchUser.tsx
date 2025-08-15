import React, { useState, useEffect } from 'react';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import { useAppState } from '../../context/AppContext';
import { User, Role } from '../../types';
import Button from '../user-interface/Button';
import Keypad from '../user-interface/Keypad';
import Avatar from '../user-interface/Avatar';
import Input from '../user-interface/Input';

const SwitchUser: React.FC = () => {
    const { users, currentUser: anyCurrentUser, targetedUserForLogin } = useAuthState();
    const { setCurrentUser, setIsSwitchingUser, setTargetedUserForLogin } = useAuthDispatch();
    const { settings } = useAppState();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [needsPassword, setNeedsPassword] = useState(false);
    const [error, setError] = useState('');

    const handleUserSelect = (user: User) => {
        setError('');
        setPin('');
        setPassword('');

        const isAdminOrGatekeeper = user.role === Role.DonegeonMaster || user.role === Role.Gatekeeper;

        // Case 1: Admin/Gatekeeper needs a password
        if (isAdminOrGatekeeper && settings.security.requirePasswordForAdmin) {
            setSelectedUser(user);
            setNeedsPassword(true); // Show password form
            return;
        }

        // Case 2: Any user needs a PIN
        if (settings.security.requirePinForUsers) {
            if (user.pin) {
                setSelectedUser(user);
                setNeedsPassword(false); // Show PIN form
            } else {
                setError(`${user.gameName} does not have a PIN set up. An admin must set one.`);
                setSelectedUser(null);
                setNeedsPassword(false);
            }
            return;
        }

        // Case 3: No security for this user, log in directly.
        setCurrentUser(user);
        setIsSwitchingUser(false);
    };


    useEffect(() => {
        if (targetedUserForLogin) {
            handleUserSelect(targetedUserForLogin);
            // Clean up the targeted user so it doesn't re-trigger
            setTargetedUserForLogin(null);
        }
    }, [targetedUserForLogin]);

    const handlePinSubmit = () => {
        if (selectedUser && selectedUser.pin === pin) {
            setCurrentUser(selectedUser);
            setIsSwitchingUser(false);
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };

    const handlePasswordSubmit = () => {
        if (selectedUser && selectedUser.password === password) {
            setCurrentUser(selectedUser);
            setIsSwitchingUser(false);
        } else {
            setError('Incorrect Password. Please try again.');
            setPassword('');
        }
    };
    
    const goBack = () => {
        if (anyCurrentUser) {
            setIsSwitchingUser(false);
        } else {
            setSelectedUser(null);
            setError('');
            setIsSwitchingUser(false);
        }
    };

    if (selectedUser) {
        if (needsPassword) {
            // Render Password Form
            return (
                <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
                    <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8">
                         <div className="flex flex-col items-center">
                            <Avatar user={selectedUser} className="w-24 h-24 mb-4 bg-emerald-800 rounded-full border-4 border-emerald-600 overflow-hidden" />
                            <h2 className="text-3xl font-bold text-stone-100 mb-2">{selectedUser.gameName}</h2>
                            <p className="text-stone-400 mb-6">Enter your Password to continue</p>
                            <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} className="w-full space-y-4">
                                <Input
                                    label="Password"
                                    id="password-input"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                                {error && <p className="text-red-400 text-center">{error}</p>}
                                <div className="pt-2">
                                  <Button type="submit" className="w-full">Login</Button>
                                </div>
                            </form>
                            <div className="mt-4 w-full">
                                <Button variant="secondary" onClick={() => { setSelectedUser(null); setNeedsPassword(false); }} className="w-full">Back to user selection</Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            // Render PIN form
            return (
                 <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
                    <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8">
                         <div className="flex flex-col items-center">
                            <Avatar user={selectedUser} className="w-24 h-24 mb-4 bg-emerald-800 rounded-full border-4 border-emerald-600 overflow-hidden" />
                            <h2 className="text-3xl font-bold text-stone-100 mb-2">{selectedUser.gameName}</h2>
                            <p className="text-stone-400 mb-6">Enter your PIN to continue</p>
                            
                            <div className="w-full max-w-xs mb-4">
                                <Input
                                    id="pin-input"
                                    name="pin"
                                    type="password"
                                    aria-label="PIN Input"
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*$/.test(val) && val.length <= 10) {
                                            setPin(val);
                                        }
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handlePinSubmit();
                                        }
                                    }}
                                    className="text-center tracking-[.5em] text-2xl h-14"
                                    autoComplete="off"
                                    inputMode="none"
                                    autoFocus
                                />
                            </div>
                            
                            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                            
                            <Keypad
                                onKeyPress={(key) => {
                                    if (pin.length < 10) setPin(p => p + key)
                                }}
                                onBackspace={() => setPin(p => p.slice(0, -1))}
                                onEnter={handlePinSubmit}
                            />
    
                            <div className="mt-6 w-full">
                                <Button variant="secondary" onClick={() => setSelectedUser(null)} className="w-full">Back to user selection</Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // While targetedUserForLogin is processing, show a loader to avoid flashing the user grid
    if (targetedUserForLogin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-900">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 p-4">
            <h1 className="font-medieval text-emerald-400 text-center mb-10">Choose Your Adventurer</h1>
            {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-md mb-8 max-w-lg text-center">{error}</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {users.map(user => (
                    <div key={user.id} onClick={() => handleUserSelect(user)} className="flex flex-col items-center text-center cursor-pointer group">
                        <Avatar user={user} className="w-32 h-32 bg-stone-700 rounded-full border-4 border-stone-600 group-hover:border-emerald-500 group-hover:scale-105 transition-all duration-200 overflow-hidden" />
                        <p className="mt-4 text-xl font-semibold text-stone-200 group-hover:text-emerald-400">{user.gameName}</p>
                        <p className="text-sm text-stone-400">{user.role}</p>
                    </div>
                ))}
            </div>
             <div className="mt-12">
                <Button variant="secondary" onClick={goBack}>Cancel</Button>
            </div>
        </div>
    );
};

export default SwitchUser;
