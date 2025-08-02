import React, { useState } from 'react';
import { Quest, User } from '../../types';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';

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

    completeQuest(quest.id, userToComplete.id, quest.requiresApproval, quest.guildId, { note: note || undefined, completionDate });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Quest</DialogTitle>
          <DialogDescription>"{quest.title}"</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="complete-quest-form" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quest-note">Add a comment (optional)</Label>
            <Textarea
              id="quest-note"
              name="note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter a note for yourself or for the approver."
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="complete-quest-form">Confirm Completion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteQuestDialog;