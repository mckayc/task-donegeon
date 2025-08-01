import React, { useState } from 'react';
import { useAppDispatch } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImagePackImporterDialog from '@/components/admin/ImagePackImporterDialog';

const AssetLibraryPage: React.FC = () => {
    const [isImporterOpen, setIsImporterOpen] = useState(false);
    const { addNotification } = useAppDispatch();

    const handleImportSuccess = () => {
        // The dialog itself will call an API to import, which should trigger a data refresh via websocket.
        // We just show a success message here.
        addNotification({ type: 'success', message: 'Image pack import complete! Your gallery has been updated.' });
        // The gallery on the Asset Manager page will be stale until the next data sync. This is an acceptable UX for now.
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-stone-100">Content Library</h2>
                    <p className="text-stone-400 mt-2 max-w-xl mx-auto">
                        Jumpstart your game by installing pre-made content packs. This library currently focuses on image packs for items and avatars.
                    </p>
                    <div className="mt-6">
                        <Button onClick={() => setIsImporterOpen(true)}>
                            Open Image Pack Library
                        </Button>
                    </div>
                </div>
            </Card>
            {isImporterOpen && (
                <ImagePackImporterDialog
                    onClose={() => setIsImporterOpen(false)}
                    onImportSuccess={handleImportSuccess}
                />
            )}
        </div>
    );
};

export default AssetLibraryPage;