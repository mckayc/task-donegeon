
import React from 'react';
import SnakeGame from './SnakeGame';
import { motion } from 'framer-motion';

interface GameOverlayProps {
  gameId: string;
  onClose: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ gameId, onClose }) => {
  const renderGame = () => {
    switch (gameId) {
      case 'minigame-snake':
        return <SnakeGame onClose={onClose} />;
      default:
        return (
            <div className="text-white">
                <p>Error: Game "{gameId}" not found.</p>
                <button onClick={onClose} className="mt-4 p-2 bg-red-500 rounded">Close</button>
            </div>
        );
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100]"
        data-bug-reporter-ignore
    >
      {renderGame()}
    </motion.div>
  );
};

export default GameOverlay;
