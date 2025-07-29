import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { QuestCompletionStatus, QuestType, ChronicleEvent } from '../../frontendTypes';
import { toYMD } from '../../utils/quests';
import Card from '../ui/Card';

interface ChroniclesDayViewProps {
    currentDate: Date;
}

const ChronicleItem: React.FC<{ event: ChronicleEvent }> = ({ event }) => (
    <div className={`p-3 rounded-md border-l-4`} style={{borderColor: event.color}}>
        <div className="flex items-start gap-3">
            <span className="text-2xl mt-1">{event.icon}</span>
            <div>
                <p className="font-semibold text-stone-200">{event.title}</p>
                <p className="text-xs text-stone-400">{event.status}</p>
                {event.note && <p className="text-sm text-stone-400 italic mt-1">"{event.note}"</p>}
            </div>
        </div>
    </div>
);

const ChroniclesDayView: React.FC<ChroniclesDayViewProps> = ({ currentDate }) => {
    const { questCompletions, quests, currentUser, appMode, purchaseRequests, userTrophies, trophies, adminAdjustments, users, rewardTypes, settings } = useAppState();

    const dailyChronicles = useMemo((): ChronicleEvent[] => {
        if (!currentUser) return [];

        const dateKey = toYMD(currentDate);
        const currentGuildId = appMode.mode === 'guild' ? appMode.guildId : undefined;
        
        const completionsToday = questCompletions.filter(c =>
            c.userId === currentUser.id &&
            c.guildId === currentGuildId &&
            toYMD(new Date(c.completedAt)) === dateKey
        );

        const questEvents: ChronicleEvent[] = completionsToday.map(c => {
            const quest = quests.find(q => q.id === c.questId);
            return {
                id: c.id,
                date: c.completedAt,
                type: 'Quest',
                title: quest?.title || 'Unknown Quest',
                note: c.note,
                status: c.status,
                icon: quest?.icon || '📜',
                color: c.status === QuestCompletionStatus.Approved ? '#22c55e' : c.status === QuestCompletionStatus.Pending ? '#eab308' : '#ef4444',
                userId: c.userId,
                questType: quest?.type,
            };
        });

        // Add other chronicle types for the user on this day
        // This can be expanded with Trophies, Purchases, etc.

        return questEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [currentDate, currentUser, appMode, questCompletions, quests]);

    const dutyChronicles = dailyChronicles.filter(c => c.questType === QuestType.Duty);
    const ventureChronicles = dailyChronicles.filter(c => c.questType === QuestType.Venture);

    return (
        <div className="p-4 h-[70vh] grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2">
                <h3 className="text-xl font-bold text-stone-300 mb-2">Completed {settings.terminology.recurringTasks}</h3>
                {dutyChronicles.length > 0 ? (
                    <div className="space-y-3">
                        {dutyChronicles.map(event => <ChronicleItem key={event.id} event={event} />)}
                    </div>
                ) : (
                    <p className="text-sm text-stone-500">No {settings.terminology.recurringTasks.toLowerCase()} completed on this day.</p>
                )}
            </div>
             <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide pr-2">
                <h3 className="text-xl font-bold text-stone-300 mb-2">Completed {settings.terminology.singleTasks}</h3>
                {ventureChronicles.length > 0 ? (
                    <div className="space-y-3">
                        {ventureChronicles.map(event => <ChronicleItem key={event.id} event={event} />)}
                    </div>
                ) : (
                    <p className="text-sm text-stone-500">No {settings.terminology.singleTasks.toLowerCase()} completed on this day.</p>
                )}
            </div>
        </div>
    );
};

export default ChroniclesDayView;