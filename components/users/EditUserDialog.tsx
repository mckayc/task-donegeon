import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, User } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from './UserFormFields';
import Avatar from '../ui/Avatar';
import ImageSelectionDialog from '../ui/ImageSelectionDialog';

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, onClose }) => {
  const { users } = useAppState();
  const { updateUser, addNotification, uploadFile } = useAppDispatch();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    gameName: user.gameName,
    birthday: user.birthday,
    role: user.role,
    pin: user.pin || '',
    password: '',
    profilePictureUrl: user.profilePictureUrl || ''
  });
  const [error, setError] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const result = await uploadFile(file);
        if (result?.url) {
            setFormData(p => ({...p, profilePictureUrl: result.url}));
            addNotification({ type: 'info', message: 'Image uploaded. Click "Save Changes" to apply.'});
        }
        setIsUploading(false);
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin && (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin))) { setError('PIN must be 4-10 numbers.'); return; }
    if (formData.password && formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (users.some(u => u.id !== user.id && u.username.toLowerCase() === formData.username.toLowerCase())) { setError("Username is already taken by another user."); return; }
    if (users.some(u => u.id !== user.id && u.email.toLowerCase() === formData.email.toLowerCase())) { setError("Email is already in use by another user."); return; }

    // Use a temporary object to build the payload
    const tempPayload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      gameName: formData.gameName,
      birthday: formData.birthday,
      role: formData.role,
      profilePictureUrl: formData.profilePictureUrl,
      pin: formData.pin,
    };

    // Only include password if it's been set
    if (formData.password) {
      tempPayload.password = formData.password;
    }

    const finalPayload: Partial<User> = {};
    for (const key in tempPayload) {
        if ((tempPayload as any)[key] !== (user as any)[key]) {
            (finalPayload as any)[key] = (tempPayload as any)[key];
        }
    }
    // ensure password is in payload if it was changed
    if(tempPayload.password){
        finalPayload.password = tempPayload.password;
    }


    if (Object.keys(finalPayload).length > 0) {
        updateUser(user.id, finalPayload);
        addNotification({type: 'success', message: `${user.gameName}'s profile updated.`});
    } else {
        addNotification({type: 'info', message: `No changes detected for ${user.gameName}.`});
    }

    onClose();
  };

  const canChangeRole = user.role !== Role.DonegeonMaster;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">Edit {user.gameName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar user={{...user, profilePictureUrl: formData.profilePictureUrl}} className="w-24 h-24 rounded-full border-2 border-accent" />
            <div className="flex gap-2">
                <input type="file" ref={hiddenFileInput} onChange={handleFileChange} className="hidden" accept="image/*" />
                <Button type="button" variant="secondary" size="sm" onClick={() => hiddenFileInput.current?.click()} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsGalleryOpen(true)}>Select</Button>
            </div>
          </div>
          <UserFormFields formData={formData} handleChange={handleChange} isEditMode={true} />
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-stone-300 mb-1">Role</label>
            <select id="edit-role" name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md disabled:opacity-50" disabled={!canChangeRole}>
              {canChangeRole && <option value={Role.Explorer}>Explorer</option>}
              {canChangeRole && <option value={Role.Gatekeeper}>Gatekeeper</option>}
              {!canChangeRole && <option value={Role.DonegeonMaster}>Donegeon Master</option>}
            </select>
            {!canChangeRole && <p className="text-xs text-stone-400 mt-1">The Donegeon Master's role cannot be changed.</p>}
          </div>
          <div>
            <Input label="Reset Password" id="edit-password" name="password" type="text" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
          </div>
          <div>
            <Input label="PIN (4-10 digits)" id="edit-pin" name="pin" type="text" value={formData.pin} onChange={handleChange} />
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
       {isGalleryOpen && (
          <ImageSelectionDialog 
              onClose={() => setIsGalleryOpen(false)}
              onSelect={(url) => {
                  setFormData(p => ({...p, profilePictureUrl: url}));
                  setIsGalleryOpen(false);
              }}
          />
      )}
    </div>
  );
};

export default EditUserDialog;