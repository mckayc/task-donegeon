import { useMemo, useState, useEffect } from 'react';
import {
  ChronicleEvent,
} from '../types';
import { toYMD } from '../utils/quests';
import { useAuthState } from '../context/AuthContext';
import { useUIState } from '../context/UIContext';


interface UseChroniclesProps {
  startDate: Date;
  endDate: Date;
}

export const useChronicles = ({ startDate, endDate }: UseChroniclesProps): Map<string, ChronicleEvent[]> => {
    const { currentUser } = useAuthState();
    const { appMode } = useUIState();
    const [events, setEvents] = useState<Map<string, ChronicleEvent[]>>(new Map());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!startDate || !endDate || !currentUser) return;

        const fetchChronicles = async () => {
            setIsLoading(true);
            try {
                const start = toYMD(startDate);
                const end = toYMD(endDate);
                const guildId = appMode.mode === 'guild' ? appMode.guildId : 'null';
                
                // For calendar, we always want all events in the guild scope, not just personal ones.
                const viewMode = 'all'; 

                const response = await fetch(`/api/chronicles?startDate=${start}&endDate=${end}&userId=${currentUser.id}&guildId=${guildId}&viewMode=${viewMode}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chronicles data');
                }

                const data: { events: ChronicleEvent[] } = await response.json();
                
                const chroniclesByDate = new Map<string, ChronicleEvent[]>();
                data.events.forEach(event => {
                    const dateKey = event.date.split('T')[0];
                    const collection = chroniclesByDate.get(dateKey) || [];
                    collection.push(event);
                    chroniclesByDate.set(dateKey, collection);
                });

                for (const eventsOnDay of chroniclesByDate.values()) {
                    eventsOnDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                }
                
                setEvents(chroniclesByDate);
            } catch (error) {
                console.error("Error fetching chronicles:", error);
                setEvents(new Map());
            } finally {
                setIsLoading(false);
            }
        };

        fetchChronicles();

    }, [startDate, endDate, currentUser, appMode]);

    return events;
};