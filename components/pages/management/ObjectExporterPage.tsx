import React, { useState } from 'react';
import Card from '../../user-interface/Card';
import ExportPanel from '../../sharing/ExportPanel';
import ImportPanel from '../../sharing/ImportPanel';
import { useAppDispatch, useAppState } from '../../../context/AppContext';
import { useAuthState } from '../../../context/AuthContext';
import { useEconomyDispatch, useEconomyState } from '../../../context/EconomyContext';
import { useQuestState } from '../../../context/QuestContext';
import { IAppData, AssetPack, ImportResolution } from '../../../types';
import { analyzeAssetPackForConflicts } from '../../../utils/sharing';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import BlueprintPreviewDialog from '../../sharing/BlueprintPreviewDialog';

const ObjectExporterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('export');
    
    const appState = useAppState();
    const authState = useAuthState();
    const economyState = useEconomyState();
    const questState = useQuestState();
    const { importAssetPack } = useEconomyDispatch();
    const { addNotification } = useNotificationsDispatch();

    const [assetPackToPreview, setAssetPackToPreview] = useState<AssetPack | null>(null);
    const [initialResolutions, setInitialResolutions] = useState<ImportResolution[]>([]);

    const handleFileSelect = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (json.manifest && json.assets) {
                    const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState, ...questState };
                    const conflictResolutions = analyzeAssetPackForConflicts(json, fullCurrentData);
                    setInitialResolutions(conflictResolutions);
                    setAssetPackToPreview(json);
                } else {
                    addNotification({ type: 'error', message: 'This does not appear to be a valid blueprint file.' });
                }
            } catch (error) {
                addNotification({ type: 'error', message: 'Failed to read or parse the file.' });
            }
        };
        reader.readAsText(file);
    };
    
    const handleConfirmImport = (pack: AssetPack, resolutions: ImportResolution[]) => {
        const fullCurrentData: IAppData = { ...appState, ...authState, ...economyState, ...questState };
        importAssetPack(pack, resolutions, fullCurrentData);
        setAssetPackToPreview(null);
        setInitialResolutions([]);
    };

    return (
        <div>
            <Card>
                <div className="border-b border-stone-700 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('export')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'export' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Export Blueprint</button>
                        <button onClick={() => setActiveTab('import')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'import' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}>Import Blueprint</button>
                    </nav>
                </div>

                {activeTab === 'export' && <ExportPanel />}
                {activeTab === 'import' && <ImportPanel onFileSelect={handleFileSelect} />}
            </Card>

            {assetPackToPreview && (
                <BlueprintPreviewDialog
                    blueprint={assetPackToPreview}
                    initialResolutions={initialResolutions}
                    onClose={() => setAssetPackToPreview(null)}
                    onConfirm={handleConfirmImport}
                />
            )}
        </div>
    );
};

export default ObjectExporterPage;