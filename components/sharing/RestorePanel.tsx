import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface RestorePanelProps {
  onFileSelect: (file: File) => void;
}

const RestorePanel: React.FC<RestorePanelProps> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileSelect(event.target.files[0]);
            event.target.value = ''; 
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
                    Restore your game state from a full backup file.
                    <span className="font-bold text-amber-400"> WARNING:</span> This will overwrite all current data. This action is irreversible.
                </p>
            </div>
            <div className="p-8 border-2 border-dashed border-amber-800/50 bg-amber-900/20 rounded-lg text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                />
                <Button onClick={handleButtonClick} variant="destructive">
                    Select Backup File to Restore
                </Button>
            </div>
        </div>
    );
};

export default RestorePanel;