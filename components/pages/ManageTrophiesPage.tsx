import React, { useState, useRef, useEffect } from 'react';
import { Trophy } from '../../types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/Dropdown-Menu";
import EditTrophyDialog from '../settings/EditTrophyDialog';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import EmptyState from '../ui/EmptyState';
import TrophyIdeaGenerator from '../quests/TrophyIdeaGenerator';
import { TrophyIcon } from '@/components/ui/Icons';
import { EllipsisVertical } from 'lucide-react';


const ManageTrophiesPage: React.FC = () => {
    const { trophies, settings, isAiConfigured } = useAppState();
    const { deleteTrophies, cloneTrophy } = useAppDispatch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrophy, setEditingTrophy] = useState<Trophy | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; icon: string; } | null>(null);
    const [selectedTrophies, setSelectedTrophies] = useState<string[]>([]);

    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const handleCreate = () => {
        setEditingTrophy(null);
        setInitialCreateData(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (trophy: Trophy) => {
        setEditingTrophy(trophy);
        setInitialCreateData(null);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (trophyIds: string[]) => {
        setDeletingIds(trophyIds);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteTrophies(deletingIds);
            setSelectedTrophies([]);
        }
        setDeletingIds([]);
    };
    
    const handleUseIdea = (idea: { name: string; description: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingTrophy(null);
        setIsDialogOpen(true);
    };
    
    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked) {
            setSelectedTrophies(trophies.map(t => t.id));
        } else {
            setSelectedTrophies([]);
        }
    };

    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedTrophies(prev => [...prev, id]);
        } else {
            setSelectedTrophies(prev => prev.filter(trophyId => trophyId !== id));
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{`All Created ${settings.terminology.awards}`}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isAiAvailable && (
                            <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="outline">
                                Create with AI
                            </Button>
                        )}
                        <Button size="sm" onClick={handleCreate}>Create New {settings.terminology.award}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedTrophies.length > 0 && (
                        <div className="flex items-center gap-2 p-2 mb-4 bg-background rounded-lg border">
                            <span className="text-sm font-semibold px-2">{selectedTrophies.length} selected</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(selectedTrophies)}>Delete</Button>
                        </div>
                    )}
                    {trophies.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="p-4 w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selectedTrophies.length === trophies.length && trophies.length > 0} /></th>
                                        <th className="p-4 font-semibold">Icon</th>
                                        <th className="p-4 font-semibold">Name</th>
                                        <th className="p-4 font-semibold">Description</th>
                                        <th className="p-4 font-semibold">Type</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trophies.map(trophy => (
                                        <tr key={trophy.id} className="border-b last:border-b-0">
                                            <td className="p-4"><Checkbox checked={selectedTrophies.includes(trophy.id)} onCheckedChange={checked => handleSelectOne(trophy.id, checked === true)} /></td>
                                            <td className="p-4 text-2xl">{trophy.icon}</td>
                                            <td className="p-4 font-bold">{trophy.name}</td>
                                            <td className="p-4 text-muted-foreground max-w-sm truncate">{trophy.description}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trophy.isManual ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                    {trophy.isManual ? 'Manual' : 'Automatic'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><EllipsisVertical className="w-4 h-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleEdit(trophy)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => cloneTrophy(trophy.id)}>Clone</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleDeleteRequest([trophy.id])} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            Icon={TrophyIcon}
                            title={`No ${settings.terminology.awards} Created`}
                            message={`Create ${settings.terminology.awards.toLowerCase()} for users to earn through milestones or manual grants.`}
                            actionButton={<Button onClick={handleCreate}>Create {settings.terminology.award}</Button>}
                        />
                    )}
                </CardContent>
            </Card>

            {isDialogOpen && <EditTrophyDialog trophy={editingTrophy} initialData={initialCreateData || undefined} onClose={() => {
                setIsDialogOpen(false);
                setInitialCreateData(null);
            }} />}
            {isGeneratorOpen && <TrophyIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}
            
            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title={`Delete ${deletingIds.length > 1 ? settings.terminology.awards : settings.terminology.award}`}
                message={`Are you sure you want to delete ${deletingIds.length} ${deletingIds.length > 1 ? settings.terminology.awards.toLowerCase() : settings.terminology.award.toLowerCase()}? This is permanent.`}
            />
        </div>
    );
};

export default ManageTrophiesPage;
