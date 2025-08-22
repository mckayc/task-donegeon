import { AssetPack, AssetPackAssets, Quest, RewardItem, RewardTypeDefinition, ShareableAssetType, Trophy, Rank, Market, IAppData, ImportResolution, GameAsset, QuestGroup, UserTemplate } from '../../../types';

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
 * Generates an AssetPack JSON file from selected assets and triggers a download.
 */
export const generateAssetPack = (
    name: string,
    description: string,
    author: string,
    selectedAssets: { [key in ShareableAssetType]: string[] },
    allAssets: IAppData
) => {
    const assetPack: AssetPack = {
        manifest: {
            id: `com.taskdonegeon.${name.toLowerCase().replace(/ /g, '-')}.${Date.now()}`,
            name,
            author,
            description,
            version: '1.0.0',
        },
        assets: {
            quests: [],
            questGroups: [],
            rewardTypes: [],
            ranks: [],
            trophies: [],
            markets: [],
            gameAssets: [],
            users: [],
        }
    };

    // Add selected quests, markets, and quest groups, filtering out runtime-specific properties
    assetPack.assets.quests = allAssets.quests
        .filter(q => selectedAssets.quests.includes(q.id))
        .map(({ isRedemptionFor, checkpointCompletions, ...quest }) => quest); // Exclude runtime/user-specific data
        
    assetPack.assets.markets = allAssets.markets.filter(m => selectedAssets.markets.includes(m.id));
    assetPack.assets.questGroups = allAssets.questGroups.filter(qg => selectedAssets.questGroups.includes(qg.id));
    
    // Find all game assets for sale in the selected markets
    const assetsInSelectedMarkets = allAssets.gameAssets.filter(ga => 
      ga.isForSale && ga.marketIds.some(mid => selectedAssets.markets.includes(mid))
    );
    
    // Find all reward types these quests and market items depend on
    const requiredRewardTypeIds = getDependencies([...(assetPack.assets.quests || []), ...assetsInSelectedMarkets]);

    // Add required reward types automatically
    allAssets.rewardTypes.forEach(rt => {
        if (requiredRewardTypeIds.has(rt.id) && !rt.isCore) {
            if (!selectedAssets.rewardTypes.includes(rt.id)) {
                selectedAssets.rewardTypes.push(rt.id);
            }
        }
    });

    // Add all selected assets
    assetPack.assets.rewardTypes = allAssets.rewardTypes.filter(rt => selectedAssets.rewardTypes.includes(rt.id) && !rt.isCore);
    assetPack.assets.ranks = allAssets.ranks.filter(r => selectedAssets.ranks.includes(r.id));
    assetPack.assets.trophies = allAssets.trophies.filter(t => selectedAssets.trophies.includes(t.id));
    
    // Add selected users, filtering out runtime/personal data to create a template
    assetPack.assets.users = allAssets.users
        .filter(u => selectedAssets.users.includes(u.id))
        .map(({ 
            personalPurse, personalExperience, guildBalances, avatar, 
            ownedAssetIds, ownedThemes, hasBeenOnboarded, ...userTemplate 
        }) => userTemplate);

    // Download the file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assetPack, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${name.replace(/ /g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
        packAssets?.forEach(pAsset => {
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