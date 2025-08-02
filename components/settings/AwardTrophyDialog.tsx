
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Trophy, User } from '../../types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AwardTrophyDialogProps {
  user: User;
  onClose: () => void;
}

const AwardTrophyDialog: React.FC<AwardTrophyDialogProps> = ({ user, onClose }) => {
    const { trophies, userTrophies } = useAppState();
    const { awardTrophy } = useAppDispatch();
    const [selectedTrophyId, setSelectedTrophyId] = useState<string>('');
    const [error, setError] = useState('');

    const userHasTrophy = (trophyId: string) => {
        return userTrophies.some(ut => ut.userId === user.id && ut.trophyId === trophyId);
    }
    
    const availableTrophies = trophies.filter(t => t.isManual && !userHasTrophy(t.id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrophyId) {
            setError('Please select a trophy to award.');
            return;
        }
        awardTrophy(user.id, selectedTrophyId);
        onClose();
    };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Award Trophy</DialogTitle>
          <DialogDescription>Select a trophy to award to <span className="font-bold text-primary">{user.gameName}</span>.</DialogDescription>
        </DialogHeader>
        {availableTrophies.length > 0 ? (
            <form onSubmit={handleSubmit} id="award-trophy-form" className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="trophy-select">Available Trophies</Label>
                    <Select onValueChange={setSelectedTrophyId} defaultValue={selectedTrophyId}>
                        <SelectTrigger id="trophy-select">
                            <SelectValue placeholder="Select a trophy..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableTrophies.map(trophy => (
                                <SelectItem key={trophy.id} value={trophy.id}>
                                    {trophy.icon} {trophy.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </form>
        ) : (
             <div className="py-4">
                <p className="text-muted-foreground text-center">{user.gameName} has already earned all available manual trophies!</p>
            </div>
        )}
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            {availableTrophies.length > 0 && <Button type="submit" form="award-trophy-form">Award Trophy</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AwardTrophyDialog;
