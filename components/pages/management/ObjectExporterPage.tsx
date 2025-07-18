import React from 'react';
import ExportPanel from '../../sharing/ExportPanel';
import Card from '../../ui/Card';
import { useAppState } from '../../../context/AppContext';

const ObjectExporterPage: React.FC = () => {
    const { settings } = useAppState();

    return (
        <div>
            <Card>
                <ExportPanel />
            </Card>
        </div>
    );
};

export default ObjectExporterPage;