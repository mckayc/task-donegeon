import React, { useState, useMemo, useEffect } from 'react';
import { useAuthState, useAuthDispatch } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import AddUserDialog from '../../users/AddUserDialog';
import { Role, User } from '../../users/types';
import EditUserDialog from '../../users/EditUserDialog';
import { ManualAdjustmentDialog } from '../../admin/ManualAdjustmentDialog';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../user-interface/Input';
import UserTable from '../../users/UserTable';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';

const UserManagementPage: React.FC = () => {
    const { settings } = useSystemState();
    const { users } = useAuthState();
    const { deleteUsers } = useAuthDispatch();
    const { cloneUser } = useSystemDispatch();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'gameName-asc' | 'gameName-desc' | 'username-asc' | 'username-desc' | 'role-asc' | 'role-desc'>('gameName-asc');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    
    const pageUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.gameName.toLowerCase().includes(lowercasedTerm) ||
                user.username.toLowerCase().includes(lowercasedTerm)
            );
        }

        return filteredUsers.sort((a, b) => {
            switch (sortBy) {
                case 'gameName-desc': return b.gameName.localeCompare(a.gameName);
                case 'username-asc': return a.username.localeCompare(b.username);
                case 'username-desc': return b.username.localeCompare(a.username);
                case 'role-asc': return a.role.localeCompare(b.role);
                case 'role-desc': return b.role.localeCompare(a.role);
                case 'gameName-asc':
                default: return a.gameName.localeCompare(b.gameName);
            }
        });
    }, [users, debouncedSearchTerm, sortBy]);

    useEffect(() => {
        setSelectedUsers([]);
    }, [debouncedSearchTerm, sortBy]);

    const handleConfirmDelete = async () => {
        if (deletingIds.length === 0) return;
        deleteUsers(deletingIds);
        setDeletingIds([]);
        setSelectedUsers([]);
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
                            <Button size="sm" variant="secondary" onClick={() => setEditingUser(pageUsers.find(u => u.id === selectedUsers[0])!)} disabled={selectedUsers.length !== 1}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={() => setAdjustingUser(pageUsers.find(u => u.id === selectedUsers[0])!)} disabled={selectedUsers.length !== 1}>Adjust</Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedUsers)}>Delete</Button>
                        </div>
                    )}
                </div>

                <UserTable
                    users={pageUsers}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    roleName={roleName}
                    onEdit={setEditingUser}
                    onClone={cloneUser}
                    onAdjust={setAdjustingUser}
                    onDeleteRequest={(id) => setDeletingIds([id])}
                />
            </Card>

            {isAddUserDialogOpen && <AddUserDialog onClose={() => setIsAddUserDialogOpen(false)} onUserAdded={() => {}} />}
            {editingUser && (
                <EditUserDialog 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onUserUpdated={() => {}}
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