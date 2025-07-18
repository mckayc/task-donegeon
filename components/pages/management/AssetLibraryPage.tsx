import React, { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { libraryPacks, LibraryPack } from '../../../data/assetLibrary';
import AssetLibraryImportDialog from '../../sharing/AssetLibraryImportDialog';
import { QuestType } from '../../../types';

const assetTypes: { packFilter: (pack: LibraryPack) => boolean; title: string; }[] = [
    { 
        title: 'Quest Packs - Duties', 
        packFilter: pack => pack.type === 'Quests' && (pack.assets.quests || []).every(q => q.type === QuestType.Duty) 
    },
    { 
        title: 'Quest Packs - Ventures', 
        packFilter: pack => pack.type === 'Quests' && (pack.assets.quests || []).every(q => q.type === QuestType.Venture) 
    },
    { title: 'Item Packs', packFilter: pack => pack.type === 'Items' },
    { title: 'Market Packs', packFilter: pack => pack.type === 'Markets' },
    { title: 'Trophy Packs', packFilter: pack => pack.type === 'Trophies' },
    { title: 'Reward Packs', packFilter: pack => pack.type === 'Rewards' },
];


const AssetLibraryPage: React.FC = () => {
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);

    return (
        <div className="space-y-6">
            <Card title="Built-in Asset Library">
                <p className="text-stone-400 text-sm mb-6">
                    Quickly populate your game with pre-made content packs. Select a pack to see its contents, then install the assets you want to add to your game.
                </p>
                <div className="space-y-8">
                     {assetTypes.map(assetType => {
                        const packsOfType = libraryPacks.filter(assetType.packFilter);
                        if (packsOfType.length === 0) return null;

                        return (
                        <div key={assetType.title}>
                            <h3 className="text-2xl font-medieval text-stone-200 mb-4">{assetType.title}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packsOfType.map(pack => (
                                <button key={pack.id} onClick={() => setSelectedPack(pack)} className="text-left h-full">
                                    <Card className={`h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200 border-2 ${pack.color || 'border-stone-700/60'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{pack.emoji}</span>
                                            <span className={`text-sm font-bold uppercase ${pack.color ? '' : 'text-emerald-400'}`}>{pack.type}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-stone-100 mt-2">{pack.title}</h4>
                                        <p className="text-sm text-stone-400 mt-2">{pack.description}</p>
                                    </Card>
                                </button>
                            ))}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </Card>

            {selectedPack && (
                <AssetLibraryImportDialog
                    pack={selectedPack}
                    onClose={() => setSelectedPack(null)}
                />
            )}
        </div>
    );
};

export default AssetLibraryPage;