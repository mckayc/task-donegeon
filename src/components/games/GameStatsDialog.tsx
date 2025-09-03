
import React, { useState, useMemo } from 'react';
import { Minigame, GameScore, User } from '../../../types';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import { useSystemState } from '../../context/SystemContext';
import { useAuthState } from '../../context/AuthContext';
import Avatar from '../user-interface/Avatar';

interface GameStatsDialogProps {
  game: Minigame;
  onClose: () => void;
}

const GameStatsDialog: React.FC<GameStatsDialogProps> = ({ game, onClose }) => {
  const { gameScores } = useSystemState();
  const { users } = useAuthState();
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const gameSpecificScores = gameScores.filter(s => s.gameId === game.id);
    
    const leaderboard = [...gameSpecificScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(score => ({
        ...score,
        user: users.find(u => u.id === score.userId)
      }));

    const userStats = users.map(user => {
      const userScores = gameSpecificScores.filter(s => s.userId === user.id);
      if (userScores.length === 0) {
        return { user, highScore: 0, totalPlays: 0 };
      }
      const highScore = Math.max(...userScores.map(s => s.score));
      const totalPlays = userScores.length;
      return { user, highScore, totalPlays };
    });

    return { leaderboard, userStats };
  }, [game.id, gameScores, users]);

  const filteredUserStats = useMemo(() => {
      if (!searchTerm.trim()) return stats.userStats;
      const lowercasedTerm = searchTerm.toLowerCase();
      return stats.userStats.filter(s => s.user.gameName.toLowerCase().includes(lowercasedTerm));
  }, [stats.userStats, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-medieval text-emerald-400 p-8 flex items-center gap-3">
            {game.icon} Stats for "{game.name}"
        </h2>

        <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {/* Leaderboard */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-xl text-stone-200">Global Leaderboard</h3>
            <ul className="space-y-2">
              {stats.leaderboard.map((entry, index) => (
                <li key={entry.id} className="flex items-center gap-3 p-2 bg-stone-900/50 rounded-md">
                  <span className="font-bold text-lg text-amber-300 w-6 text-center">{index + 1}</span>
                  {entry.user && <Avatar user={entry.user} className="w-8 h-8 rounded-full" />}
                  <span className="font-semibold text-stone-300 flex-grow">{entry.user?.gameName || 'Unknown'}</span>
                  <span className="font-bold text-emerald-400">{entry.score}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* User Stats */}
          <div className="md:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl text-stone-200">User Statistics</h3>
                <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48" />
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                 <table className="w-full text-left">
                    <thead className="sticky top-0 bg-stone-800 border-b border-stone-700">
                        <tr>
                            <th className="p-2 font-semibold">User</th>
                            <th className="p-2 font-semibold text-right">High Score</th>
                            <th className="p-2 font-semibold text-right">Total Plays</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUserStats.map(s => (
                             <tr key={s.user.id} className="border-b border-stone-700/60">
                                <td className="p-2 font-semibold text-stone-200">{s.user.gameName}</td>
                                <td className="p-2 text-stone-300 text-right">{s.highScore}</td>
                                <td className="p-2 text-stone-300 text-right">{s.totalPlays}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-stone-700/60">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default GameStatsDialog;