import React from 'react';
import Button from '../user-interface/Button';

// This is a placeholder implementation for a future minigame.
const AlchemistsTrialGame: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white text-center">
            <h2 className="text-4xl font-medieval text-amber-400">Alchemist's Trial</h2>
            <p className="mt-4 text-lg">This game is under construction.</p>
            <Button onClick={onClose} className="mt-8">Back to Arcade</Button>
        </div>
    );
};

export default AlchemistsTrialGame;