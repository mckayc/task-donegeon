import React, { useState, ChangeEvent } from 'react';
import { useAppState } from '../../context/AppContext';
import { Blueprint, ImportResolution, ShareableAssetType, Terminology } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

interface BlueprintPreviewDialogProps {
  blueprint: Blueprint;
  initialResolutions: ImportResolution[];
  onClose: () => void;
  onConfirm: (blueprint: Blueprint, resolutions: ImportResolution[]) => void;
}

const terminologyMap: { [key in ShareableAssetType]: keyof Terminology } = {
    quests: 'tasks',
    questGroups: 'link_manage_quest_groups',
    rewardTypes: 'points',
    ranks: 'levels',
    trophies: 'awards',
    markets: 'stores',
    gameAssets: 'link_manage_items',
};

const BlueprintPreviewDialog: React.FC<BlueprintPreviewDialogProps> = ({ blueprint, initialResolutions, onClose, onConfirm }) => {
    const { settings } = useAppState();
    const [resolutions, setResolutions] = useState(initialResolutions);

    const handleResolutionChange = (id: string, type: ShareableAssetType, resolution: 'skip' | 'rename') => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, resolution } : r));
    };

    const handleRenameChange = (id: string, type: ShareableAssetType, newName: string) => {
        setResolutions(prev => prev.map(r => r.id === id && r.type === type ? { ...r, newName } : r));
    };

    const newItems = resolutions.filter(r => r.status === 'new');
    const conflictingItems = resolutions.filter(r => r.status === 'conflict');

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Blueprint Preview</DialogTitle>
                    <p className="text-muted-foreground mt-1">Review the contents before importing.</p>
                </DialogHeader>

                <div className="flex-1 space-y-4 py-4 overflow-y-auto pr-6">
                    <div className="p-4 bg-background rounded-lg border">
                        <h3 className="font-bold text-lg text-foreground">{blueprint.name}</h3>
                        <p className="text-sm text-muted-foreground">by {blueprint.author}</p>
                        <p className="text-foreground mt-2">{blueprint.description}</p>
                    </div>

                    {newItems.length > 0 && (
                        <div className="p-4 bg-background rounded-lg border">
                            <h4 className="font-semibold text-green-400 mb-2">New Items to be Added ({newItems.length})</h4>
                            <ul className="text-sm text-foreground list-disc list-inside max-h-32 overflow-y-auto">
                                {newItems.map(res => <li key={`${res.type}-${res.id}`}>{res.name} <span className="text-xs text-muted-foreground capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></li>)}
                            </ul>
                        </div>
                    )}
                    
                    {conflictingItems.length > 0 && (
                        <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                            <h4 className="font-semibold text-amber-400 mb-2">Name Conflicts ({conflictingItems.length})</h4>
                            <p className="text-sm text-amber-400/80 mb-4">Some items in this blueprint have the same name as items you already have. Please choose how to handle them.</p>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {conflictingItems.map(res => (
                                    <div key={`${res.type}-${res.id}`} className="bg-background/50 p-3 rounded-md">
                                        <p className="font-bold text-foreground">{res.name} <span className="text-xs text-muted-foreground capitalize">({settings.terminology[terminologyMap[res.type]] || res.type})</span></p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Label className="flex items-center">
                                                <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'skip'} onChange={() => handleResolutionChange(res.id, res.type, 'skip')} className="h-4 w-4 text-primary bg-background border-input focus:ring-ring" />
                                                <span className="ml-2 text-sm">Skip Import</span>
                                            </Label>
                                            <Label className="flex items-center">
                                                <input type="radio" name={`${res.type}-${res.id}`} checked={res.resolution === 'rename'} onChange={() => handleResolutionChange(res.id, res.type, 'rename')} className="h-4 w-4 text-primary bg-background border-input focus:ring-ring" />
                                                <span className="ml-2 text-sm">Rename</span>
                                            </Label>
                                        </div>
                                        {res.resolution === 'rename' && (
                                            <Input
                                                value={res.newName || `${res.name} (Imported)`}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleRenameChange(res.id, res.type, e.target.value)}
                                                className="mt-2 text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={() => onConfirm(blueprint, resolutions)}>Confirm & Import</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BlueprintPreviewDialog;