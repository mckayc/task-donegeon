import React from 'react';
import ExportPanel from '../../sharing/ExportPanel';
import Card from '../../ui/Card';
import { useAppState } from '../../../context/AppContext';

const ObjectExporterPage: React.FC = () => {
    const { settings } = useAppState();

    return (
        <div>
            <h1 className="text-3xl font-medieval text-stone-100 mb-8">Export {settings.terminology.tasks}, {settings.terminology.stores}, and more</h1>
            <Card>
                <ExportPanel />
            </Card>
        </div>
    );
};

export default ObjectExporterPage;