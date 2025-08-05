
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';

const ProfilePage: React.FC = () => {
    const { currentUser } = useAppState();
    const { updateUser, addNotification } = useAppDispatch();
    
    // This check ensures we don't proceed if the user isn't logged in.
    if (!currentUser) {
        return <Card><p>User not found. Please log in again.</p></Card>;
    }

    const [formData, setFormData] = useState({
        gameName: currentUser.gameName || '',
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

        const updatePayload: { gameName?: string; password?: string } = {};

        if (formData.gameName.trim() !== '' && formData.gameName !== currentUser.gameName) {
            updatePayload.gameName = formData.gameName;
        }

        if (formData.password) {
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
        
        if (Object.keys(updatePayload).length > 0) {
            updateUser(currentUser.id, updatePayload);
            addNotification({type: 'success', message: 'Profile updated successfully!'});
            // Clear password fields after successful update
            setFormData(p => ({...p, password: '', confirmPassword: ''}));
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
                            <Input 
                                label="Game Name (Nickname)"
                                id="gameName"
                                name="gameName"
                                value={formData.gameName}
                                onChange={handleChange}
                                required
                            />
                            <Input 
                                label="New Password (optional)"
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
