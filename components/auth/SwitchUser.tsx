import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { User } from '../../types';
import Button from '../ui/Button';
import Keypad from '../ui/Keypad';
import Avatar from '../ui/Avatar';

const SwitchUser: React.FC = () => {
    const { users } = useAppState();
    const { setCurrentUser, setIsSwitchingUser } = useAppDispatch();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleUserSelect = (user: User) => {
        if (user.pin) {
            setSelectedUser(user);
            setError('');
            setPin('');
        } else {
            setCurrentUser(user);
            setIsSwitchingUser(false);
        }
    };

    const handlePinSubmit = () => {
        if (selectedUser && selectedUser.pin === pin) {
            setCurrentUser(selectedUser);
            setIsSwitchingUser(false);
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };
    
    const goBack = () => {
        setSelectedUser(null);
        // If we got here, there's no currentUser. If we cancel, we should go back to the main auth page.
        setIsSwitchingUser(false); 
    };

    if (selectedUser) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
                <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8">
                     <div className="flex flex-col items-center">
                        <Avatar user={selectedUser} className="w-24 h-24 mb-4 bg-emerald-800 rounded-full border-4 border-emerald-600 overflow-hidden" />
                        <h2 className="text-3xl font-bold text-stone-100 mb-2">{selectedUser.gameName}</h2>
                        <p className="text-stone-400 mb-6">Enter your PIN to continue</p>
                        
                        <div className="flex justify-center items-center gap-3 h-10 mb-4">
                            {Array.from({ length: selectedUser.pin?.length || 4 }).map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full transition-colors ${i < pin.length ? 'bg-emerald-400' : 'bg-stone-600'}`}></div>
                            ))}
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 p-4">
            <h1 className="text-5xl font-medieval text-emerald-400 text-center mb-10">Choose Your Adventurer</h1>
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
