import React, { useState } from 'react';
import { Button, Input } from '../ui';

interface UploadWithCategoryDialogProps {
    file: File;
    onClose: () => void;
    onUpload: (file: File, category: string) => Promise<void>;
    existingCategories: string[];
}

const UploadWithCategoryDialog: React.FC<UploadWithCategoryDialogProps> = ({ file, onClose, onUpload, existingCategories }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const filePreviewUrl = URL.createObjectURL(file);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        const finalCategory = selectedCategory === 'Other' ? customCategory.trim() : selectedCategory;
        await onUpload(file, finalCategory || 'Miscellaneous');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-medieval text-accent mb-4">Upload New Image</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <img src={filePreviewUrl} alt="File preview" className="w-24 h-24 object-contain rounded-md bg-stone-700 flex-shrink-0" />
                        <div className="flex-grow space-y-2 overflow-hidden">
                             <p className="text-sm text-stone-300 truncate" title={file.name}>{file.name}</p>
                             <Input
                                as="select"
                                label="Category"
                                value={selectedCategory}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                                disabled={isUploading}
                                autoFocus
                            >
                                <option value="" disabled>Select a category...</option>
                                {existingCategories.sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="Other">Other (Create New)...</option>
                            </Input>
                            {selectedCategory === 'Other' && (
                                <Input
                                    label="New Category Name"
                                    placeholder="e.g., Pets, Weapons"
                                    value={customCategory}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCategory(e.target.value)}
                                    disabled={isUploading}
                                    required
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
                        <Button type="submit" disabled={isUploading || (selectedCategory === 'Other' && !customCategory.trim())}>
                            {isUploading ? 'Uploading...' : 'Upload & Categorize'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadWithCategoryDialog;
