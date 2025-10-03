
import React from 'react';
import { useSystemState } from '../../context/SystemContext';
import { useUIState } from '../../context/UIContext';
import { toYMD } from '../../utils/conditions';

const GraceModeBanner: React.FC = () => {
  const { settings, scheduledEvents } = useSystemState();
  const { appMode } = useUIState();
  
  const today = new Date();
  const todayYMD = toYMD(today);
  const guildId = appMode.mode === 'guild' ? appMode.guildId : undefined;

  // Check for global grace period first
  if (settings.gracePeriod?.isGlobalGracePeriodActive) {
      return (
        <div className="bg-blue-800 text-blue-100 text-center p-2 rounded-lg mb-6 shadow-lg">
            <p className="font-semibold">
                A Global Grace Period is active! All deadlines are currently paused.
            </p>
        </div>
      );
  }

  const activeGracePeriodEvent = scheduledEvents.find(event => {
    // Check for both new and old event types for backward compatibility
    if (event.eventType !== 'Grace Period' && event.eventType !== 'Vacation') return false;
    
    // An event applies if it's global (no guildId) or matches the current guild scope
    const scopeMatch = !event.guildId || event.guildId === guildId;
    if (!scopeMatch) return false;
    
    // Check if today is within the event's date range
    return todayYMD >= event.startDate && todayYMD <= event.endDate;
  });

  if (!activeGracePeriodEvent) {
    return null;
  }

  const start = new Date(activeGracePeriodEvent.startDate + 'T00:00:00');
  const end = new Date(activeGracePeriodEvent.endDate + 'T00:00:00');

  return (
    <div className="bg-blue-800 text-blue-100 text-center p-2 rounded-lg mb-6 shadow-lg">
      <p className="font-semibold">
        Grace Period "{activeGracePeriodEvent.title}" is active! Deadlines are paused from {start.toLocaleDateString()} to {end.toLocaleDateString()}.
      </p>
    </div>
  );
};

export default GraceModeBanner;
