import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import UserFormFields from './UserFormFields';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose }) => {
  const { users, currentUser, settings } = useAppState();
  const { updateUser } = useAppDispatch();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    gameName: user.gameName,
    birthday: user.birthday,
    role: user.role,
    pin: user.pin || '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        setError('PIN must be 4-10 numbers.');
        return;
    }

    if (users.some(u => u.id !== user.id && u.username.toLowerCase() === formData.username.toLowerCase())) {
        setError("Username is already taken by another user.");
        return;
    }
    if (users.some(u => u.id !== user.id && u.email.toLowerCase() === formData.email.toLowerCase())) {
        setError("Email is already in use by another user.");
        return;
    }

    const { birthday, ...payload } = formData;
    const updatedPayload = {
      ...payload,
      role: formData.role as Role,
      pin: formData.pin || undefined,
    };
    
    updateUser(user.id, updatedPayload);
    onClose();
  };

  const donegeonMasters = users.filter(u => u.role === Role.DonegeonMaster);
  const isLastDonegeonMaster = user.role === Role.DonegeonMaster && donegeonMasters.length === 1;
  const canChangeRole = currentUser?.role === Role.DonegeonMaster && !isLastDonegeonMaster;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {user.gameName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="edit-user-form" className="space-y-4 py-4">
          <UserFormFields formData={formData} handleChange={handleChange} isEditMode={true} />
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value: string) => handleSelectChange('role', value)} defaultValue={formData.role} disabled={!canChangeRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.Explorer}>{settings.terminology.user}</SelectItem>
                <SelectItem value={Role.Gatekeeper}>{settings.terminology.moderator}</SelectItem>
                <SelectItem value={Role.DonegeonMaster}>{settings.terminology.admin}</SelectItem>
              </SelectContent>
            </Select>
            {!canChangeRole && <p className="text-xs text-muted-foreground mt-1">The last {settings.terminology.admin}'s role cannot be changed.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-pin">PIN (4-10 digits, optional)</Label>
            <Input id="edit-pin" name="pin" type="password" value={formData.pin} onChange={handleChange} />
            <p className="text-xs text-muted-foreground mt-1">An easy way for users to switch profiles securely.</p>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
         <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="edit-user-form">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;