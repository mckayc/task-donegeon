import React, { useMemo } from 'react';
import { useQuestsState } from '../../../context/QuestsContext';
import { useEconomyState } from '../../../context/EconomyContext';
import Card from '../../user-interface/Card';
import { Quest } from '../../../types';
import DynamicIcon from '../../user-interface/DynamicIcon';

const StatsPage: React.FC = () => {
    const { quests, questCompletions } = useQuestsState();
    const { gameAssets } = useEconomyState();

    const topQuests = useMemo(() => {
        const questCounts = new Map<string, number>();
        questCompletions.forEach(c => {
            questCounts.set(c.questId, (questCounts.get(c.questId) || 0) + 1);
        });

        return Array.from(questCounts.entries())
            .map(([questId, count]) => ({
                quest: quests.find(q => q.id === questId),
                count,
            }))
            .filter((item): item is { quest: Quest, count: number } => !!item.quest)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [questCompletions, quests]);

    const topItems = useMemo(() => {
        return [...gameAssets]
            .filter(asset => (asset.purchaseCount || 0) > 0)
            .sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0))
            .slice(0, 10);
    }, [gameAssets]);

    return (
        <div className="space-y-6">
             <h1 className="text-4xl font-medieval text-stone-100">Statistics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Most Completed Quests">
                    {topQuests.length > 0 ? (
                        <ol className="space-y-3">
                            {topQuests.map((item, index) => (
                                <li key={item.quest.id} className="flex items-center gap-4 p-2 bg-stone-900/40 rounded-md">
                                    <span className="font-bold text-lg text-amber-300 w-6 text-center">{index + 1}.</span>
                                    <span className="text-2xl">{item.quest.icon}</span>
                                    <span className="font-semibold text-stone-200 flex-grow truncate" title={item.quest.title}>{item.quest.title}</span>
                                    <span className="font-bold text-emerald-400">{item.count}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-stone-400 text-center">No quests have been completed yet.</p>
                    )}
                </Card>
                <Card title="Most Purchased Items">
                    {topItems.length > 0 ? (
                        <ol className="space-y-3">
                             {topItems.map((item, index) => (
                                <li key={item.id} className="flex items-center gap-4 p-2 bg-stone-900/40 rounded-md">
                                    <span className="font-bold text-lg text-amber-300 w-6 text-center">{index + 1}.</span>
                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                                         <DynamicIcon iconType={item.iconType} icon={item.icon} imageUrl={item.imageUrl} className={item.iconType === 'image' ? 'w-full h-full object-contain' : 'text-2xl'} />
                                    </div>
                                    <span className="font-semibold text-stone-200 flex-grow truncate" title={item.name}>{item.name}</span>
                                    <span className="font-bold text-emerald-400">{item.purchaseCount}</span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-stone-400 text-center">No items have been purchased yet.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default StatsPage;
