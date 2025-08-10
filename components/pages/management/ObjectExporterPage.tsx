import React from 'react';
import Card from '../../user-interface/Card';
import ExportPanel from '../../sharing/ExportPanel';

const ObjectExporterPage: React.FC = () => {
    return (
        <div>
            <Card>
                <ExportPanel />
            </Card>
        </div>
    );
};

export default ObjectExporterPage;
