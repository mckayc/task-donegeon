import React, { useState } from 'react';
import { User } from '../../types';
import { Button } from '@/components/ui/button';
import Keypad from '../ui/keypad';
import Avatar from '../ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className="flex flex-col items-center text-center">
                    <Avatar user={user} className="w-24 h-24 mb-4 bg-primary/20 rounded-full border-4 border-primary overflow-hidden" />
                    <DialogTitle>{user.gameName}</DialogTitle>
                    <DialogDescription>Enter PIN to complete quest</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs mb-4">
                        <Input
                            id="pin-input-dialog"
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
                </div>
                <DialogFooter className="mt-6">
                    <Button variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PinEntryDialog;