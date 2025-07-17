import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { Role } from '../../types';
import UserFormFields from '../users/UserFormFields';
import Avatar from '../ui/Avatar';

const ProfilePage: React.FC = () => {
    const { currentUser, settings } = useAppState();
    const { updateUser, addNotification } = useAppDispatch();
    
    // This check ensures we don't proceed if the user isn't logged in.
    if (!currentUser) {
        return <Card><p>User not found. Please log in again.</p></Card>;
    }
    
    const canEditProfile = settings.security.allowProfileEditing || currentUser.role === Role.DonegeonMaster;

    if (!canEditProfile) {
        return <Card title="Profile"><p>Profile editing is currently disabled by the administrator.</p></Card>;
    }

    const [formData, setFormData] = useState({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        username: currentUser.username,
        email: currentUser.email,
        gameName: currentUser.gameName,
        birthday: currentUser.birthday,
        profilePictureUrl: currentUser.profilePictureUrl || '',
        pin: '',
        confirmPin: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const updatePayload: Partial<typeof currentUser> = {};

        // Compare and add changed fields
        if (formData.firstName !== currentUser.firstName) updatePayload.firstName = formData.firstName;
        if (formData.lastName !== currentUser.lastName) updatePayload.lastName = formData.lastName;
        if (formData.username !== currentUser.username) updatePayload.username = formData.username;
        if (formData.email !== currentUser.email) updatePayload.email = formData.email;
        if (formData.gameName !== currentUser.gameName) updatePayload.gameName = formData.gameName;
        if (formData.birthday !== currentUser.birthday) updatePayload.birthday = formData.birthday;
        if (formData.profilePictureUrl !== (currentUser.profilePictureUrl || '')) updatePayload.profilePictureUrl = formData.profilePictureUrl;

        // Handle PIN update
        if (formData.pin) {
            if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) {
                setError('PIN must be 4-10 numbers.'); return;
            }
            if (formData.pin !== formData.confirmPin) {
                setError("PINs do not match."); return;
            }
            updatePayload.pin = formData.pin;
        }

        // Handle password update
        if (formData.password) {
            if (formData.password.length < 6) {
                setError("New password must be at least 6 characters long."); return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match."); return;
            }
            updatePayload.password = formData.password;
        }
        
        if (Object.keys(updatePayload).length > 0) {
            updateUser(currentUser.id, updatePayload);
            addNotification({type: 'success', message: 'Profile updated successfully!'});
            // Clear sensitive fields after successful update
            setFormData(p => ({...p, password: '', confirmPassword: '', pin: '', confirmPin: ''}));
        } else {
            addNotification({type: 'info', message: 'No changes were made.'});
        }
    };

    return (
        <div>
            <Card>
                <form onSubmit={handleSave} className="space-y-8 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center">
                        <Avatar user={{...currentUser, profilePictureUrl: formData.profilePictureUrl }} className="w-32 h-32 rounded-full border-4 border-accent bg-stone-700" />
                        <Input 
                            label="Profile Picture URL"
                            id="profilePictureUrl"
                            name="profilePictureUrl"
                            value={formData.profilePictureUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.png"
                            className="mt-4"
                        />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">User Information</h3>
                        <div className="space-y-4">
                           <UserFormFields formData={formData} handleChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-700 pb-2">Security</h3>
                        <div className="space-y-4">
                            <Input 
                                label="New Password (optional)"
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current"
                            />
                            <Input 
                                label="Confirm New Password"
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={!formData.password}
                            />
                             <Input 
                                label="New PIN (optional)"
                                id="pin"
                                name="pin"
                                type="password"
                                value={formData.pin}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current"
                            />
                            <Input 
                                label="Confirm New PIN"
                                id="confirmPin"
                                name="confirmPin"
                                type="password"
                                value={formData.confirmPin}
                                onChange={handleChange}
                                disabled={!formData.pin}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    <div className="pt-4 text-right">
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;
