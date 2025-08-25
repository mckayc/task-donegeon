import { AssetPack, ImportResolution, IAppData, Quest, GameAsset, RewardItem, ShareableAssetType, RewardTypeDefinition, Rank, Trophy, Market, QuestGroup, UserTemplate } from '../../../types';

/**
 * Finds all unique dependency IDs (e.g., rewardType IDs) from a collection of assets.
 */
const getDependencies = (assets: (Quest | GameAsset)[]): Set<string> => {
    const dependencyIds = new Set<string>();

    const extractFromRewardItems = (items: RewardItem[]) => {
        items?.forEach(item => dependencyIds.add(item.rewardTypeId));
    };

    assets.forEach(asset => {
        if ('rewards' in asset) { // It's a Quest
            extractFromRewardItems(asset.rewards);
            extractFromRewardItems(asset.lateSetbacks);
            extractFromRewardItems(asset.incompleteSetbacks);
            asset.checkpoints?.forEach(cp => extractFromRewardItems(cp.rewards));
        } else if ('costGroups' in asset) { // It's a GameAsset
             asset.costGroups.forEach(group => extractFromRewardItems(group));
        }
    });

    return dependencyIds;
};

/**
 * Analyzes an imported AssetPack for conflicts against the current game state.
 */
export const analyzeAssetPackForConflicts = (
  assetPack: AssetPack,
  currentData: IAppData
): ImportResolution[] => {
    const resolutions: ImportResolution[] = [];
    if (!assetPack || !assetPack.assets) return [];

    const checkConflicts = (
        assetType: ShareableAssetType,
        packAssets: (Quest | RewardTypeDefinition | Rank | Trophy | Market | QuestGroup | GameAsset)[],
        currentAssets: (Quest | RewardTypeDefinition | Rank | Trophy | Market | QuestGroup | GameAsset)[]
    ) => {
        if (!packAssets) return;
        packAssets.forEach(pAsset => {
            const assetName = 'title' in pAsset ? pAsset.title : pAsset.name;
            const conflict = currentAssets.find(cAsset => ('title' in cAsset ? cAsset.title : cAsset.name).toLowerCase() === assetName.toLowerCase());
            resolutions.push({
                type: assetType,
                id: pAsset.id,
                name: assetName,
                status: conflict ? 'conflict' : 'new',
                resolution: conflict ? 'skip' : 'keep',
                selected: !conflict,
            });
        });
    };

    checkConflicts('quests', assetPack.assets.quests || [], currentData.quests);
    checkConflicts('questGroups', assetPack.assets.questGroups || [], currentData.questGroups);
    checkConflicts('rewardTypes', assetPack.assets.rewardTypes || [], currentData.rewardTypes);
    checkConflicts('ranks', assetPack.assets.ranks || [], currentData.ranks);
    checkConflicts('trophies', assetPack.assets.trophies || [], currentData.trophies);
    checkConflicts('markets', assetPack.assets.markets || [], currentData.markets);
    checkConflicts('gameAssets', assetPack.assets.gameAssets || [], currentData.gameAssets);

    // Special handling for users
    if (assetPack.assets.users) {
        assetPack.assets.users.forEach(pAsset => {
            const conflict = currentData.users.find(cAsset => 
                cAsset.username.toLowerCase() === pAsset.username.toLowerCase() ||
                cAsset.email.toLowerCase() === pAsset.email.toLowerCase()
            );
            resolutions.push({
                type: 'users',
                id: pAsset.username, // Using username as a temporary ID for resolution tracking
                name: pAsset.gameName,
                status: conflict ? 'conflict' : 'new',
                resolution: conflict ? 'skip' : 'keep',
                selected: !conflict,
            });
        });
    }

    return resolutions;
};