

import { Blueprint, BlueprintAssets, Quest, RewardItem, RewardTypeDefinition, ShareableAssetType, Trophy, Rank, Market, IAppData, ImportResolution, GameAsset } from '../types';

/**
 * Finds all unique dependency IDs (e.g., rewardType IDs) from a collection of assets.
 */
const getDependencies = (assets: (Quest | GameAsset)[]): Set<string> => {
    const dependencyIds = new Set<string>();

    const extractFromRewardItems = (items: RewardItem[]) => {
        items.forEach(item => dependencyIds.add(item.rewardTypeId));
    };

    assets.forEach(asset => {
        if ('rewards' in asset) { // It's a Quest
            extractFromRewardItems(asset.rewards);
            extractFromRewardItems(asset.lateSetbacks);
            extractFromRewardItems(asset.incompleteSetbacks);
        } else if ('cost' in asset) { // It's a GameAsset
             extractFromRewardItems(asset.cost);
        }
    });

    return dependencyIds;
};


/**
 * Generates a Blueprint JSON file from selected assets and triggers a download.
 */
export const generateBlueprint = (
    name: string,
    description: string,
    author: string,
    selectedAssets: { [key in ShareableAssetType]: string[] },
    allAssets: IAppData
) => {
    const blueprint: Blueprint = {
        name,
        author,
        description,
        version: 1,
        exportedAt: new Date().toISOString(),
        assets: {
            quests: [],
            rewardTypes: [],
            ranks: [],
            trophies: [],
            markets: [],
        }
    };

    // Add selected quests and markets
    blueprint.assets.quests = allAssets.quests.filter(q => selectedAssets.quests.includes(q.id));
    blueprint.assets.markets = allAssets.markets.filter(m => selectedAssets.markets.includes(m.id));

    // Find all game assets for sale in the selected markets
    const assetsInSelectedMarkets = allAssets.gameAssets.filter(ga => 
      ga.isForSale && ga.marketIds.some(mid => selectedAssets.markets.includes(mid))
    );
    
    // Find all reward types these quests and market items depend on
    const requiredRewardTypeIds = getDependencies([...blueprint.assets.quests, ...assetsInSelectedMarkets]);

    // Add required reward types automatically
    allAssets.rewardTypes.forEach(rt => {
        if (requiredRewardTypeIds.has(rt.id) && !rt.isCore) {
            if (!selectedAssets.rewardTypes.includes(rt.id)) {
                selectedAssets.rewardTypes.push(rt.id);
            }
        }
    });

    // Add all selected assets
    blueprint.assets.rewardTypes = allAssets.rewardTypes.filter(rt => selectedAssets.rewardTypes.includes(rt.id) && !rt.isCore);
    blueprint.assets.ranks = allAssets.ranks.filter(r => selectedAssets.ranks.includes(r.id));
    blueprint.assets.trophies = allAssets.trophies.filter(t => selectedAssets.trophies.includes(t.id));
    
    // Download the file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blueprint, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${name.replace(/ /g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};


/**
 * Analyzes an imported Blueprint for conflicts against the current game state.
 */
export const analyzeBlueprintForConflicts = (
  blueprint: Blueprint,
  currentData: IAppData
): ImportResolution[] => {
    const resolutions: ImportResolution[] = [];
    if (!blueprint || !blueprint.assets) return [];

    const checkConflicts = (
        assetType: ShareableAssetType,
        blueprintAssets: (Quest | RewardTypeDefinition | Rank | Trophy | Market)[],
        currentAssets: (Quest | RewardTypeDefinition | Rank | Trophy | Market)[]
    ) => {
        blueprintAssets?.forEach(bAsset => {
            const assetName = 'title' in bAsset ? bAsset.title : bAsset.name;
            const conflict = currentAssets.find(cAsset => ('title' in cAsset ? cAsset.title : cAsset.name).toLowerCase() === assetName.toLowerCase());
            resolutions.push({
                type: assetType,
                id: bAsset.id,
                name: assetName,
                status: conflict ? 'conflict' : 'new',
                resolution: conflict ? 'skip' : 'keep',
            });
        });
    };

    checkConflicts('quests', blueprint.assets.quests, currentData.quests);
    checkConflicts('rewardTypes', blueprint.assets.rewardTypes, currentData.rewardTypes);
    checkConflicts('ranks', blueprint.assets.ranks, currentData.ranks);
    checkConflicts('trophies', blueprint.assets.trophies, currentData.trophies);
    checkConflicts('markets', blueprint.assets.markets, currentData.markets);

    return resolutions;
};
