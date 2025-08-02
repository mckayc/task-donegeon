import React, { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { useAppState, useAppDispatch } from '../../../context/AppContext';
import { GameAsset } from '../../../types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Checkbox } from "@/components/ui/Checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/Dropdown-Menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import ConfirmDialog from '../../ui/ConfirmDialog';
import EditGameAssetDialog from '../../admin/EditGameAssetDialog';
import EmptyState from '../../ui/EmptyState';
import { ItemManagerIcon, EllipsisVerticalIcon } from '@/components/ui/Icons';
import ItemIdeaGenerator from '../../quests/ItemIdeaGenerator';
import { Input } from '@/components/ui/Input';
import ImagePreviewDialog from '../../ui/ImagePreviewDialog';

const ManageItemsPage: React.FC = () => {
    const { gameAssets, settings, isAiConfigured } = useAppState();
    const { deleteGameAssets, cloneGameAsset } = useAppDispatch();
    
    const [editingAsset, setEditingAsset] = useState<GameAsset | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [initialCreateData, setInitialCreateData] = useState<{ name: string; description: string; category: string; icon: string; } | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc'>('createdAt-desc');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);


    const isAiAvailable = settings.enableAiFeatures && isAiConfigured;

    const categories = useMemo(() => ['All', ...Array.from(new Set(gameAssets.map(a => a.category)))], [gameAssets]);

    useEffect(() => {
        setSelectedAssets([]);
    }, [activeTab, searchTerm, sortBy]);

    const filteredAndSortedAssets = useMemo(() => {
        let assets = [...gameAssets];
        if (activeTab !== 'All') {
            assets = assets.filter(a => a.category === activeTab);
        }
        if (searchTerm) {
            assets = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        assets.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'createdAt-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'createdAt-desc':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });
        return assets;
    }, [gameAssets, activeTab, searchTerm, sortBy]);

    const handleEdit = (asset: GameAsset) => {
        setEditingAsset(asset);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setInitialCreateData(null);
        setIsCreateDialogOpen(true);
    };

    const handleDeleteRequest = (assetIds: string[]) => {
        setDeletingIds(assetIds);
    };

    const handleConfirmDelete = () => {
        if (deletingIds.length > 0) {
            deleteGameAssets(deletingIds);
            setSelectedAssets([]);
        }
        setDeletingIds([]);
    };
    
    const handleCloseDialog = () => {
        setEditingAsset(null);
        setIsCreateDialogOpen(false);
        setInitialCreateData(null);
    }
    
    const handleUseIdea = (idea: { name: string; description: string; category: string; icon: string; }) => {
        setIsGeneratorOpen(false);
        setInitialCreateData(idea);
        setEditingAsset(null);
        setIsCreateDialogOpen(true);
    };
    
    const handleSelectAll = (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelectedAssets(filteredAndSortedAssets.map(a => a.id));
        } else {
            setSelectedAssets([]);
        }
    };
    
    const handleSelectOne = (id: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedAssets(prev => [...prev, id]);
        } else {
            setSelectedAssets(prev => prev.filter(assetId => assetId !== id));
        }
    };
    

    const headerActions = (
        <div className="flex items-center gap-2 flex-wrap">
            {isAiAvailable && (
                <Button size="sm" onClick={() => setIsGeneratorOpen(true)} variant="outline">
                    Create with AI
                </Button>
            )}
            <Button size="sm" onClick={handleCreate}>Create New Asset</Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Created Items & Assets</CardTitle>
                    {headerActions}
                </CardHeader>
                <CardContent>
                    <div className="border-b mb-4">
                        <nav className="-mb-px flex space-x-4 overflow-x-auto">
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setActiveTab(category)}
                                    className={`capitalize whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === category
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                        <Input placeholder="Search assets..." value={searchTerm} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} className="max-w-xs" />
                        <Select onValueChange={(e: any) => setSortBy(e)} defaultValue={sortBy}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt-desc">Date (Newest)</SelectItem>
                                <SelectItem value="createdAt-asc">Date (Oldest)</SelectItem>
                                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                            </SelectContent>
                        </Select>
                        {selectedAssets.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg border">
                                <span className="text-sm font-semibold px-2">{selectedAssets.length} selected</span>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteRequest(selectedAssets)}>Delete</Button>
                            </div>
                        )}
                    </div>

                    {filteredAndSortedAssets.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredAndSortedAssets.map(asset => (
                                 <div key={asset.id} className="relative group">
                                     <div className="absolute top-2 left-2 z-10">
                                         <Checkbox
                                            id={`select-asset-${asset.id}`}
                                            checked={selectedAssets.includes(asset.id)}
                                            onCheckedChange={(checked: boolean | "indeterminate") => handleSelectOne(asset.id, checked === true)}
                                        />
                                    </div>
                                    <Card className="h-full flex flex-col hover:border-accent transition-colors duration-200">
                                        <CardContent className="p-0">
                                            <button
                                                onClick={() => setPreviewImageUrl(asset.url)}
                                                className="w-full aspect-square bg-background/20 rounded-t-lg flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary ring-offset-2 ring-offset-card"
                                                aria-label={`View larger image of ${asset.name}`}
                                            >
                                                <img src={asset.url} alt={asset.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" />
                                            </button>
                                        </CardContent>
                                        <div className="p-3">
                                            <button 
                                                onClick={() => handleEdit(asset)} 
                                                className="w-full text-left"
                                            >
                                                <p className="font-bold text-foreground truncate hover:underline hover:text-accent transition-colors" title={asset.name}>{asset.name}</p>
                                            </button>
                                            <p className="text-xs text-muted-foreground">{asset.category}</p>
                                        </div>
                                    </Card>
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <EllipsisVerticalIcon className="w-4 h-4 text-white" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleEdit(asset)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => cloneGameAsset(asset.id)}>Clone</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDeleteRequest([asset.id])} className="text-red-400 focus:text-red-400">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            Icon={ItemManagerIcon}
                            title="No Assets Found"
                            message={searchTerm ? "No assets match your search." : "Create your first asset to be used as a reward or marketplace item."}
                            actionButton={<Button onClick={handleCreate}>Create Asset</Button>}
                        />
                    )}
                </CardContent>
            </Card>
            
            {isCreateDialogOpen && <EditGameAssetDialog 
                assetToEdit={editingAsset} 
                initialData={initialCreateData ? { 
                    url: `https://placehold.co/150/FFFFFF/000000?text=${encodeURIComponent(initialCreateData.icon)}`, 
                    name: initialCreateData.name, 
                    category: initialCreateData.category, 
                    description: initialCreateData.description 
                } : null} 
                onClose={handleCloseDialog} 
            />}
            {isGeneratorOpen && <ItemIdeaGenerator onUseIdea={handleUseIdea} onClose={() => setIsGeneratorOpen(false)} />}


            <ConfirmDialog
                isOpen={deletingIds.length > 0}
                onClose={() => setDeletingIds([])}
                onConfirm={handleConfirmDelete}
                title="Delete Asset(s)"
                message={`Are you sure you want to delete ${deletingIds.length} asset(s)? This action is permanent.`}
            />

            {previewImageUrl && (
                <ImagePreviewDialog
                    imageUrl={previewImageUrl}
                    altText="Asset preview"
                    onClose={() => setPreviewImageUrl(null)}
                />
            )}
        </div>
    );
};

export default ManageItemsPage;