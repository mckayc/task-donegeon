import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BulkQuestUpdates } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import TagInput from '../ui/TagInput';
import UserMultiSelect from '../ui/UserMultiSelect';

interface BulkEditQuestsDialogProps {
    questIds: string[];
    onClose: () => void;
}

type TriState = 'no-change' | 'true' | 'false';

const BulkEditQuestsDialog: React.FC<BulkEditQuestsDialogProps> = ({ questIds, onClose }) => {
    const { questGroups, allTags, users } = useAppState();
    const { bulkUpdateQuests } = useAppDispatch();

    const [status, setStatus] = useState<TriState>('no-change');
    const [isOptional, setIsOptional] = useState<TriState>('no-change');
    const [requiresApproval, setRequiresApproval] = useState<TriState>('no-change');
    const [groupId, setGroupId] = useState('no-change');
    const [addTags, setAddTags] = useState<string[]>([]);
    const [removeTags, setRemoveTags] = useState<string[]>([]);
    const [assignUsers, setAssignUsers] = useState<string[]>([]);
    const [unassignUsers, setUnassignUsers] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: BulkQuestUpdates = {};

        if (status !== 'no-change') updates.isActive = status === 'true';
        if (isOptional !== 'no-change') updates.isOptional = isOptional === 'true';
        if (requiresApproval !== 'no-change') updates.requiresApproval = requiresApproval === 'true';
        if (groupId !== 'no-change') updates.groupId = groupId === '__uncategorized__' ? null : groupId;
        if (addTags.length > 0) updates.addTags = addTags;
        if (removeTags.length > 0) updates.removeTags = removeTags;
        if (assignUsers.length > 0) updates.assignUsers = assignUsers;
        if (unassignUsers.length > 0) updates.unassignUsers = unassignUsers;
        
        if (Object.keys(updates).length > 0) {
            bulkUpdateQuests(questIds, updates);
        }
        onClose();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                 <DialogHeader>
                    <DialogTitle>Bulk Edit {questIds.length} Quests</DialogTitle>
                    <DialogDescription>Apply changes to all selected quests. Fields set to "No Change" will be ignored.</DialogDescription>
                </DialogHeader>
                <form id="bulk-edit-form" onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 overflow-y-auto pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as TriState)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-change">No Change</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Optional</Label>
                            <Select value={isOptional} onValueChange={(v) => setIsOptional(v as TriState)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-change">No Change</SelectItem>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                       <div className="space-y-2">
                             <Label>Requires Approval</Label>
                            <Select value={requiresApproval} onValueChange={(v) => setRequiresApproval(v as TriState)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-change">No Change</SelectItem>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Quest Group</Label>
                             <Select value={groupId} onValueChange={setGroupId}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no-change">No Change</SelectItem>
                                    <SelectItem value="__uncategorized__">Uncategorized</SelectItem>
                                    {questGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <Label className="block mb-1">Add Tags</Label>
                        <TagInput selectedTags={addTags} onTagsChange={setAddTags} allTags={allTags} placeholder="Type to add tags to all..." />
                    </div>
                     <div>
                        <Label className="block mb-1">Remove Tags</Label>
                        <TagInput selectedTags={removeTags} onTagsChange={setRemoveTags} allTags={allTags} placeholder="Type to remove tags from all..." />
                    </div>
                     <div className="pt-4 border-t">
                         <UserMultiSelect allUsers={users} selectedUserIds={assignUsers} onSelectionChange={setAssignUsers} label="Assign Users" />
                    </div>
                    <div>
                         <UserMultiSelect allUsers={users} selectedUserIds={unassignUsers} onSelectionChange={setUnassignUsers} label="Unassign Users" />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="bulk-edit-form">Apply Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkEditQuestsDialog;