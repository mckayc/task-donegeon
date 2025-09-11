
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AssetPack, ImportResolution, ShareableAssetType, Quest, RewardItem, GameAsset, User, UserTemplate } from '../../types';
import { Terminology } from '../../types/app';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import DependencyGraph from './DependencyGraph';
import { bugLogger } from '../../utils/bugLogger';
import { useAuthState } from '../../context/AuthContext';
import UserMultiSelect from '../user-interface/UserMultiSelect';
import { useEconomyState } from '../../context/EconomyContext';

interface AssetPackInstallDialogProps {
  assetPack: AssetPack;
  initialResolutions: ImportResolution[];
  onClose: () => void;
  onConfirm: (assetPack: AssetPack, resolutions: ImportResolution[], userIdsToAssign?: string[]) => void;
  allowUserAssignment: boolean;
}

const terminologyMap: { [key in ShareableAssetType]: keyof Terminology } = {
    quests: 'tasks',
    questGroups: 'link_manage_quest_groups',
    rewardTypes: 'points',
    ranks: 'levels',
    trophies: 'awards',
    markets: 'stores',
    gameAssets: 'link_manage_items',
    users: 'link_manage_users',
    rotations: 'link_manage_rotations',
    modifierDefinitions: 'link_triumphs_trials',
    chronicles: 'link_chronicles',
};

const AssetCard: React.FC<{
    item: any;
    type: ShareableAssetType;
    isSelected: boolean;
    isDisabled: boolean;
    onToggle: () => void;
    terminology: Terminology;
}> = ({ item, type, isSelected, isDisabled, onToggle, terminology }) => {
    const { rewardTypes } = useEconomyState();
    const getRewardInfo = (id: string) => rewardTypes.find(rt => rt.id === id) || { name: '?', icon: '?' };
    
    const title = item.title || item.name || item.gameName;
    const description = item.description || item.purpose || `A new ${terminology[terminologyMap[type]] || type}`;
    
    return (
        <div className={`p-3 rounded-lg border-2 flex flex-col h-full transition-colors ${isSelected ? 'bg-emerald-900/40 border-emerald-600' : 'bg-stone-800/50 border-transparent'}`}>
            <div className="flex items-start gap-3 mb-2">
                <input
                    type="checkbox