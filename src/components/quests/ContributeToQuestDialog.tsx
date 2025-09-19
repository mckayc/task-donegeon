import React from 'react';
import Button from '../user-interface/Button';

// This is a placeholder for a future feature.
const ContributeToQuestDialog: React.FC<{onClose: () => void}> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 p-8 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Contribute to Quest</h2>
                <p className="mb-4">This feature is not yet implemented.</p>
                <Button onClick={onClose}>Close</Button>
            </div>
        </div>
    );
};

export default ContributeToQuestDialog;
