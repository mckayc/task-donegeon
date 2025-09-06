import React, { useState, useEffect } from 'react';
import { BugReportTemplate } from '../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';

interface EditBugTemplateDialogProps {
  template: Partial<BugReportTemplate> | null;
  onClose: () => void;
  onSave: (template: BugReportTemplate) => void;
}

const EditBugTemplateDialog: React.FC<EditBugTemplateDialogProps> = ({ template, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        text: '',
    });

    useEffect(() => {
        if (template) {
            setFormData({
                title: template.title || '',
                text: template.text || '',
            });
        }
    }, [template]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: template?.id || `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            ...formData,
        });
    };
    
    const dialogTitle = template?.id ? 'Edit Template' : 'Create New Template';

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
                <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
                <form id="bug-template-form" onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Template Title"
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                        required
                    />
                    <Input
                        as="textarea"
                        label="Template Text"
                        value={formData.text}
                        onChange={(e) => setFormData(p => ({ ...p, text: e.target.value }))}
                        rows={8}
                        required
                        placeholder="Enter the template content here..."
                    />
                </form>
                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="bug-template-form">Save Template</Button>
                </div>
            </div>
        </div>
    );
};

export default EditBugTemplateDialog;
