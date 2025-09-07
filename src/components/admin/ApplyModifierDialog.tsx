import React, { useState, useMemo } from 'react';
import { useAuthState } from '../../context/AuthContext';
import { User, ModifierDefinition, Role } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useSystemDispatch, useSystemState } from '../../context/SystemContext';
import Avatar from '../user-interface/Avatar';

interface ApplyModifierDialogProps {
  users: User[];
  onClose: () => void;
}

const ApplyModifierDialog: React.FC<ApplyModifierDialogProps> = ({ users, onClose }) => {
  const { applyBulkModifier } = useSystemDispatch();
  const { currentUser } = useAuthState();
  const { modifierDefinitions } = useSystemState();
  const { addNotification } = useNotificationsDispatch();

  const [selectedModifierId, setSelectedModifierId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModifierId) {
      addNotification({ type: 'error', message: 'Please select a Triumph or Trial to apply.' });
      return;
    }
    if (!reason.trim()) {
      addNotification({ type: 'error', message: 'A reason is required.' });
      return;
    }
    if (!currentUser) {
      addNotification({ type: 'error', message: 'Could not identify administrator.' });
      return;
    }

    setIsSaving(true);
    const userIds = users.map(u => u.id);
    await applyBulkModifier({
      userIds,
      modifierDefinitionId: selectedModifierId,
      reason,
      appliedById: currentUser.id,
    });
    setIsSaving(false);
    onClose();
  };

  const triumphs = useMemo(() => modifierDefinitions.filter(m => m.category === 'Triumph'), [modifierDefinitions]);
  const trials = useMemo(() => modifierDefinitions.filter(m => m.category === 'Trial'), [modifierDefinitions]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Apply Modifier</h2>
        <p className="text-stone-300 mb-6">Applying to {users.length} user(s):</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
            {users.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-stone-700/50 px-2 py-1 rounded-full text-sm" title={user.gameName}>
                    <Avatar user={user} className="w-6 h-6 rounded-full" />
                    <span className="text-stone-200">{user.gameName}</span>
                </div>
            ))}
        </div>
        
        <form id="apply-modifier-form" onSubmit={handleSubmit} className="space-y-4">
          <Input as="select" label="Select Triumph or Trial" value={selectedModifierId} onChange={e => setSelectedModifierId(e.target.value)} required>
            <option value="" disabled>Select...</option>
            {triumphs.length > 0 && <optgroup label="Triumphs">{triumphs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
            {trials.length > 0 && <optgroup label="Trials">{trials.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
          </Input>
          <Input as="textarea" label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Weekend bonus, Rule infraction" rows={3} required />
        </form>
        <div className="flex justify-end space-x-4 pt-4 mt-auto">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" form="apply-modifier-form" disabled={isSaving}>
            {isSaving ? 'Applying...' : `Apply to ${users.length} User(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplyModifierDialog;