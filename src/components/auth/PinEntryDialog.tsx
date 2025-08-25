import React, { useState } from 'react';
import { User } from '../../../types';
import Button from '../user-interface/Button';
import Keypad from '../user-interface/Keypad';
import Avatar from '../user-interface/Avatar';
import Input from '../user-interface/Input';

interface PinEntryDialogProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

const PinEntryDialog: React.FC<PinEntryDialogProps> = ({ user, onClose, onSuccess }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handlePinSubmit = () => {
        if (user.pin === pin) {
            onSuccess();
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 max-w-md w-full" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                <div className="flex flex-col items-center">
                    <Avatar user={user} className="w-24 h-24 mb-4 bg-emerald-800 rounded-full border-4 border-emerald-600 overflow-hidden" />
                    <h2 className="text-3xl font-bold text-stone-100 mb-2">{user.gameName}</h2>
                    <p className="text-stone-400 mb-6">Enter PIN to complete quest</p>
                    
                    <div className="w-full max-w-xs mb-4">
                        <Input
                            id="pin-input-dialog"
                            name="pin"
                            type="password"
                            aria-label="PIN Input"
                            value={pin}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) {
                                    setPin(val);
                                }
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
                        onKeyPress={(key: string) => {
                            if (pin.length < 10) setPin(p => p + key)
                        }}
                        onBackspace={() => setPin(p => p.slice(0, -1))}
                        onEnter={handlePinSubmit}
                    />

                    <div className="mt-6 w-full">
                        <Button variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinEntryDialog;
