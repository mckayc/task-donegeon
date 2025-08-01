// This file is now obsolete as all context logic has been consolidated into AppContext.tsx.
// The custom hooks have been removed as they are no longer necessary with the unified context.
import React from 'react';

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
