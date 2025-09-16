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
import LabyrinthGame from './LabyrinthGame';
import AlchemistsTrialGame from './AlchemistsTrialGame';
import GoblinAmbushGame from './GoblinAmbushGame';
import RiverCrossingGame from './RiverCrossingGame';
import WizardsVortexGame from './WizardsVortexGame';

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
      case 'minigame-tetris':
        return <TetrisGame onClose={onClose} />;
      case 'minigame-gemstone-mines':
        return <GemstoneMinesGame onClose={onClose} />;
      case 'minigame-labyrinth':
        return <LabyrinthGame onClose={onClose} />;
      case 'minigame-alchemists-trial':
        return <AlchemistsTrialGame onClose={onClose} />;
      case 'minigame-goblin-ambush':
        return <GoblinAmbushGame onClose={onClose} />;
      case 'minigame-river-crossing':
        return <RiverCrossingGame onClose={onClose} />;
      case 'minigame-wizards-vortex':
        return <WizardsVortexGame onClose={onClose} />;
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
        className="fixed inset-0 bg-stone-900 z-[100]"
        data-bug-reporter-ignore
    >
      {renderGame()}
    </motion.div>
  );
};

export default GameOverlay;
