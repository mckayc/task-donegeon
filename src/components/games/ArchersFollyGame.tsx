
import React from 'react';
import Button from '../user-interface/Button';

interface ArchersFollyGameProps {
  onClose: () => void;
}

const ArchersFollyGame: React.FC<ArchersFollyGameProps> = ({ onClose }) => {
  return (
    <div className="text-white text-center">
        <h2 className="text-4xl font-medieval text-amber-400">Archer's Folly</h2>
        <p className="mt-4 text-lg">Coming Soon!</p>
        <Button onClick={onClose} className="mt-8">Back to Arcade</Button>
    </div>
  );
};

export default ArchersFollyGame;
