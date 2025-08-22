import React from 'react';
import { Rotation, Terminology } from '../../types';
import Button from '../user-interface/Button';
import EmptyState from '../user-interface/EmptyState';
import { PencilIcon, PlayIcon, TrashIcon } from '../user-interface/Icons';

interface RotationTableProps {
    rotations: Rotation[];
    selectedRotations: string[];
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelectOne: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
    onEdit: (rotation: Rotation) => void;
    onRun: (rotationId: string) => void;
    onDeleteRequest: (ids: string[]) => void;
    terminology: Terminology;
    onCreate: () => void;
}

const RotationTable: React.FC<RotationTableProps> = ({
    rotations,
    selectedRotations,
    onSelectAll,
    onSelectOne,
    onEdit,
    onRun,
    onDeleteRequest,
    terminology,
    onCreate
}) => {
    if (rotations.length === 0) {
        return (
             <EmptyState
                Icon={() => <span className="text-4xl">🔄</span>}
                title="No Rotations Created Yet"
                message="Create a rotation to automatically assign a pool of quests to a group of users on a schedule."
                actionButton={<Button onClick={onCreate}>Create Rotation</Button>}
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
                                checked={selectedRotations.length === rotations.length && rotations.length > 0} 
                                className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" 
                            />
                        </th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Description</th>
                        <th className="p-4 font-semibold">Frequency</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rotations.map(rotation => (
                        <tr key={rotation.id} className="border-b border-stone-700/40 last:border-b-0">
                             <td className="p-4">
                                <input 
                                    type="checkbox" 
                                    checked={selectedRotations.includes(rotation.id)} 
                                    onChange={(e) => onSelectOne(e, rotation.id)} 
                                    className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500" 
                                />
                            </td>
                            <td className="p-4 font-bold">
                                 <button onClick={() => onEdit(rotation)} className="hover:underline hover:text-accent transition-colors text-left">
                                    {rotation.name}
                                 </button>
                            </td>
                            <td className="p-4 text-stone-400">{rotation.description}</td>
                            <td className="p-4 text-stone-300 capitalize">{rotation.frequency.toLowerCase()}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" title="Run Now" onClick={() => onRun(rotation.id)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PlayIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Edit" onClick={() => onEdit(rotation)} className="h-8 w-8 text-stone-400 hover:text-white">
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => onDeleteRequest([rotation.id])} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/50">
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

export default RotationTable;
