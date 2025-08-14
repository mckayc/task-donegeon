

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import Button from '../user-interface/Button';
import AddUserDialog from '../users/AddUserDialog';
import { Role, User } from '../../types';
import EditUserDialog from '../users/EditUserDialog';
import ManualAdjustmentDialog from '../admin/ManualAdjustmentDialog';
import Card from '../user-interface/Card';
import { EllipsisVerticalIcon } from '../user-interface/Icons';
import ConfirmDialog from '../user-interface/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../user-interface/Input';
import { useNotificationsDispatch } from '../../context/NotificationsContext';
import { useShiftSelect } from '../../hooks/useShiftSelect';

const UserManagementPage: React.FC = () => {
    const { settings } = useAppState();
    const { currentUser } = useAuthState();
    const { deleteUsers } = useAuthDispatch();
    const { addNotification } = useNotificationsDispatch();
    
    const [pageUsers, setPageUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'gameName-asc' | 'gameName-desc' | 'username-asc' | 'username-desc' | 'role-asc' | 'role-desc'>('gameName-asc');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const pageUserIds = useMemo(() => pageUsers.map(u => u.id), [pageUsers]);
    const handleCheckboxClick = useShiftSelect(pageUserIds, selectedUsers, setSelectedUsers);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
            params.append('sortBy', sortBy);

            const response = await fetch(`/api/users?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch users.');
            const data = await response.json();
            setPageUsers(data);
        } catch (error) {
            console.error(error);
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, sortBy, addNotification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    useEffect(() => {
        setSelectedUsers([]);
    }, [debouncedSearchTerm, sortBy]);

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
    };
    
    const handleDeleteRequest = (userIds: string[]) => {
        setDeletingIds(userIds);
    };

    const handleConfirmDelete = async () => {
        if (deletingIds.length === 0) return;
        await deleteUsers(deletingIds);
        setDeletingIds([]);
        setSelectedUsers([]);
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
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUsers(e.target.checked ? pageUserIds : []);
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
                <div className="flex flex-wrap gap-4 mb-4">
                    <Input placeholder="Search by name or username..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <Input as="select" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as any)}>
                        <option value="gameName-asc">Name (A-Z)</option>
                        <option value="gameName-desc">Name (Z-A)</option>
                        <option value="username-asc">Username (A-Z)</option>
                        <option value="username-desc">Username (Z-A)</option>
                        <option value="role-asc">Role (A-Z)</option>
                        <option value="role-desc">Role (Z-A)</option>
                    </Input>
                    {selectedUsers.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-stone-900/50 rounded-lg">
                            <span className="text-sm font-semibold text-stone-300 px-2">{selectedUsers.length} selected</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(selectedUsers)}>Delete</Button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                     <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-stone-700/60">
                                <tr>
                                    <th className="p-4 w-12">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={pageUsers.length > 0 && selectedUsers.length === pageUsers.length}
                                            className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th className="p-4 font-semibold">Game Name</th>
                                    <th className="p-4 font-semibold">Username</th>
                                    <th className="p-4 font-semibold">Role</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageUsers.map(user => (
                                    <tr key={user.id} className="border-b border-stone-700/40 last:border-b-0">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxClick(e, user.id)}
                                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                            />
                                        </td>
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
                                                            <button onClick={() => { handleDeleteRequest([user.id]); setOpenDropdownId(null); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700/50">Delete</button>
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
                )}
            </Card>

            {isAddUserDialogOpen && <AddUserDialog onClose={() => setIsAddUserDialogOpen(false)} onUserAdded={fetchUsers} />}
            {editingUser && (
                <EditUserDialog 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onUserUpdated={fetchUsers}
                />
            )}
            {adjustingUser && (
                <ManualAdjustmentDialog
                    user={adjustingUser}
                    onClose={() => setAdjustingUser(null)}
                />
            )}
            {deletingIds.length > 0 && (
                <ConfirmDialog
                    isOpen={deletingIds.length > 0}
                    onClose={() => setDeletingIds([])}
                    onConfirm={handleConfirmDelete}
                    title={`Delete ${deletingIds.length > 1 ? 'Users' : 'User'}`}
                    message={`Are you sure you want to delete ${deletingIds.length} ${deletingIds.length > 1 ? 'users' : 'user'}? This action is permanent.`}
                />
            )}
        </div>
    );
};

export default UserManagementPage;