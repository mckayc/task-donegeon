
import React, { useMemo } from 'react';
import { QuestGroup } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { QuestsIcon, PencilIcon, TrashIcon, UserGroupIcon } from '../user-interface/Icons';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface QuestGroupTableProps {
    questGroups: QuestGroup[];
    selectedGroups: string[];
    setSelectedGroups: React.Dispatch<React.SetStateAction<string[]>>;
    onEdit: (group: QuestGroup) => void;
    onAssign: (group: QuestGroup) => void;
    onDeleteRequest: (ids: string[]) => void;
    onCreate: () => void;
}

const QuestGroupTable: React.FC<QuestGroupTableProps> = ({
    questGroups,
    selectedGroups,
    setSelectedGroups,
    onEdit,
    onAssign,
    onDeleteRequest,
    onCreate
}) => {
    const groupIds = useMemo(() => questGroups.map(g => g.id), [questGroups]);
    const handleCheckboxClick = useShiftSelect(groupIds, selectedGroups, setSelectedGroups);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedGroups(e.target.checked ? groupIds : []);
    };
    
    if (questGroups.length === 0) {
        return (
            <EmptyState
                Icon={QuestsIcon}
                title="No Quest Groups Created Yet"
                message="Create groups to organize your quests and assign them to users in bulk."
                actionButton={<Button onClick={onCreate}>Create Quest Group</Button>}
            />
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12">
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedGroups.length === groupIds.length && groupIds.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                        </th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {questGroups.map(group => (
                        <tr key={group.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4">
                                <input type="checkbox" checked={selectedGroups.includes(group.id)} onChange={(e) => handleCheckboxClick(e, group.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                            </td>
                            <td className="p-4 font-bold">
                                <button onClick={() => onEdit(group)} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-2">
                                    {group.icon} {group.name}
                                </button>
                            </td>
                            <td className="p-4 text-stone-400">{group.description}</td>
                             <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Assign to Users" onClick={() => onAssign(group)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <UserGroupIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(group)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([group.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QuestGroupTable;
