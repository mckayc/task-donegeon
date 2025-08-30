import React, { useState, useMemo } from 'react';
import { useAuthState } from '../../context/AuthContext';
import { Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';

interface KioskUnlockDialogProps {
  onClose: () => void;
}

const KioskUnlockDialog: React.FC<KioskUnlockDialogProps> = ({ onClose }) => {
    const { users } = useAuthState();
    const { settings } = useSystemState();
    
    const adminUsers = useMemo(() => users.filter(u => u.role === Role.DonegeonMaster), [users]);
    const [selectedAdminId, setSelectedAdminId] = useState(adminUsers.length > 0 ? adminUsers[0].id : '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const admin = adminUsers.find(u => u.id === selectedAdminId);
        if (admin && admin.password === password) {
            // Fix: Navigate to kiosk mode URL directly as 'setIsSharedViewActive' does not exist.
            window.location.href = '/kiosk';
            // The view will change automatically, so we don't need to call onClose
        } else {
            setError('Incorrect Master Password.');
            setPassword('');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-medieval text-amber-400 mb-4">Admin Authentication Required</h2>
                <p className="text-stone-300 mb-6">Please enter a {settings.terminology.admin}'s password to enter Kiosk Mode.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {adminUsers.length > 1 && (
                        <Input as="select" label={`Select ${settings.terminology.admin}`} value={selectedAdminId} onChange={(e) => setSelectedAdminId(e.target.value)}>
                            {adminUsers.map(admin => <option key={admin.id} value={admin.id}>{admin.gameName}</option>)}
                        </Input>
                    )}
                    <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Unlock</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default KioskUnlockDialog;
