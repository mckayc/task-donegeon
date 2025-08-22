import React, { useEffect } from 'react';
import Button from './Button';
import { bugLogger } from '../../utils/bugLogger';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    if (isOpen && bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Opened confirmation dialog: "${title}".` });
    }
  }, [isOpen, title]);

  const handleConfirm = () => {
    if (bugLogger.isRecording()) {
        bugLogger.add({ type: 'ACTION', message: `Confirmed dialog: "${title}".` });
    }
    onConfirm();
  };

  const handleClose = () => {
      if (bugLogger.isRecording()) {
          bugLogger.add({ type: 'ACTION', message: `Cancelled dialog: "${title}".` });
      }
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog" onClick={handleClose}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-medieval text-amber-400 mb-4">{title}</h2>
        <p className="text-stone-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="!bg-red-600 hover:!bg-red-500">
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;