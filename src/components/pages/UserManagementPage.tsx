

import React, { useState } from 'react';
import { useAppDispatch, useAuthState, useSettingsState } from '../../context/AppContext';
import Button from '../ui/Button';
import AddUserDialog from '../users/AddUserDialog';
import { Role, User } from '../../types';
import EditUserDialog from '../users/EditUserDialog';
import ManualAdjustmentDialog from '../admin/ManualAdjustmentDialog';
import Card from '../ui/Card';

const UserManagementPage: React.FC = () => {
    const { users } = useAuthState();
    const { settings } = useSettingsState();
    const { deleteUser } = useAppDispatch();
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingUser, setAdjustingUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditUserDialogOpen(true);
    };

    const handleDelete = (userId: string) => {
        deleteUser(userId);
    };

    const handleAdjust = (user: User) => {
        setAdjustingUser(user);
    };

    const roleName = (role: Role) => {
        switch(role) {
            case Role.DonegeonMaster: return settings.terminology.admin;
            case Role.Gatekeeper: return settings.terminology.moderator;
            case Role.Explorer: return settings.terminology.user;
            default: return role;
        }
    };

    return (
        <div>
            <div className="flex justify-end items-center mb-8">
                <Button onClick={() => setIsAddUserDialogOpen(true)}>Add New Member</Button>
            </div>

            {/* Table for larger screens */}
            <div className="hidden md:block bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-stone-700/60">
                            <tr>
                                <th className="p-4 font-semibold">Game Name</th>
                                <th className="p-4 font-semibold">Username</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-stone-700/40 last:border-b-0">
                                    <td className="p-4">{user.gameName}</td>
                                    <td className="p-4 text-stone-400">{user.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'Donegeon Master' ? 'bg-yellow-500/20 text-yellow-300' : 
                                            user.role === 'Gatekeeper' ? 'bg-sky-500/20 text-sky-300' : 
                                            'bg-green-500/20 text-green-300'
                                        }`}>
                                            {roleName(user.role)}
                                        </span>
                                    </td>
                                    <td className="p-4 space-x-2">
                                        <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(user)}>Edit</Button>
                                        {user.role !== Role.DonegeonMaster && (
                                            <>
                                                <Button variant="secondary" className="text-sm py-1 px-3 !bg-amber-900/50 hover:!bg-amber-800/60 text-amber-300" onClick={() => handleAdjust(user)}>Adjust</Button>
                                                <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDelete(user.id)}>Delete</Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card list for smaller screens */}
            <div className="md:hidden space-y-4">
                {users.map(user => (
                    <Card key={user.id} className="p-0">
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-stone-100">{user.gameName}</h3>
                            <p className="text-sm text-stone-400">{user.username}</p>
                             <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'Donegeon Master' ? 'bg-yellow-500/20 text-yellow-300' : 
                                user.role === 'Gatekeeper' ? 'bg-sky-500/20 text-sky-300' : 
                                'bg-green-500/20 text-green-300'
                            }`}>
                                {roleName(user.role)}
                            </span>
                        </div>
                        <div className="bg-stone-900/30 p-2 border-t border-stone-700/60 flex justify-end gap-2">
                             <Button variant="secondary" className="text-sm py-1 px-3" onClick={() => handleEdit(user)}>Edit</Button>
                            {user.role !== Role.DonegeonMaster && (
                                <>
                                    <Button variant="secondary" className="text-sm py-1 px-3 !bg-amber-900/50 hover:!bg-amber-800/60 text-amber-300" onClick={() => handleAdjust(user)}>Adjust</Button>
                                    <Button variant="secondary" className="text-sm py-1 px-3 !bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDelete(user.id)}>Delete</Button>
                                </>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {isAddUserDialogOpen && <AddUserDialog onClose={() => setIsAddUserDialogOpen(false)} />}
            {isEditUserDialogOpen && editingUser && (
                <EditUserDialog 
                    user={editingUser} 
                    onClose={() => {
                        setIsEditUserDialogOpen(false);
                        setEditingUser(null);
                    }} 
                />
            )}
            {adjustingUser && (
                <ManualAdjustmentDialog
                    user={adjustingUser}
                    onClose={() => setAdjustingUser(null)}
                />
            )}
        </div>
    );
};

export default UserManagementPage;