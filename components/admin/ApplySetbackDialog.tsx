import React, { useState } from 'react';
import { useActionsDispatch } from '../../context/ActionsContext';
import { useAuthState } from '../../context/AuthContext';
import { User, SetbackDefinition, Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface ApplySetbackDialogProps {
    setback: SetbackDefinition;
    onClose: () => void;
}

const ApplySetbackDialog: React.FC<ApplySetbackDialogProps> = ({ setback, onClose }) => {
    const { users } = useAuthState();
    const { applySetback } = useActionsDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            addNotification({ type: 'error', message: 'Please select a user.' });
            return;
        }
        if (!reason.trim()) {
            addNotification({ type: 'error', message: 'A reason is required to apply a setback.' });
            return;
        }
        
        const success = applySetback(selectedUserId, setback.id, reason);
        if (success) {
            addNotification({ type: 'success', message: `Setback "${setback.name}" applied.` });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Apply Setback</h2>
                <p className="text-stone-300 mb-6">Applying: <span className="font-bold text-emerald-300">{setback.icon} {setback.name}</span></p>
                
                <form id="apply-setback-form" onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        as="select"
                        label="User"
                        value={selectedUserId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedUserId(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select a user...</option>
                        {users.filter(u => u.role !== Role.DonegeonMaster).map(user => (
                            <option key={user.id} value={user.id}>
                                {user.gameName}
                            </option>
                        ))}
                    </Input>
                    
                    <Input
                        as="textarea"
                        label="Reason"
                        value={reason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                        placeholder="e.g., Missed curfew, broke a house rule."
                        rows={3}
                        required
                    />

                </form>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="apply-setback-form">Apply</Button>
                </div>
            </div>
        </div>
    );
};

export default ApplySetbackDialog;