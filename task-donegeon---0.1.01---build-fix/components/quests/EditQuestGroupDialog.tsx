import React, { useState, useEffect } from 'react';
import { QuestGroup } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppDispatch } from '../../context/AppContext';
import EmojiPicker from '../ui/emoji-picker';

interface EditQuestGroupDialogProps {
    groupToEdit: QuestGroup | null;
    onClose: () => void;
}

const EditQuestGroupDialog: React.FC<EditQuestGroupDialogProps> = ({ groupToEdit, onClose }) => {
    const { addQuestGroup, updateQuestGroup } = useAppDispatch();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '📂',
    });
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    useEffect(() => {
        if (groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                description: groupToEdit.description,
                icon: groupToEdit.icon,
            });
        }
    }, [groupToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (groupToEdit) {
            updateQuestGroup({ ...groupToEdit, ...formData });
        } else {
            addQuestGroup(formData);
        }
        onClose();
    };

    const dialogTitle = groupToEdit ? 'Edit Quest Group' : 'Create New Quest Group';

    return (
         <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <form id="quest-group-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                            id="group-name"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group-description">Description</Label>
                        <Textarea
                            id="group-description"
                            rows={3}
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Icon</Label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                                className="w-full text-left px-3 py-2 bg-background border border-input rounded-md flex items-center gap-2"
                            >
                                <span className="text-2xl">{formData.icon}</span>
                                <span className="text-muted-foreground">Click to change</span>
                            </button>
                            {isEmojiPickerOpen && (
                                <EmojiPicker
                                    onSelect={(emoji: string) => {
                                        setFormData(p => ({ ...p, icon: emoji }));
                                        setIsEmojiPickerOpen(false);
                                    }}
                                    onClose={() => setIsEmojiPickerOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="quest-group-form">{groupToEdit ? 'Save Changes' : 'Create Group'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditQuestGroupDialog;
