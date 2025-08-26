import React, { useMemo } from 'react';
import { AssetPack, GameAsset, Market, Quest, Trophy, Rank, RewardTypeDefinition, QuestGroup, TrophyRequirementType } from '../../types';

interface DependencyGraphProps {
  pack: AssetPack;
}

type Node = {
  id: string;
  name: string;
  type: string;
  icon: string;
  contains: { id: string, name: string, type: string, icon: string }[];
  requires: { id: string, name: string, type: string, icon: string }[];
};

const buildDependencyGraph = (pack: AssetPack): Node[] => {
    const { assets } = pack;
    if (!assets) return [];

    const nodes: Node[] = [];

    const quests = assets.quests || [];
    const gameAssets = assets.gameAssets || [];
    const markets = assets.markets || [];
    const trophies = assets.trophies || [];
    const ranks = assets.ranks || [];
    const rewardTypes = assets.rewardTypes || [];
    const questGroups = assets.questGroups || [];
    
    const findReward = (id: string) => rewardTypes.find(rt => rt.id === id);
    const findQuest = (id: string) => quests.find(q => q.id === id);
    const findRank = (id: string) => ranks.find(r => r.id === id);

    // Process Markets
    markets.forEach(market => {
        nodes.push({
            id: market.id,
            name: market.title,
            type: 'Market',
            icon: market.icon,
            contains: gameAssets
                .filter(ga => ga.marketIds && ga.marketIds.includes(market.id))
                .map(ga => ({ id: ga.id, name: ga.name, type: 'Item', icon: ga.icon || '📦' })),
            requires: [],
        });
    });

    // Process GameAssets
    gameAssets.forEach(ga => {
        const requiredRewards = new Set<string>();
        if (ga.costGroups) {
          ga.costGroups.forEach(group => group.forEach(cost => requiredRewards.add(cost.rewardTypeId)));
        }
        
        nodes.push({
            id: ga.id,
            name: ga.name,
            type: 'Item',
            icon: ga.icon || '📦',
            contains: [],
            requires: Array.from(requiredRewards)
                .map(id => findReward(id))
                .filter((rt): rt is RewardTypeDefinition => !!rt)
                .map(rt => ({ id: rt.id, name: rt.name, type: 'Reward', icon: rt.icon })),
        });
    });

    // Process Quests
    quests.forEach(quest => {
        const requiredRewards = new Set<string>();
        if (quest.rewards) quest.rewards.forEach(r => requiredRewards.add(r.rewardTypeId));
        if (quest.lateSetbacks) quest.lateSetbacks.forEach(s => requiredRewards.add(s.rewardTypeId));
        if (quest.incompleteSetbacks) quest.incompleteSetbacks.forEach(s => requiredRewards.add(s.rewardTypeId));
        
        nodes.push({
            id: quest.id,
            name: quest.title,
            type: 'Quest',
            icon: quest.icon,
            contains: [],
             requires: Array.from(requiredRewards)
                .map(id => findReward(id))
                .filter((rt): rt is RewardTypeDefinition => !!rt)
                .map(rt => ({ id: rt.id, name: rt.name, type: 'Reward', icon: rt.icon })),
        });
    });
    
     // Process Trophies
    trophies.forEach(trophy => {
        const requirements = new Set<{id: string, name: string, type: string, icon: string}>();
        if (trophy.requirements) {
            trophy.requirements.forEach(req => {
                if (req.type === TrophyRequirementType.AchieveRank) {
                    const rank = findRank(req.value);
                    if (rank) requirements.add({ id: rank.id, name: rank.name, type: 'Rank', icon: rank.icon });
                }
                if (req.type === TrophyRequirementType.QuestCompleted) {
                    const quest = findQuest(req.value);
                    if(quest) requirements.add({ id: quest.id, name: quest.title, type: 'Quest', icon: quest.icon });
                }
            });
        }

        nodes.push({
            id: trophy.id,
            name: trophy.name,
            type: 'Trophy',
            icon: trophy.icon,
            contains: [],
            requires: Array.from(requirements),
        });
    });
    
    // Process Quest Groups
    questGroups.forEach(qg => {
        nodes.push({
            id: qg.id,
            name: qg.name,
            type: 'Quest Group',
            icon: qg.icon,
            contains: quests
                .filter(q => q.groupId === qg.id)
                .map(q => ({ id: q.id, name: q.title, type: 'Quest', icon: q.icon })),
            requires: [],
        });
    });

    // Add nodes for items that might be dependencies but not parents (Ranks, RewardTypes)
    ranks.forEach(rank => {
        if (!nodes.some(n => n.id === rank.id)) {
            nodes.push({ id: rank.id, name: rank.name, type: 'Rank', icon: rank.icon, contains: [], requires: [] });
        }
    });

    rewardTypes.forEach(rt => {
        if (!nodes.some(n => n.id === rt.id)) {
            nodes.push({ id: rt.id, name: rt.name, type: 'Reward', icon: rt.icon, contains: [], requires: [] });
        }
    });

    return nodes.filter(n => n.contains.length > 0 || n.requires.length > 0);
};

const DependencyGraph: React.FC<DependencyGraphProps> = ({ pack }) => {
    const graph = useMemo(() => buildDependencyGraph(pack), [pack]);

    if (graph.length === 0) {
        return <p className="text-sm text-stone-400">This pack contains no assets with dependencies.</p>;
    }

    return (
        <div className="space-y-4">
            {graph.map(node => (
                <div key={node.id} className="p-3 bg-stone-900/50 rounded-lg">
                    <p className="font-bold text-stone-200">{node.icon} {node.name} <span className="text-xs text-stone-500 font-normal">({node.type})</span></p>
                    {node.contains.length > 0 && (
                        <div className="pl-6 mt-1">
                            <p className="text-xs font-semibold text-sky-400">Contains:</p>
                            <ul className="list-disc list-inside text-sm text-stone-300">
                                {node.contains.map(dep => <li key={dep.id}>{dep.icon} {dep.name} <span className="text-xs text-stone-500">({dep.type})</span></li>)}
                            </ul>
                        </div>
                    )}
                    {node.requires.length > 0 && (
                         <div className="pl-6 mt-1">
                            <p className="text-xs font-semibold text-amber-400">Requires:</p>
                            <ul className="list-disc list-inside text-sm text-stone-300">
                                {node.requires.map(dep => <li key={dep.id}>{dep.icon} {dep.name} <span className="text-xs text-stone-500">({dep.type})</span></li>)}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DependencyGraph;