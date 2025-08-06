
import React, { useRef } from 'react';
import Button from '../ui/Button';

interface ImportPanelProps {
  onFileSelect: (file: File) => void;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ onFileSelect }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFileSelect(event.target.files[0]);
            // Reset input so the same file can be selected again
            event.target.value = ''; 
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
             <div>
                <h4 className="font-bold text-lg text-stone-200">Import Blueprint</h4>
                <p className="text-stone-400 text-sm mb-3">Load a Blueprint `.json` file to add new content to your game. You'll be able to preview the contents and resolve any conflicts before anything is added.</p>
            </div>
            <div className="p-8 border-2 border-dashed border-stone-600 rounded-lg text-center">
                <p className="text-stone-400 mb-4">Click the button to select a Blueprint file to import.</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                />
                <Button onClick={handleButtonClick}>
                    Select Blueprint File
                </Button>
            </div>
        </div>
    );
};

export default ImportPanel;
