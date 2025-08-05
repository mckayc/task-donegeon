import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LoaderCircle, ShieldAlert } from 'lucide-react';
import { Quest, QuestGroup } from '../types';

interface GroupedQuest extends QuestGroup {
    quests: Quest[];
}

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/quests');
        if (!response.ok) {
          throw new Error('Failed to fetch quests. The donegeon is quiet today.');
        }
        const questsData: Quest[] = await response.json();
        setQuests(questsData);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  const groupedQuests = useMemo(() => {
    return quests.reduce((acc, quest) => {
        const groupTitle = quest.questGroup?.title || 'Uncategorized';
        if (!acc[groupTitle]) {
            acc[groupTitle] = {
                id: quest.questGroup?.id || 0,
                title: groupTitle,
                emoji: quest.questGroup?.emoji,
                backgroundColor: quest.questGroup?.backgroundColor,
                quests: [],
            };
        }
        acc[groupTitle].quests.push(quest);
        return acc;
    }, {} as Record<string, GroupedQuest>);
  }, [quests]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 p-8">
        <LoaderCircle className="h-12 w-12 animate-spin text-donegeon-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-donegeon-red p-4 text-center">
        <ShieldAlert className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-bold">An Error Occurred</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-donegeon-gold mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
        Quest Board
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.values(groupedQuests).map((group) => (
          <Card key={group.id || group.title} className="flex flex-col bg-donegeon-brown/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{group.emoji || '📜'}</span>
                <span>{group.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {group.quests.map((quest) => (
                  <li key={quest.id} className="p-3 rounded-lg bg-donegeon-gray-dark/50 border border-donegeon-gray hover:border-donegeon-gold transition-colors">
                    <p className="font-semibold text-donegeon-text flex items-center gap-2">
                        {quest.emoji} {quest.title}
                    </p>
                    {quest.description && <p className="text-sm text-donegeon-text/70 mt-1 font-sans">{quest.description}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestsPage;
