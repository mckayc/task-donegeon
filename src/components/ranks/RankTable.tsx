import React from 'react';
import { Rank, Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { RankIcon, PencilIcon, TrashIcon } from '../user-interface/Icons';

interface RankTableProps {
    ranks: Rank[];
    selectedRanks: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onEdit: (rank: Rank) => void;
    onDeleteRequest: (ids: string[]) => void;
    terminology: Terminology;
    onCreate: () => void;
}

const RankTable: React.FC<RankTableProps> = ({
    ranks,
    selectedRanks,
    onSelectAll,
    onSelectOne,
    onEdit,
    onDeleteRequest,
    terminology,
    onCreate,
}) => {
    if (ranks.length === 0) {
        return (
            <EmptyState
                Icon={RankIcon}
                title={`No ${terminology.levels} Defined`}
                message={`Create ${terminology.levels.toLowerCase()} to give your users something to strive for.`}
                actionButton={<Button onClick={onCreate}>Create {terminology.level}</Button>}
            />
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12">
                            <input 
                                type="checkbox" 
                                onChange={onSelectAll} 
                                checked={selectedRanks.length === ranks.length && ranks.length > 0} 
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                            />
                        </th>
                        <th className="p-4 font-semibold">Icon</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">XP Threshold</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ranks.map(rank => (
                        <tr key={rank.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4">
                                <input 
                                    type="checkbox" 
                                    checked={selectedRanks.includes(rank.id)} 
                                    onChange={e => onSelectOne(e, rank.id)} 
                                    className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="p-4 text-2xl">{rank.icon}</td>
                            <td className="p-4 font-bold">
                                <button onClick={() => onEdit(rank)} className="hover:underline hover:text-accent transition-colors text-left">
                                    {rank.name}
                                </button>
                            </td>
                            <td className="p-4 text-stone-300">{rank.xpThreshold}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(rank)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Delete" 
                                        onClick={() => onDeleteRequest([rank.id])} 
                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                                        disabled={rank.xpThreshold === 0}
                                    >
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

export default RankTable;