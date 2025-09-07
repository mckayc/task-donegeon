import React from 'react';
import SnakeGame from './SnakeGame';
import DragonsDiceGame from './DragonsDiceGame';
import { motion } from 'framer-motion';
import Button from '../user-interface/Button';
import RuneBreakerGame from './RuneBreakerGame';
import DungeonDashGame from './DungeonDashGame';
import { ForgeMasterGame } from './ForgeMasterGame';
import ArchersFollyGame from './ArchersFollyGame';

interface GameOverlayProps {
  gameId: string;
  onClose: () => void;
}

const PlaceholderGame: React.FC<{ gameName: string; onClose: () => void; }> = ({ gameName, onClose }) => (
    <div className="text-white text-center">
        <h2 className="text-4xl font-medieval text-amber-400">{gameName}</h2>
        <p className="mt-4 text-lg">Coming Soon!</p>
        <Button onClick={onClose} className="mt-8">Back to Arcade</Button>
    </div>
);


const GameOverlay: React.FC<GameOverlayProps> = ({ gameId, onClose }) => {
  const renderGame = () => {
    switch (gameId) {
      case 'minigame-snake':
        return <SnakeGame onClose={onClose} />;
      case 'minigame-dragons-dice':
        return <DragonsDiceGame onClose={onClose} />;
      case 'minigame-rune-breaker':
        return <RuneBreakerGame onClose={onClose} />;
      case 'minigame-dungeon-dash':
        return <DungeonDashGame onClose={onClose} />;
      case 'minigame-forge-master':
        return <ForgeMasterGame onClose={onClose} />;
      case 'minigame-archers-folly':
        return <ArchersFollyGame onClose={onClose} />;
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
    // FIX: The `initial` and `exit` props were causing type errors. Removed them to fix the compilation issue.
    <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-stone-900 z-[100]"
        data-bug-reporter-ignore
    >
      {renderGame()}
    </motion.div>
  );
};

export default GameOverlay;
