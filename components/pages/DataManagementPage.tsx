
import React, { useState } from 'react';
import * as Icons from '../ui/Icons';
import ObjectManagerPage from './management/ObjectManagerPage';
import BackupAndImportPage from './management/BackupAndImportPage';
import AssetLibraryPage from './management/AssetLibraryPage';
import AssetManagerPage from './management/MediaManagerPage';

type ManagementPage = 'objects' | 'assets' | 'backup' | 'library';

const DataManagementPage: React.FC = () => {
    const [activePage, setActivePage] = useState<ManagementPage>('objects');

    const managementPages: { id: ManagementPage, label: string, icon: React.FC }[] = [
        { id: 'objects', label: 'Object Manager', icon: Icons.ObjectManagerIcon },
        { id: 'assets', label: 'Asset Manager', icon: Icons.ItemManagerIcon },
        { id: 'backup', label: 'Backup & Import', icon: Icons.DatabaseIcon },
        { id: 'library', label: 'Asset Library', icon: Icons.SparklesIcon },
    ];
    
    const renderContent = () => {
        switch (activePage) {
            case 'objects':
                return <ObjectManagerPage />;
            case 'assets':
                return <AssetManagerPage />;
            case 'backup':
                return <BackupAndImportPage />;
            case 'library':
                return <AssetLibraryPage />;
            default:
                return null;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-4xl font-medieval text-stone-100 mb-8 flex-shrink-0">Data Management</h1>
            <div className="flex-grow flex gap-6 overflow-hidden">
                <nav className="w-64 bg-stone-800/50 border border-stone-700/60 rounded-xl p-4 flex-shrink-0 flex flex-col">
                    <div className="space-y-2">
                        {managementPages.map(page => (
                            <button
                                key={page.id}
                                onClick={() => setActivePage(page.id)}
                                className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${activePage === page.id ? 'bg-emerald-600/20 text-emerald-300' : 'text-stone-300 hover:bg-stone-700/50'}`}
                            >
                                <page.icon />
                                <span className="capitalize">{page.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>
                <div className="flex-grow flex flex-col overflow-y-auto pr-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DataManagementPage;