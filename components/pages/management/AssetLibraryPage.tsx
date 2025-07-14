import React, { useState } from 'react';
import Button from '../../ui/Button';
import Card from '../../ui/Card';
import { libraryPacks } from '../../../data/assetLibrary';
import { LibraryPack } from '../../../types';
import AssetLibraryImportDialog from '../../sharing/AssetLibraryImportDialog';

const AssetLibraryPage: React.FC = () => {
    const [selectedPack, setSelectedPack] = useState<LibraryPack | null>(null);

    return (
        <div className="space-y-6">
            <Card title="Built-in Asset Library">
                <p className="text-stone-400 text-sm mb-4">
                    Quickly populate your game with pre-made content packs. Select a pack to see its contents, then install the assets you want to add to your game.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {libraryPacks.map(pack => (
                        <button key={pack.id} onClick={() => setSelectedPack(pack)} className="text-left">
                            <Card className={`h-full hover:bg-stone-700/50 hover:border-accent transition-colors duration-200 border-2 ${pack.color || 'border-stone-700/60'}`}>
                                <span className="text-sm font-bold uppercase text-emerald-400">{pack.type}</span>
                                <h4 className="text-lg font-bold text-stone-100 mt-1">{pack.title}</h4>
                                <p className="text-sm text-stone-400 mt-2">{pack.description}</p>
                            </Card>
                        </button>
                    ))}
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