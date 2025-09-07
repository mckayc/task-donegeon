import React from 'react';
import Button from '../user-interface/Button';

interface AlchemistsTrialGameProps {
  onClose: () => void;
}

const AlchemistsTrialGame: React.FC<AlchemistsTrialGameProps> = ({ onClose }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="text-white text-center">
                <h2 className="text-4xl font-medieval text-amber-400">Alchemist's Trial</h2>
                <p className="mt-4 text-lg">Coming Soon!</p>
                <Button onClick={onClose} className="mt-8">Back to Arcade</Button>
            </div>
        </div>
    );
};

export default AlchemistsTrialGame;
