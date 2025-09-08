
import React, { useMemo } from 'react';
import { Rotation, User, Quest } from '../../types';
import { useQuestsState } from '../../context/QuestsContext';
import { useAuthState } from '../../context/AuthContext';
import Button from '../user-interface/Button';

interface RotationForecastDialogProps {
    rotation: Omit<Rotation, 'id' | 'createdAt' | 'updatedAt'>;
    onClose: () => void;
}

const RotationForecastDialog: React.FC<RotationForecastDialogProps> = ({ rotation, onClose }) => {
    const { quests: allQuests } = useQuestsState();
    const { users: allUsers } = useAuthState();

    const forecast = useMemo(() => {
        const { questIds, userIds, questsPerUser, activeDays } = rotation;

        const selectedQuests = allQuests.filter(q => questIds.includes(q.id)).sort((a, b) => a.title.localeCompare(b.title));
        const selectedUsers = allUsers.filter(u => userIds.includes(u.id)).sort((a, b) => a.gameName.localeCompare(b.gameName));
        
        if (selectedQuests.length === 0 || selectedUsers.length === 0) {
            return [];
        }

        let simLastUserIndex = rotation.lastUserIndex;
        let simLastQuestStartIndex = rotation.lastQuestStartIndex;
        
        const forecastDays = [];
        let currentDate = new Date();
        
        while (forecastDays.length < 7) {
            if (activeDays.includes(currentDate.getDay())) {
                const dayAssignments = [];
                const numUsers = selectedUsers.length;
                const numQuests = selectedQuests.length;

                let nextUserIdx = (simLastUserIndex + 1);
                let nextQuestIdx = (simLastQuestStartIndex + 1);

                const assignmentsThisRun = [];

                for (let i = 0; i < numUsers; i++) {
                    if (assignmentsThisRun.length >= numQuests) break;

                    const currentUserIndex = nextUserIdx % numUsers;
                    const userToAssign = selectedUsers[currentUserIndex];

                    for (let j = 0; j < questsPerUser; j++) {
                        if (assignmentsThisRun.length >= numQuests) break;
                        
                        const currentQuestIndex = nextQuestIdx % numQuests;
                        const questToAssign = selectedQuests[currentQuestIndex];
                        
                        dayAssignments.push({
                            userName: userToAssign.gameName,
                            questTitle: questToAssign.title,
                            questIcon: questToAssign.icon,
                        });
                        
                        assignmentsThisRun.push({ user: userToAssign, quest: questToAssign });
                        nextQuestIdx++;
                    }
                    nextUserIdx++;
                }
                
                if (assignmentsThisRun.length > 0) {
                    const lastAssignment = assignmentsThisRun[assignmentsThisRun.length - 1];
                    simLastUserIndex = selectedUsers.findIndex(u => u.id === lastAssignment.user.id);
                    simLastQuestStartIndex = selectedQuests.findIndex(q => q.id === lastAssignment.quest.id);
                }

                forecastDays.push({
                    date: new Date(currentDate),
                    assignments: dayAssignments,
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return forecastDays;
    }, [rotation, allQuests, allUsers]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-medieval text-emerald-400 mb-4">7-Day Forecast for "{rotation.name}"</h2>
                
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {forecast.length > 0 ? (
                        forecast.map(day => (
                            <div key={day.date.toISOString()} className="p-3 bg-stone-900/50 rounded-lg">
                                <h3 className="font-bold text-lg text-stone-200">
                                    {day.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <div className="mt-2 space-y-2">
                                    {day.assignments.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 text-sm p-2 bg-stone-800/60 rounded">
                                            <span className="text-emerald-300 font-semibold w-1/3 truncate">{item.userName}</span>
                                            <span className="text-stone-300 w-2/3 flex items-center gap-2 truncate">
                                                <span>{item.questIcon}</span>
                                                <span className="truncate">{item.questTitle}</span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-stone-400 text-center py-12">Select some quests and users to generate a forecast.</p>
                    )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
                    <p className="text-xs text-stone-500 flex-grow text-left">*This is a simulation. Actual assignments may differ if the rotation is changed.</p>
                    <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default RotationForecastDialog;
