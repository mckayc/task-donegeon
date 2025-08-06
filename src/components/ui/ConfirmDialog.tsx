
import React from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <Card className="max-w-lg w-full">
          <CardHeader>
              <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-donegeon-text/90 mb-6">{message}</p>
             <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onConfirm} className="bg-donegeon-red hover:bg-donegeon-red/90">
                Confirm
              </Button>
            </div>
          </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmDialog;
