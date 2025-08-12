import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../user-interface/Button';
import Card from '../user-interface/Card';
import Input from '../user-interface/Input';
import { Role, User } from '../../types';
import UserFormFields from '../users/UserFormFields';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

const ProfilePage: React.FC = () => {
    const { currentUser, users } = useAppState();
    const { updateUser } = useAppDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    if (!currentUser) {
        return <Card><p>User not found. Please log in again.</p></Card>;
    }

    const [formData, setFormData] = useState({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        birthday: currentUser.birthday || '',
        gameName: currentUser.gameName || '',
        password: '',
        confirmPassword: '',
        pin: currentUser.pin || '',
        confirmPin: '',
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const canEditPassword = currentUser.role === Role.DonegeonMaster || currentUser.role === Role.Gatekeeper;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const updatePayload: Partial<User> = {};

        // Check for basic info changes
        if (formData.firstName.trim() && formData.firstName !== currentUser.firstName) updatePayload.firstName = formData.firstName;
        if (formData.lastName.trim() && formData.lastName !== currentUser.lastName) updatePayload.lastName = formData.lastName;
        if (formData.birthday.trim() && formData.birthday !== currentUser.birthday) updatePayload.birthday = formData.birthday;
        if (formData.gameName.trim() && formData.gameName !== currentUser.gameName) updatePayload.gameName = formData.gameName;

        // Validation for username and email
        if (formData.username.trim() && formData.username !== currentUser.username) {
            if (users.some(u => u.id !== currentUser.id && u.username.toLowerCase() === formData.username.toLowerCase())) {
                setError("Username is already taken by another user.");
                return;
            }
            updatePayload.username = formData.username;
        }
        if (formData.email.trim() && formData.email !== currentUser.email) {
             if (users.some(u => u.id !== currentUser.id && u.email.toLowerCase() === formData.email.toLowerCase())) {
                setError("Email is already in use by another user.");
                return;
            }
            updatePayload.email = formData.email;
        }

        // Validation for password
        if (canEditPassword && formData.password) {
            if (formData.password.length < 6) {
                setError("New password must be at least 6 characters long.");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            updatePayload.password = formData.password;
        }
        
        // Validation for PIN
        if (formData.pin !== currentUser.pin) {
            if (formData.pin) { // Setting or changing a PIN
                 if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) {
                    setError("PIN must be 4-10 digits.");
                    return;
                }
                if (formData.pin !== formData.confirmPin) {
                    setError("PINs do not match.");
                    return;
                }
                updatePayload.pin = formData.pin;
            } else { // Clearing a PIN
                updatePayload.pin = '';
            }
        }
        
        if (Object.keys(updatePayload).length > 0) {
            setIsSaving(true);
            await updateUser(currentUser.id, updatePayload);
            setIsSaving(false);
            setFormData(p => ({...p, password: '', confirmPassword: '', confirmPin: ''}));
        } else {
            addNotification({type: 'info', message: 'No changes were made.'});
        }
    };

    return (
        <div>
            <Card>
                <form onSubmit={handleSave} className="space-y-8 max-w-lg mx-auto">
                    <div>
                        <h3 className="text-xl font-bold text-stone-200 mb-4">Account Details</h3>
                        <div className="space-y-4">
                            <UserFormFields formData={formData} handleChange={handleChange} isEditMode={true} />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-stone-700/60">
                        <h3 className="text-xl font-bold text-stone-200 mb-4">Security</h3>
                         <div className="space-y-4">
                             <Input 
                                label="New PIN (4-10 digits, optional)"
                                id="pin"
                                name="pin"
                                type="password"
                                value={formData.pin}
                                onChange={handleChange}
                            />
                            <Input 
                                label="Confirm New PIN"
                                id="confirmPin"
                                name="confirmPin"
                                type="password"
                                value={formData.confirmPin}
                                onChange={handleChange}
                                disabled={!formData.pin || formData.pin === currentUser.pin}
                            />
                            {canEditPassword && (
                                <>
                                    <div className="pt-4 border-t border-stone-700/60"></div>
                                    <Input 
                                        label="New Password (optional, min 6 char)"
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
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
                                </>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    <div className="pt-4 text-right">
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ProfilePage;
