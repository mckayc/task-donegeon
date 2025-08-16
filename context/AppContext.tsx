
import React from 'react';
import { DataState, useData } from './DataProvider';
import { ActionsDispatch, useActionsDispatch } from './ActionsContext';
import { AuthDispatch, AuthState, useAuthDispatch, useAuthState } from './AuthContext';
import { UIDispatch, UIState, useUIDispatch, useUIState } from './UIContext';

// Combine all state interfaces
interface AppState extends DataState, UIState, AuthState {}

// Combine all dispatch interfaces
interface AppDispatch extends UIDispatch, AuthDispatch, ActionsDispatch {}

export const useAppState = (): AppState => {
    const dataState = useData();
    const uiState = useUIState();
    const authState = useAuthState();
    return { ...dataState, ...uiState, ...authState };
};

export const useAppDispatch = (): AppDispatch => {
    const uiDispatch = useUIDispatch();
    const authDispatch = useAuthDispatch();
    const actionsDispatch = useActionsDispatch();
    return { ...uiDispatch, ...authDispatch, ...actionsDispatch };
};
