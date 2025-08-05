import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface UploadWithCategoryDialogProps {
    file: File;
    onClose: () => void;
    onUpload: (file: File, category: string) => Promise<void>;
}

const UploadWithCategoryDialog: React.FC<UploadWithCategoryDialogProps> = ({ file, onClose, onUpload }) => {
    const [category, setCategory] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const filePreviewUrl = URL.createObjectURL(file);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        await onUpload(file, category || 'Miscellaneous');
        // No need to set isUploading(false) or onClose() here, as the parent component will do it.
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-medieval text-accent mb-4">Upload New Image</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <img src={filePreviewUrl} alt="File preview" className="w-24 h-24 object-contain rounded-md bg-stone-700" />
                        <div className="flex-grow space-y-2">
                             <p className="text-sm text-stone-300 truncate" title={file.name}>{file.name}</p>
                             <Input 
                                label="Category"
                                placeholder="e.g., Avatar, Pet (defaults to Miscellaneous)"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                disabled={isUploading}
                                autoFocus
                             />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
                        <Button type="submit" disabled={isUploading}>
                            {isUploading ? 'Uploading...' : 'Upload & Categorize'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadWithCategoryDialog;
