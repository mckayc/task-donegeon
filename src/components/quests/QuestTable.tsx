
import React from 'react';
import { Quest } from './types';
import { Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { QuestsIcon, PencilIcon, CopyIcon, TrashIcon } from '../user-interface/Icons';
import { useShiftSelect } from '../../hooks/useShiftSelect';

interface QuestTableProps {
    quests: Quest[];
    selectedQuests: string[];
    setSelectedQuests: React.Dispatch<React.SetStateAction<string[]>>;
    onEdit: (quest: Quest) => void;
    onClone: (questId: string) => void;
    onDeleteRequest: (ids: string[]) => void;
    terminology: Terminology;
    isLoading: boolean;
    searchTerm: string;
    onCreate: () => void;
}

export const QuestTable: React.FC<QuestTableProps> = ({
    quests,
    selectedQuests,
    setSelectedQuests,
    onEdit,
    onClone,
    onDeleteRequest,
    terminology,
    isLoading,
    searchTerm,
    onCreate,
}) => {
    const questIds = React.useMemo(() => quests.map(q => q.id), [quests]);
    const handleCheckboxClick = useShiftSelect(questIds, selectedQuests, setSelectedQuests);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedQuests(e.target.checked ? questIds : []);
    };

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto"></div>
            </div>
        );
    }

    if (quests.length === 0) {
        return (
             <EmptyState
                Icon={QuestsIcon}
                title={`No ${terminology.tasks} Found`}
                message={searchTerm ? "No quests match your search." : `Create your first ${terminology.task.toLowerCase()} to get your adventurers started.`}
                actionButton={<Button onClick={onCreate} data-log-id="manage-quests-create-empty-state">Create {terminology.task}</Button>}
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-stone-700/60">
                    <tr>
                        <th className="p-4 w-12">
                            <input type="checkbox" onChange={handleSelectAll} checked={selectedQuests.length === quests.length && quests.length > 0} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                        </th>
                        <th className="p-4 font-semibold">Title</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Tags</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {quests.map(quest => (
                        <tr key={quest.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4">
                                <input type="checkbox" checked={selectedQuests.includes(quest.id)} onChange={e => handleCheckboxClick(e, quest.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" />
                            </td>
                            <td className="p-4 font-bold">
                                <button onClick={() => onEdit(quest)} data-log-id={`manage-quests-edit-title-${quest.id}`} className="hover:underline hover:text-accent transition-colors text-left">
                                    {quest.icon} {quest.title}
                                </button>
                            </td>
                            <td className="p-4 text-stone-400">{quest.type}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${quest.isActive ? 'bg-green-500/20 text-green-300' : 'bg-stone-500/20 text-stone-300'}`}>
                                    {quest.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-wrap gap-1">
                                    {quest.tags?.map(tag => (
                                        <span key={tag} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(quest)} data-log-id={`manage-quests-action-edit-${quest.id}`} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Clone" onClick={() => onClone(quest.id)} data-log-id={`manage-quests-action-clone-${quest.id}`} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <CopyIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([quest.id])} data-log-id={`manage-quests-action-delete-${quest.id}`} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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
