import React, { useState, useMemo } from 'react';
import * as Icons from '../ui/Icons';
import ObjectExporterPage from './management/ObjectExporterPage';
import BackupAndImportPage from './management/BackupAndImportPage';
import AssetLibraryPage from './management/AssetLibraryPage';
import AssetManagerPage from './management/MediaManagerPage';
import DataResetPage from './management/DataResetPage';
import { useAppState } from '../../context/AppContext';
import { Page, SidebarConfigItem, SidebarLink } from '../../types';

type ManagementPageId = 'Object Exporter' | 'Asset Manager' | 'Backup & Import' | 'Asset Library' | 'Data Reset';

const iconMap: { [key in ManagementPageId]: React.FC<{className?: string}> } = {
    'Object Exporter': Icons.ObjectManagerIcon,
    'Asset Manager': Icons.ItemManagerIcon,
    'Backup & Import': Icons.DatabaseIcon,
    'Asset Library': Icons.SparklesIcon,
    'Data Reset': Icons.XCircleIcon,
};

const pageTitles: { [key in ManagementPageId]: string } = {
    'Object Exporter': 'Export content as a shareable Blueprint file.',
    'Asset Manager': 'Upload and manage images for items and avatars.',
    'Backup & Import': 'Create full backups or restore from a file.',
    'Asset Library': 'Install pre-made content packs.',
    'Data Reset': 'Perform destructive actions to reset game data.'
};

const DataManagementPage: React.FC = () => {
    const { settings } = useAppState();
    
    const visibleItems = useMemo((): SidebarConfigItem[] => {
        return settings.sidebars.dataManagement.filter(item => item.isVisible);
    }, [settings.sidebars.dataManagement]);

    const initialPage = useMemo((): Page => {
        const firstLink = visibleItems.find(item => item.type === 'link') as SidebarLink | undefined;
        return firstLink?.id ?? 'Backup & Import';
    }, [visibleItems]);

    const [activePage, setActivePage] = useState<Page>(initialPage);

    const renderContent = () => {
        switch (activePage) {
            case 'Object Exporter': return <ObjectExporterPage />;
            case 'Asset Manager': return <AssetManagerPage />;
            case 'Backup & Import': return <BackupAndImportPage />;
            case 'Asset Library': return <AssetLibraryPage />;
            case 'Data Reset': return <DataResetPage />;
            default: return <BackupAndImportPage />;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-4xl font-medieval text-stone-100 mb-8 flex-shrink-0">Data Management</h1>
            <div className="flex-grow flex gap-6 overflow-hidden">
                <nav className="w-72 bg-stone-800/50 border border-stone-700/60 rounded-xl p-4 flex-shrink-0 flex flex-col">
                    <div className="space-y-2">
                        {visibleItems.map(item => {
                            if (item.type !== 'link') return null;
                            const pageId = item.id as ManagementPageId;
                            const Icon = iconMap[pageId];
                            const description = pageTitles[pageId];
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePage(item.id)}
                                    className={`w-full flex items-start p-3 text-left rounded-lg transition-colors ${activePage === item.id ? 'bg-emerald-600/20 text-emerald-300' : 'text-stone-300 hover:bg-stone-700/50'}`}
                                >
                                    {Icon && <Icon className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />}
                                    <div>
                                        <span className="font-bold capitalize">{item.id}</span>
                                        <p className="text-xs text-stone-400">{description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </nav>
                <div className="flex-grow flex flex-col overflow-y-auto pr-2 scrollbar-hide">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DataManagementPage;
