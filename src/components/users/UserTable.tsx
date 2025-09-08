import React, { useMemo, ChangeEvent } from 'react';
import { User, Role } from '../../types';
import Button from '../user-interface/Button';
import { PencilIcon, CopyIcon, AdjustmentsIcon, TrashIcon } from '../user-interface/Icons';

interface UserTableProps {
    users: User[];
    selectedUsers: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    roleName: (role: Role) => string;
    onEdit: (user: User) => void;
    onClone: (userId: string) => void;
    onAdjust: (user: User) => void;
    onDeleteRequest: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
    users,
    selectedUsers,
    onSelectAll,
    onSelectOne,
    roleName,
    onEdit,
    onClone,
    onAdjust,
    onDeleteRequest,
}) => {
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12">
                            <input
                                type="checkbox"
                                onChange={onSelectAll}
                                checked={users.length > 0 && selectedUsers.length === users.length}
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
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={(e) => onSelectOne(e, user.id)}
                                    className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="p-4 font-semibold">
                                <button onClick={() => onEdit(user)} className="hover:underline hover:text-accent transition-colors text-left">
                                    {user.gameName}
                                </button>
                            </td>
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
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(user)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Clone" onClick={() => onClone(user.id)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <CopyIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Adjust" onClick={() => onAdjust(user)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <AdjustmentsIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest(user.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && (
                 <p className="text-center text-stone-400 py-8">No users match your search criteria.</p>
            )}
        </div>
    );
};

export default UserTable;
