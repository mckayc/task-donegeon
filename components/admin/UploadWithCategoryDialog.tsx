import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
         <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload New Image</DialogTitle>
                </DialogHeader>
                <form id="upload-category-form" onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="flex gap-4 items-center">
                        <img src={filePreviewUrl} alt="File preview" className="w-24 h-24 object-contain rounded-md bg-background flex-shrink-0" />
                        <div className="flex-grow space-y-2 overflow-hidden">
                             <p className="text-sm text-foreground truncate" title={file.name}>{file.name}</p>
                             <div className="space-y-2">
                                <Label htmlFor="upload-category">Category</Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isUploading}>
                                    <SelectTrigger id="upload-category">
                                        <SelectValue placeholder="Select a category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {existingCategories.sort().map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        <SelectItem value="Other">Other (Create New)...</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedCategory === 'Other' && (
                                <div className="space-y-2">
                                    <Label htmlFor="new-category-name">New Category Name</Label>
                                    <Input
                                        id="new-category-name"
                                        placeholder="e.g., Pets, Weapons"
                                        value={customCategory}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCategory(e.target.value)}
                                        disabled={isUploading}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>Cancel</Button>
                    <Button type="submit" form="upload-category-form" disabled={isUploading || !selectedCategory || (selectedCategory === 'Other' && !customCategory.trim())}>
                        {isUploading ? 'Uploading...' : 'Upload & Categorize'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UploadWithCategoryDialog;