import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { BulkQuestUpdates } from '../../frontendTypes';
import Button from '../ui/Button';
import Input from '../ui/Input';
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-stone-700/60">
                    <h2 className="text-3xl font-medieval text-accent">Bulk Edit {questIds.length} Quests</h2>
                    <p className="text-stone-400">Apply changes to all selected quests. Fields set to "No Change" will be ignored.</p>
                </div>
                <form id="quest-dialog-form" onSubmit={handleSubmit} className="flex-1 space-y-4 p-8 overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input as="select" label="Status" value={status} onChange={e => setStatus(e.target.value as TriState)}>
                            <option value="no-change">No Change</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </Input>
                        <Input as="select" label="Optional" value={isOptional} onChange={e => setIsOptional(e.target.value as TriState)}>
                            <option value="no-change">No Change</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </Input>
                        <Input as="select" label="Requires Approval" value={requiresApproval} onChange={e => setRequiresApproval(e.target.value as TriState)}>
                            <option value="no-change">No Change</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </Input>
                        <Input as="select" label="Quest Group" value={groupId} onChange={e => setGroupId(e.target.value)}>
                            <option value="no-change">No Change</option>
                            <option value="__uncategorized__">Uncategorized</option>
                            {questGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </Input>
                    </div>
                    <div className="pt-4 border-t border-stone-700/60">
                        <label className="block text-sm font-medium text-stone-300 mb-1">Add Tags</label>
                        <TagInput selectedTags={addTags} onTagsChange={setAddTags} allTags={allTags} placeholder="Type to add tags to all..." />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stone-300 mb-1">Remove Tags</label>
                        <TagInput selectedTags={removeTags} onTagsChange={setRemoveTags} allTags={allTags} placeholder="Type to remove tags from all..." />
                    </div>
                     <div className="pt-4 border-t border-stone-700/60">
                         <UserMultiSelect allUsers={users} selectedUserIds={assignUsers} onSelectionChange={setAssignUsers} label="Assign Users" />
                    </div>
                    <div>
                         <UserMultiSelect allUsers={users} selectedUserIds={unassignUsers} onSelectionChange={setUnassignUsers} label="Unassign Users" />
                    </div>
                </form>
                <div className="p-6 border-t border-stone-700/60 mt-auto">
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" form="quest-dialog-form">Apply Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkEditQuestsDialog;
