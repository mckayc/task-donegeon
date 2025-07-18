import React, { useState } from 'react';
import { Quest, User } from '../../types';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import Button from '../ui/Button';

interface CompleteQuestDialogProps {
  quest: Quest;
  onClose: () => void;
  completionDate?: Date;
  user?: User; // Optional user for shared mode
}

const CompleteQuestDialog: React.FC<CompleteQuestDialogProps> = ({ quest, onClose, completionDate, user }) => {
  const { completeQuest } = useAppDispatch();
  const { currentUser } = useAppState();
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userToComplete = user || currentUser;
    if (!userToComplete) return;

    completeQuest(quest.id, userToComplete.id, quest.rewards, quest.requiresApproval, quest.guildId, { note: note || undefined, completionDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Complete Quest</h2>
        <p className="text-lg text-stone-200 mb-6">"{quest.title}"</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quest-note" className="block text-sm font-medium text-stone-300 mb-1">
              Add a comment (optional)
            </label>
            <textarea
              id="quest-note"
              name="note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md focus:ring-emerald-500 focus:border-emerald-500 transition"
              placeholder="Enter a note for yourself or for the approver."
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Confirm Completion</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteQuestDialog;