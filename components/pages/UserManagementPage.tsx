import React, { useState, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import AddUserDialog from '../users/AddUserDialog';
import { Role, User } from '../../types';
import EditUserDialog from '../users/EditUserDialog';
import ManualAdjustmentDialog from '../admin/ManualAdjustmentDialog';
import Card from '../ui/Card';
import { EllipsisVerticalIcon } from '../ui/Icons';
import ConfirmDialog from '../ui/ConfirmDialog';

const UserManagementPage: React.FC = () => {
    const { users, settings, currentUser } = useAppState();
    const { deleteUser } = useAppDispatch();
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                                    <td className="p-4 relative">
                                        <button onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)} className="p-2 rounded-full hover:bg-stone-700/50">
                                            <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                                        </button>
                                        {openDropdownId === user.id && (
                                            <div ref={dropdownRef} className="absolute right-10 top-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleEdit(user); setOpenDropdownId(null); }} className="block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Edit</a>
                                                {user.id !== currentUser?.id && (
                                                    <>
                                                        <button onClick={() => { handleAdjust(user); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50">Adjust</button>
                                                        <button onClick={() => { handleDeleteRequest(user); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
                                                    </>
                                                )}
                                            </div>
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
