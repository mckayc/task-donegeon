import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import AddUserDialog from '../users/AddUserDialog';
import { Role, User } from '../../types';
import EditUserDialog from '../users/EditUserDialog';
import ManualAdjustmentDialog from '../admin/ManualAdjustmentDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EllipsisVertical } from 'lucide-react';
import ConfirmDialog from '../ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const UserManagementPage: React.FC = () => {
    const { users, settings, currentUser } = useAppState();
    const { deleteUser } = useAppDispatch();
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsEditUserDialogOpen(true);
    };

    const handleDeleteRequest = (user: User) => {
        setDeletingUser(user);
    };
    
    const handleConfirmDelete = () => {
        if (deletingUser) {
            deleteUser(deletingUser.id);
        }
        setDeletingUser(null);
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All {settings.terminology.group} Members</CardTitle>
                    <Button onClick={() => setIsAddUserDialogOpen(true)} size="sm">
                        Add New Member
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-4 font-semibold">Game Name</th>
                                    <th className="p-4 font-semibold">Username</th>
                                    <th className="p-4 font-semibold">Role</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b last:border-b-0">
                                        <td className="p-4">{user.gameName}</td>
                                        <td className="p-4 text-muted-foreground">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.role === 'Donegeon Master' ? 'bg-yellow-500/20 text-yellow-300' : 
                                                user.role === 'Gatekeeper' ? 'bg-sky-500/20 text-sky-300' : 
                                                'bg-green-500/20 text-green-300'
                                            }`}>
                                                {roleName(user.role)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                           <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <EllipsisVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleEdit(user)}>Edit</DropdownMenuItem>
                                                    {user.id !== currentUser?.id && (
                                                        <>
                                                            <DropdownMenuItem onSelect={() => handleAdjust(user)}>Adjust</DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleDeleteRequest(user)} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
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
            {deletingUser && (
                <ConfirmDialog
                    isOpen={!!deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${roleName(deletingUser.role)}`}
                    message={`Are you sure you want to delete ${deletingUser.role === Role.DonegeonMaster ? `the ${settings.terminology.admin.toLowerCase()}` : `the ${settings.terminology.user.toLowerCase()}`} "${deletingUser.gameName}"? This action is permanent.`}
                />
            )}
        </div>
    );
};

export default UserManagementPage;