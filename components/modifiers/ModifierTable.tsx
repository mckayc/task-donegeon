import React from 'react';
import { ModifierDefinition } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { CheckBadgeIcon, PencilIcon, TrashIcon } from '../user-interface/Icons';

interface ModifierTableProps {
    modifiers: ModifierDefinition[];
    selectedModifiers: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onApply: (modifier: ModifierDefinition) => void;
    onEdit: (modifier: ModifierDefinition) => void;
    onDeleteRequest: (ids: string[]) => void;
    onCreate: () => void;
}

const ModifierTable: React.FC<ModifierTableProps> = ({
    modifiers,
    selectedModifiers,
    onSelectAll,
    onSelectOne,
    onApply,
    onEdit,
    onDeleteRequest,
    onCreate,
}) => {
    if (modifiers.length === 0) {
        return (
             <EmptyState
                Icon={() => <span className="text-4xl">⚖️</span>}
                title="No Triumph/Trial Definitions Created Yet"
                message="Create templates to apply positive or negative effects like deducting rewards or closing markets."
                actionButton={<Button onClick={onCreate}>Create Triumph/Trial</Button>}
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
                                checked={selectedModifiers.length === modifiers.length && modifiers.length > 0}
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                            />
                        </th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {modifiers.map(modifier => (
                        <tr key={modifier.id} className="border-b border-stone-700/40 last:border-b-0">
                            <td className="p-4">
                                <input
                                    type="checkbox"
                                    checked={selectedModifiers.includes(modifier.id)}
                                    onChange={(e) => onSelectOne(e, modifier.id)}
                                    className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500"
                                />
                            </td>
                            <td className="p-4 font-bold">
                                <button onClick={() => onEdit(modifier)} className="hover:underline hover:text-accent transition-colors text-left flex items-center gap-2">
                                    {modifier.icon} {modifier.name}
                                </button>
                            </td>
                            <td className="p-4 text-stone-400">{modifier.description}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Apply Modifier" onClick={() => onApply(modifier)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <CheckBadgeIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(modifier)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([modifier.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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

export default ModifierTable;