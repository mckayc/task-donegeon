import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { Rotation } from '../../../types';
import Button from '../../user-interface/Button';
import Card from '../../user-interface/Card';
import EditRotationDialog from '../../rotations/EditRotationDialog';
import ConfirmDialog from '../../user-interface/ConfirmDialog';
import { useShiftSelect } from '../../../hooks/useShiftSelect';
import RotationTable from '../../rotations/RotationTable';
import { useQuestsState, useQuestsDispatch, QuestsDispatchContext } from '../../../context/QuestsContext';
import { useSystemState, useSystemDispatch } from '../../../context/SystemContext';
import { useUIState } from '../../../context/UIContext';
import ToggleSwitch from '../../user-interface/ToggleSwitch';
import { EllipsisVerticalIcon } from '../../user-interface/Icons';
import { useAuthState } from '../../../context/AuthContext';

const RotationCard: React.FC<{
    rotation: Rotation;
    isSelected: boolean;
    onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (rotation: Rotation) => void;
    onStatusChange: (rotation: Rotation, isActive: boolean) => void;
    onClone: (rotationId: string) => void;
    onRun: (rotationId: string) => void;
    onDeleteRequest: (rotationId: string) => void;
}> = ({ rotation, isSelected, onToggle, onEdit, onStatusChange, onClone, onRun, onDeleteRequest }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { users } = useAuthState();
    const { quests } = useQuestsState();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userCount = useMemo(() => rotation.userIds.filter(id => users.some(u => u.id === id)).length, [rotation.userIds, users]);
    const questCount = useMemo(() => rotation.questIds.filter(id => quests.some(q => q.id === id)).length, [rotation.questIds, quests]);

    return (
        <div className="bg-stone-800/60 p-4 rounded-lg flex items-start gap-4 border border-stone-700">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="mt-1 h-5 w-5 rounded text-emerald-600 bg-stone-700 border-stone-600 focus:ring-emerald-500 flex-shrink-0"
            />
            <div className="flex-grow overflow-hidden">
                <p className="font-bold text-stone-100 whitespace-normal break-words">{rotation.name}</p>
                <p className="text-sm text-stone-400 capitalize">{userCount} users, {questCount} quests, {rotation.frequency.toLowerCase()}</p>
                <div className="mt-2">
                    <ToggleSwitch enabled={rotation.isActive} setEnabled={(val) => onStatusChange(rotation, val)} label="Status" />
                </div>
            </div>
            <div className="relative flex-shrink-0" ref={dropdownRef}>
                <Button variant="ghost" size="icon" onClick={() => setDropdownOpen(p => !p)}>
                    <EllipsisVerticalIcon className="w-5 h-5 text-stone-300" />
                </Button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 bg-stone-900 border border-stone-700 rounded-lg shadow-xl z-20">
                        <button onClick={() => { onRun(rotation.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Run Now</button>
                        <button onClick={() => { onEdit(rotation); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { onClone(rotation.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-stone-300 hover:bg-stone-700">Clone</button>
                        <button onClick={() => { onDeleteRequest(rotation.id); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-stone-700">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ManageRotationsPage: React.FC = () => {
    const { settings } = useSystemState();
    const { rotations } = useQuestsState();
    const { deleteSelectedAssets } = useSystemDispatch();
    const { cloneRotation, updateRotation, runRotation } = useQuestsDispatch();
    const { dispatch: questsDispatch } = useContext(QuestsDispatchContext)!;
    const { isMobileView } = useUIState();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRotation, setEditingRotation] = useState<Rotation | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [selectedRotations, setSelectedRotations] = useState<string[]>([]);

    const rotationIds = useMemo(() => rotations.map(r => r.id), [rotations]);
    const handleCheckboxClick = useShiftSelect(rotationIds, selectedRotations, setSelectedRotations);

    const handleCreate = () => {
        setEditingRotation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (rotation: Rotation) => {
        setEditingRotation(rotation);
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteSelectedAssets({ rotations: deletingIds }, () => {
                questsDispatch({ type: 'REMOVE_QUESTS_DATA', payload: { rotations: deletingIds } });
                setDeletingIds([]);
                setSelectedRotations([]);
            });
        } else {
            setDeletingIds([]);
        }
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRotations(e.target.checked ? rotationIds : []);
    };
    
    const handleStatusChange = (rotation: Rotation, isActive: boolean) => {
        updateRotation({ ...rotation, isActive });
    };

    const handleRunRotation = (rotationId: string) => {
        runRotation(rotationId);
    };

    return (
        <div className="space-y-6">
            <Card
                title={settings.terminology.link_manage_rotations}
                headerAction={<Button onClick={handleCreate} size="sm">Create New Rotation</Button>}
            >
                 {selectedRotations.length > 0 && (
                     <div className="flex items-center gap-2 p-2 mb-4 bg-stone-900/50 rounded-lg">
                        <span className="text-sm font-semibold text-stone-300 px-2">{selectedRotations.length} selected</span>
                        <Button size="sm" variant="secondary" onClick={() => cloneRotation(selectedRotations[0])} disabled={selectedRotations.length !== 1}>Clone</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(rotations.find(r => r.id === selectedRotations[0])!)} disabled={selectedRotations.length !== 1}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingIds(selectedRotations)}>Delete</Button>
                    </div>
                )}
                {isMobileView ? (
                    <div className="space-y-3">
                        {rotations.map(rotation => (
                            <RotationCard
                                key={rotation.id}
                                rotation={rotation}
                                isSelected={selectedRotations.includes(rotation.id)}
                                onToggle={(e) => handleCheckboxClick(e, rotation.id)}
                                onEdit={handleEdit}
                                onStatusChange={handleStatusChange}
                                onClone={cloneRotation}
                                onRun={handleRunRotation}
                                onDeleteRequest={(id) => setDeletingIds([id])}
                            />
                        ))}
                    </div>
                ) : (
                    <RotationTable
                        rotations={rotations}
                        selectedRotations={selectedRotations}
                        onSelectAll={handleSelectAll}
                        onSelectOne={handleCheckboxClick}
                        onEdit={handleEdit}
                        onStatusChange={handleStatusChange}
                        onClone={cloneRotation}
                        onRun={handleRunRotation}
                        onDeleteRequest={(ids) => setDeletingIds(ids)}
                        terminology={settings.terminology}
                        onCreate={handleCreate}
                    />
                )}
            </Card>

            {isDialogOpen && <EditRotationDialog rotationToEdit={editingRotation} onClose={() => setIsDialogOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? 'Rotations' : 'Rotation'}`}
                message={`Are you sure you want to delete ${deletingIds.length > 1 ? `${deletingIds.length} rotations` : `this rotation`}? This cannot be undone.`}
            />
        </div>
    );
};

export default ManageRotationsPage;