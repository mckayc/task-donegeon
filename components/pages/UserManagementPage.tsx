
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import AddUserDialog from '../users/AddUserDialog';
import { Role, User } from '../../types';
import EditUserDialog from '../users/EditUserDialog';
import ManualAdjustmentDialog from '../admin/ManualAdjustmentDialog';
import Card from '../ui/Card';

const UserManagementPage: React.FC = () => {
    const { users, settings } = useAppState();
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
        <div className="space-y-6">
            <Card
                title={`All ${settings.terminology.group} Members`}
                headerAction={
                    <Button onClick={() => setIsAddUserDialogOpen(true)} size="sm">
                        Add New Member
                    </Button>
                }
            >
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
                                        <Button size="sm" variant="secondary" onClick={() => handleEdit(user)}>Edit</Button>
                                        {user.role !== Role.DonegeonMaster && (
                                            <>
                                                <Button size="sm" variant="secondary" className="!bg-amber-900/50 hover:!bg-amber-800/60 text-amber-300" onClick={() => handleAdjust(user)}>Adjust</Button>
                                                <Button size="sm" variant="secondary" className="!bg-red-900/50 hover:!bg-red-800/60 text-red-300" onClick={() => handleDelete(user.id)}>Delete</Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

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