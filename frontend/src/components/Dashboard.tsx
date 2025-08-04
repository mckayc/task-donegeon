import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { User, Duty } from '../types';
import { getDuties, refreshAssets } from '../services/assetService';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDuties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedDuties = await getDuties();
      setDuties(fetchedDuties);
    } catch (err) {
      setError('Failed to load quests. The Donegeon is quiet today.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuties();
  }, [fetchDuties]);

  const handleRefresh = async () => {
    try {
      await refreshAssets();
      await fetchDuties(); // Refetch after refresh
    } catch (err) {
      setError("Could not refresh the Donegeon's archives.");
    }
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in space-y-6">
      <Card>
        <div className="flex justify-between items-center p-4">
            <div>
                <h2 className="text-4xl text-green-400">Welcome, {user.gameName}!</h2>
                <p className="text-stone-400 mt-2 text-lg">
                    Your journey in the Task Donegeon begins now.
                </p>
            </div>
            <Button onClick={handleRefresh} className="w-auto px-4 py-2">
                Refresh Assets
            </Button>
        </div>
      </Card>
      
      <Card>
        <div className="p-4">
          <h3 className="text-2xl text-green-500 mb-4">Daily Duties</h3>
          {isLoading && <p>Loading duties...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <ul className="space-y-3">
              {duties.map((duty) => (
                <li key={duty.id} className="bg-stone-900/50 p-4 rounded-md border border-stone-700">
                  <h4 className="font-bold text-stone-200">{duty.name}</h4>
                  <p className="text-stone-400 text-sm">{duty.description}</p>
                  <div className="text-xs mt-2 text-yellow-400">
                    <span>XP: {duty.xp_reward}</span> | <span>Coins: {duty.currency_reward}</span>
                  </div>
                </li>
              ))}
              {duties.length === 0 && <p className="text-stone-400">No duties found. A quiet day for an adventurer.</p>}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
};
