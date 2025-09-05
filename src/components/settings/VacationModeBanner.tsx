import React from 'react';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { toYMD } from '../../utils/quests';

const VacationModeBanner: React.FC = () => {
  const { scheduledEvents } = useSystemState();
  const { appMode } = useUIState();
  
  const today = new Date();
  const todayYMD = toYMD(today);
  const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

  const activeVacationEvent = scheduledEvents.find(event => {
    if (event.eventType !== 'Vacation') return false;
    
    // An event applies if it's global (no guildId) or matches the current guild scope
    const scopeMatch = !event.guildId || event.guildId === guildId;
    if (!scopeMatch) return false;
    
    // Check if today is within the event's date range
    return todayYMD >= event.startDate && todayYMD <= event.endDate;
  });

  if (!activeVacationEvent) {
    return null;
  }

  const start = new Date(activeVacationEvent.startDate + 'T00:00:00');
  const end = new Date(activeVacationEvent.endDate + 'T00:00:00');

  return (
    <div className="bg-blue-800 text-blue-100 text-center p-2 rounded-lg mb-6 shadow-lg">
      <p className="font-semibold">
        Vacation is active! Deadlines are paused from {start.toLocaleDateString()} to {end.toLocaleDateString()}.
      </p>
    </div>
  );
};

export default VacationModeBanner;
