import React, { useState, useMemo } from 'react';
import { User } from '../../frontendTypes';
import Input from './Input';
import Avatar from './Avatar';

interface UserMultiSelectProps {
    allUsers: User[];
    selectedUserIds: string[];
    onSelectionChange: (newUserIds: string[]) => void;
    label: string;
}

const UserMultiSelect: React.FC<UserMultiSelectProps> = ({ allUsers, selectedUserIds, onSelectionChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user =>
            user.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    const handleToggleUser = (userId: string) => {
        const newSelection = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
        onSelectionChange(newSelection);
    };

    const summaryText = useMemo(() => {
        if (selectedUserIds.length === 0) return 'Select users...';
        if (selectedUserIds.length === 1) return allUsers.find(u => u.id === selectedUserIds[0])?.gameName || '1 user selected';
        return `${selectedUserIds.length} users selected`;
    }, [selectedUserIds, allUsers]);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-stone-300 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md text-left text-stone-200"
            >
                {summaryText}
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-stone-800 border border-stone-600 rounded-md shadow-lg">
                    <div className="p-2">
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto p-2">
                        {filteredUsers.map(user => (
                            <li key={user.id}>
                                <label className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => handleToggleUser(user.id)}
                                        className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500 focus:ring-emerald-500"
                                    />
                                    <Avatar user={user} className="w-8 h-8 rounded-full overflow-hidden" />
                                    <span className="text-stone-200">{user.gameName}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default UserMultiSelect;
