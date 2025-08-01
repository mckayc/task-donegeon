import React, { useState, useMemo } from 'react';
import * as Icons from '@/components/ui/Icons';
import ObjectExporterPage from './management/ObjectExporterPage';
import BackupAndImportPage from './management/BackupAndImportPage';
import AssetLibraryPage from './management/AssetLibraryPage';
import AssetManagerPage from './management/MediaManagerPage';
import { useAppState } from '../../context/AppContext';
import { Page, SidebarConfigItem, SidebarLink } from '../../types';

type ManagementPage = 'Object Exporter' | 'Asset Manager' | 'Backup & Import' | 'Asset Library';

const iconMap: { [key in ManagementPage]: React.FC<{className?: string}> } = {
    'Object Exporter': Icons.ObjectManagerIcon,
    'Asset Manager': Icons.ItemManagerIcon,
    'Backup & Import': Icons.DatabaseIcon,
    'Asset Library': Icons.SparklesIcon,
};

const DataManagementPage: React.FC = () => {
    const { settings } = useAppState();
    
    const visibleItems = useMemo((): SidebarConfigItem[] => {
        return settings.sidebars.dataManagement.filter((item: SidebarConfigItem) => item.isVisible);
    }, [settings.sidebars.dataManagement]);

    const initialPage = useMemo((): Page => {
        const firstLink = visibleItems.find((item): item is SidebarLink => item.type === 'link');
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
            <h1 className="text-4xl font-display text-foreground mb-8 flex-shrink-0">Data Management</h1>
            <div className="flex-grow flex gap-6 overflow-hidden">
                <nav className="w-64 bg-card border rounded-xl p-4 flex-shrink-0 flex flex-col">
                    <div className="space-y-2">
                        {visibleItems.map(item => {
                            if (item.type !== 'link') return null;
                            const Icon = iconMap[item.id as ManagementPage];
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePage(item.id)}
                                    className={`w-full flex items-center p-3 text-left rounded-lg transition-colors ${activePage === item.id ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-accent/50'}`}
                                >
                                    {Icon && <Icon className="w-6 h-6 mr-3" />}
                                    <span className="capitalize">{item.id}</span>
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
