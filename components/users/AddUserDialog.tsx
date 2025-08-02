import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/Dialog";
import UserFormFields from './UserFormFields';

interface AddUserDialogProps {
  onClose: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ onClose }) => {
  const { users, settings } = useAppState();
  const { addUser } = useAppDispatch();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    gameName: '',
    birthday: '',
    role: Role.Explorer,
    pin: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const isPasswordRequired = formData.role === Role.DonegeonMaster;

  useEffect(() => {
    if (isPasswordRequired) {
      setShowPasswordFields(true);
    } else {
      // If user switches away from DM, hide the optional password field again for a cleaner form
      setShowPasswordFields(false);
    }
  }, [isPasswordRequired]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isPinRequired = settings.security.requirePinForUsers;
    if (isPinRequired && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) {
        setError('PIN must be 4-10 numbers.');
        return;
    }

    if (isPasswordRequired || formData.password) {
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
    }

    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        setError("Username is already taken.");
        return;
    }
    if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
        setError("Email is already in use.");
        return;
    }

    const newUserPayload = {
        ...formData,
        role: formData.role as Role,
        pin: formData.pin, // PIN can be an empty string if not required
        password: formData.password || undefined,
    };

    addUser(newUserPayload);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {settings.terminology.group} Member</DialogTitle>
          <DialogDescription>
            Create a new profile for a member of your group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="add-user-form" className="space-y-4 py-4">
          <UserFormFields formData={formData} handleChange={handleChange} />
           
          { (showPasswordFields) ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password {isPasswordRequired ? '(min 6 characters)' : '(optional, min 6 characters)'}</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                required={isPasswordRequired} 
              />
            </div>
          ) : (
            <div className="text-center py-2">
                <Button type="button" variant="link" onClick={() => setShowPasswordFields(true)} className="text-sm font-semibold text-accent hover:opacity-80">
                    + Add optional password
                </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select onValueChange={(value) => handleSelectChange('role', value)} defaultValue={formData.role}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.Explorer}>{settings.terminology.user}</SelectItem>
                <SelectItem value={Role.Gatekeeper}>{settings.terminology.moderator}</SelectItem>
                <SelectItem value={Role.DonegeonMaster}>{settings.terminology.admin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN (4-10 digits{settings.security.requirePinForUsers ? '' : ', optional'})</Label>
            <Input 
                id="pin" 
                name="pin" 
                type="password" 
                value={formData.pin} 
                onChange={handleChange} 
                required={settings.security.requirePinForUsers} 
            />
            <p className="text-xs text-muted-foreground">An easy way for users to switch profiles securely. Can be disabled in Settings.</p>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
        <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="add-user-form">Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;