import React from 'react';
import SnakeGame from './SnakeGame';
import DragonsDiceGame from './DragonsDiceGame';
import { motion } from 'framer-motion';
import Button from '../user-interface/Button';
import RuneBreakerGame from './RuneBreakerGame';
import DungeonDashGame from './DungeonDashGame';
import { ForgeMasterGame } from './ForgeMasterGame';
import ArchersFollyGame from './ArchersFollyGame';
import TetrisGame from './TetrisGame';
import GemstoneMinesGame from './GemstoneMinesGame';

interface GameOverlayProps {
  gameId: string;
  onClose: () => void;
}

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
      case 'minigame-tetris':
        return <TetrisGame onClose={onClose} />;
      case 'minigame-gemstone-mines':
        return <GemstoneMinesGame onClose={onClose} />;
      default:
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-center">
                <h2 className="text-4xl font-medieval text-amber-400">Error</h2>
                <p className="mt-4 text-lg">Game "{gameId}" not found or is under construction.</p>
                <Button onClick={onClose} className="mt-8">Back to Arcade</Button>
            </div>
        );
    }
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-stone-900 z-[100]"
        data-bug-reporter-ignore
    >
      {renderGame()}
    </motion.div>
  );
};

export default GameOverlay;