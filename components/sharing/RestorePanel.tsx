import React, { useRef } from 'react';
import Button from '../ui/Button';

interface RestorePanelProps {
  onFileSelect: (file: File) => void;
}

const RestorePanel: React.FC<RestorePanelProps> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileSelect(event.target.files[0]);
            event.target.value = ''; // Reset input so the same file can be selected again
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
             <div>
                <h4 className="font-bold text-lg text-stone-200">Restore from Backup</h4>
                <p className="text-stone-400 text-sm mb-3">
                    Restore the entire application state from a backup file.
                    <span className="font-bold text-red-400"> WARNING:</span> This will overwrite all current data. This action is irreversible.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-red-800/50 bg-red-900/20 rounded-lg text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                />
                <Button onClick={handleButtonClick} className="!bg-red-600 hover:!bg-red-500">
                    Select Backup File
                </Button>
            </div>
        </div>
    );
};

export default RestorePanel;
