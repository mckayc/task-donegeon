import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuthState, useAuthDispatch } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import AddUserDialog from '../../users/AddUserDialog';
import { Role, User } from '../../../types';
import EditUserDialog from '../../users/EditUserDialog';
import { ManualAdjustmentDialog } from '../../admin/ManualAdjustmentDialog';
import Card from '../../user-interface/Card';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../user-interface/Input';
import UserTable from '../../users/UserTable';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import { useUIState } from '../../../context/UIContext';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import Avatar from '../../user-interface/Avatar';
import { useShiftSelect } from '../../../hooks/useShiftSelect';

const UserCard: React.FC<{
    user: User;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    roleName: (role: Role) => string;
    onEdit: (user: User) => void;
    onClone: (userId: string) => void;
    onAdjust: (user: User) => void;
    onDeleteRequest: (userId: string) => void;
}> = ({ user, isSelected, onToggle, roleName, onEdit, onClone, onAdjust, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-center gap-4 border border-stone-700">
             <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <Avatar user={user} className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{user.gameName}</p>
                <p className="text-sm text-stone-400 truncate">{user.username}</p>
                 <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user.role === 'Donegeon Master' ? 'bg-yellow-500/20 text-yellow-300' : 
                    user.role === 'Gatekeeper' ? 'bg-sky-500/20 text-sky-300' : 
                    'bg-green-500/20 text-green-300'
                }`}>
                    {roleName(user.role)}
                </span>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onEdit(user); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onClone(user.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Clone</button>
                        <button onClick={() => { onAdjust(user); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Adjust</button>
                        <button onClick={() => { onDeleteRequest(user.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserManagementPage: React.FC = () => {
    const { settings } = useSystemState();
    const { users } = useAuthState();
    const { deleteUsers } = useAuthDispatch();
    const { cloneUser } = useSystemDispatch();
    const { isMobileView } = useUIState();
    
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
    
    const userIds = useMemo(() => pageUsers.map(u => u.id), [pageUsers]);
    const handleCheckboxClick = useShiftSelect(userIds, selectedUsers, setSelectedUsers);

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

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUsers(e.target.checked ? userIds : []);
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
                </div>
                {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedUsers.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => setEditingUser(pageUsers.find(u => u.id === selectedUsers[0])!)} disabled={selectedUsers.length !== 1}>Edit</Button>
                        <Button size="sm" variant="secondary" onClick={() => setAdjustingUser(pageUsers.find(u => u.id === selectedUsers[0])!)} disabled={selectedUsers.length !== 1}>Adjust</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedUsers)}>Delete</Button>
                    </div>
                )}

                {isMobileView ? (
                    <div className="space-y-3">
                        {pageUsers.map(user => (
                            <UserCard 
                                key={user.id}
                                user={user}
                                isSelected={selectedUsers.includes(user.id)}
                                onToggle={(e) => handleCheckboxClick(e, user.id)}
                                roleName={roleName}
                                onEdit={setEditingUser}
                                onClone={cloneUser}
                                onAdjust={setAdjustingUser}
                                onDeleteRequest={(id) => setDeletingIds([id])}
                            />
                        ))}
                    </div>
                ) : (
                    <UserTable
                        users={pageUsers}
                        selectedUsers={selectedUsers}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleCheckboxClick}
                        roleName={roleName}
                        onEdit={setEditingUser}
                        onClone={cloneUser}
                        onAdjust={setAdjustingUser}
                        onDeleteRequest={(id) => setDeletingIds([id])}
                    />
                )}
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