import React from 'react';
import DungeonIcon from '../icons/DungeonIcon';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-brand-brown-300">
      <DungeonIcon className="h-16 w-16 animate-pulse" />
      <p className="font-cinzel text-xl tracking-widest animate-pulse">Loading Donegeon...</p>
    </div>
  );
};

export default FullScreenLoader;
