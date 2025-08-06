import React, { useState } from 'react';
import { QuestGroup } from '../../types';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppState } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import UserMultiSelect from '../ui/user-multi-select';


interface AssignQuestGroupDialogProps {
    group: QuestGroup;
    onClose: () => void;
}

const AssignQuestGroupDialog: React.FC<AssignQuestGroupDialogProps> = ({ group, onClose }) => {
    const { users } = useAppState();
    const { assignQuestGroupToUsers, addNotification } = useAppDispatch();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => users.map(u => u.id));
    
    const handleSubmit = () => {
        if (selectedUserIds.length > 0) {
            assignQuestGroupToUsers(group.id, selectedUserIds);
            addNotification({ type: 'success', message: `Assigned "${group.name}" quests to ${selectedUserIds.length} user(s).` });
        }
        onClose();
    };

    return (
         <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign "{group.name}"</DialogTitle>
                    <p className="text-sm text-muted-foreground">Assign all quests in this group to selected users.</p>
                </DialogHeader>
                <div className="py-4">
                    <UserMultiSelect
                        allUsers={users}
                        selectedUserIds={selectedUserIds}
                        onSelectionChange={setSelectedUserIds}
                        label="Select Users to Assign"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit} disabled={selectedUserIds.length === 0}>
                        Assign to {selectedUserIds.length} User(s)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AssignQuestGroupDialog;
