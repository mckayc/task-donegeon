

import React, { useState, useMemo } from 'react';
import * as Icons from '../ui/Icons';
import ObjectExporterPage from './management/ObjectExporterPage';
import BackupAndImportPage from './management/BackupAndImportPage';
import AssetLibraryPage from './management/AssetLibraryPage';
import AssetManagerPage from './management/MediaManagerPage';
import { useSettingsState } from '../../context/AppContext';
import { Page, SidebarConfigItem, SidebarLink } from '../../types';

type ManagementPage = 'Object Exporter' | 'Asset Manager' | 'Backup & Import' | 'Asset Library';

const iconMap: { [key in ManagementPage]: React.FC<{className?: string}> } = {
    'Object Exporter': Icons.ObjectManagerIcon,
    'Asset Manager': Icons.ItemManagerIcon,
    'Backup & Import': Icons.DatabaseIcon,
    'Asset Library': Icons.SparklesIcon,
};

const DataManagementPage: React.FC = () => {
    const { settings } = useSettingsState();
    
    const visibleItems = useMemo((): SidebarConfigItem[] => {
        return settings.sidebars.dataManagement.filter(item => item.isVisible);
    }, [settings.sidebars.dataManagement]);

    const initialPage = useMemo((): Page => {
        const firstLink = visibleItems.find(item => item.type === 'link') as SidebarLink | undefined;
        return firstLink?.id ?? 'Object Exporter';
    }, [visibleItems]);

    const [activePage, setActivePage] = useState<Page>(initialPage);


    const renderContent = () => {
        switch (activePage) {
            case 'Object Exporter': return <ObjectExporterPage />;
            case 'Asset Manager': return <AssetManagerPage />;
            case 'Backup & Import': return <BackupAndImportPage />;
            case 'Asset Library': return <AssetLibraryPage />;
            default: return <ObjectExporterPage />;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow flex gap-6 overflow-hidden">
                <nav className="w-64 bg-stone-800/50 border border-stone-700/60 rounded-xl p-4 flex-shrink-0 flex flex-col">
                    <div className="space-y-2">
                        {visibleItems.map(item => {
                            if (item.type !== 'link') return null;
                            const Icon = iconMap[item.id as ManagementPage];
                            const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePage(item.id)}
                                    className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${activePage === item.id ? 'bg-emerald-600/20 text-emerald-300' : 'text-stone-300 hover:bg-stone-700/50'}`}
                                >
                                    {Icon && <Icon className="w-5 h-5 mr-3" />}
                                    <span className="capitalize">{linkName}</span>
                                </button>
                            );
                        })}
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