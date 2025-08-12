import React, { createContext, useState, useContext, ReactNode } from 'react';

interface LoadingState {
  isDataLoaded: boolean;
}

interface LoadingDispatch {
  setDataLoaded: (isLoaded: boolean) => void;
}

const LoadingStateContext = createContext<LoadingState | undefined>(undefined);
const LoadingDispatchContext = createContext<LoadingDispatch | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataLoaded, setDataLoaded] = useState(false);

  const stateValue: LoadingState = { isDataLoaded };
  const dispatchValue: LoadingDispatch = { setDataLoaded };

  return (
    <LoadingStateContext.Provider value={stateValue}>
      <LoadingDispatchContext.Provider value={dispatchValue}>
        {children}
      </LoadingDispatchContext.Provider>
    </LoadingStateContext.Provider>
  );
};

export const useLoadingState = (): LoadingState => {
  const context = useContext(LoadingStateContext);
  if (context === undefined) throw new Error('useLoadingState must be used within a LoadingProvider');
  return context;
};

export const useLoadingDispatch = (): LoadingDispatch => {
  const context = useContext(LoadingDispatchContext);
  if (context === undefined) throw new Error('useLoadingDispatch must be used within a LoadingProvider');
  return context;
};