
import React, { useState } from 'react';
import { Minigame } from '../../../types';
import Button from '../user-interface/Button';
import { useSystemDispatch } from '../../context/SystemContext';
import { useUIDispatch } from '../../context/UIContext';
import { useNotificationsDispatch } from '../../context/NotificationsContext';

interface ConfirmPlayDialogProps {
  game: Minigame;
  onClose: () => void;
}

const ConfirmPlayDialog: React.FC<ConfirmPlayDialogProps> = ({ game, onClose }) => {
    const { playMinigame } = useSystemDispatch();
    const { setActiveGame } = useUIDispatch();
    const { addNotification } = useNotificationsDispatch();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        const success = await playMinigame(game.id);
        if (success) {
            setActiveGame(game.id);
            onClose();
        } else {
            addNotification({ type: 'error', message: "You don't have enough Game Tokens to play." });
        }
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-medieval text-emerald-400 mb-2">Play Game</h2>
                <p className="text-lg text-stone-200 mb-6">"{game.name}"</p>
                <div className="space-y-4">
                    <p className="text-stone-300">
                        This will cost <span className="font-bold text-amber-300">1 Game Token 🪙</span>. Are you ready to play?
                    </p>
                </div>
                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-stone-700/60">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Play Now'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPlayDialog;