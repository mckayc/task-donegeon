

import React from 'react';
import { Trophy, Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { TrophyIcon, PencilIcon, TrashIcon } from '../user-interface/Icons';

interface TrophyTableProps {
    trophies: Trophy[];
    selectedTrophies: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onEdit: (trophy: Trophy) => void;
    onDeleteRequest: (ids: string[]) => void;
    terminology: Terminology;
    onCreate: () => void;
}

const TrophyTable: React.FC<TrophyTableProps> = ({
    trophies,
    selectedTrophies,
    onSelectAll,
    onSelectOne,
    onEdit,
    onDeleteRequest,
    terminology,
    onCreate,
}) => {
    if (trophies.length === 0) {
        return (
            <EmptyState
                Icon={TrophyIcon}
                title={`No ${terminology.awards} Created`}
                message={`Create ${terminology.awards.toLowerCase()} for users to earn through milestones or manual grants.`}
                actionButton={<Button onClick={onCreate}>Create {terminology.award}</Button>}
            />
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12"><input type="checkbox" onChange={onSelectAll} checked={selectedTrophies.length === trophies.length && trophies.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></th>
                        <th className="p-4 font-semibold">Icon</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {trophies.map((trophy: Trophy) => (
                        <tr key={trophy.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4"><input type="checkbox" checked={selectedTrophies.includes(trophy.id)} onChange={e => onSelectOne(e, trophy.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" /></td>
                            <td className="p-4 text-2xl">{trophy.icon}</td>
                            <td className="p-4 font-bold">
                                <button onClick={() => onEdit(trophy)} className="hover:underline hover:text-accent transition-colors text-left">
                                    {trophy.name}
                                </button>
                            </td>
                            <td className="p-4 text-stone-300 max-w-sm truncate">{trophy.description}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trophy.isManual ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                    {trophy.isManual ? 'Manual' : 'Automatic'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(trophy)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([trophy.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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

export default TrophyTable;