import React, { useState, useMemo, useEffect } from 'react';
import { Quest, QuestType, QuestKind, Role, QuestCompletionStatus } from '../../../types';
import Card from '../../user-interface/Card';
import QuestDetailDialog from '../../quests/QuestDetailDialog';
import { useQuestsDispatch, useQuestsState } from '../../../context/QuestsContext';
import { useAuthState } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import { useSystemState } from '../../../context/SystemContext';
import { isQuestAvailableForUser } from '../../../utils/quests';
import { useUIState } from '../../../context/UIContext';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';


const CompleteQuestIntegrationTestCase: React.FC = () => {
  const { currentUser } = useAuthState();
  const { quests: allQuests, questCompletions } = useQuestsState();
  const { scheduledEvents } = useSystemState();
  const { appMode } = useUIState();
  const { completeQuest } = useQuestsDispatch();
  const { addNotification } = useNotificationsDispatch();

  const testableQuest = useMemo(() => {
      if (!currentUser) return null;
      const userCompletions = questCompletions.filter(c => c.userId === currentUser.id);
      return allQuests.find(q => 
          q.type === QuestType.Duty &&
          !q.requiresApproval &&
          isQuestAvailableForUser(q, userCompletions, new Date(), scheduledEvents, appMode)
      );
  }, [allQuests, questCompletions, currentUser, scheduledEvents, appMode]);

  const [runCount, setRunCount] = useState(0);

  const completionCount = useMemo(() => {
    if (!testableQuest || !currentUser) return 0;
    return questCompletions.filter(c => c.questId === testableQuest.id && c.userId === currentUser.id).length;
  }, [questCompletions, testableQuest, currentUser]);
  
  if (!currentUser) {
    return <Card title="Error"><p>Current user not found.</p></Card>;
  }
  
  if (!testableQuest) {
    return <Card title="Test Case Inapplicable"><p>No suitable, completable, non-approval Duty quests found. Please create one to run this test.</p></Card>;
  }

  const handleCompleteQuest = () => {
      completeQuest({
          questId: testableQuest.id,
          userId: currentUser.id,
          completedAt: new Date().toISOString(),
          status: QuestCompletionStatus.Approved,
          note: `Completed via integration test #${runCount + 1}`,
          guildId: testableQuest.guildId,
      });
      addNotification({ type: 'info', message: 'Completion action dispatched. Verifying update...' });
      setRunCount(prev => prev + 1);
  };
  
  return (
    <Card title="Integration Test: Complete Quest & Verify State">
      <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <h4>Objective</h4>
        <p>
          This test verifies the entire flow of completing a quest. It ensures the action is sent to the backend, the data is updated, a delta sync is received, and the frontend state reflects the new completion.
        </p>
        
        <h4>Bug History</h4>
        <p>
          This test was created to address a bug where quest completions granted rewards but failed to create a `QuestCompletion` record. This left the quest available for completion again and prevented it from appearing in the Chronicles.
        </p>
        
        <h4>Instructions</h4>
        <ol>
          <li>This test will use the first available Duty quest that does not require approval: <strong>"{testableQuest.title}"</strong>.</li>
          <li>Click the "Complete Quest" button.</li>
          <li>
            <strong>Expected Result:</strong> After a brief moment, the "Completion Count" below should increase by one, and its color should turn green. This confirms the frontend state was correctly updated via the real data sync process.
          </li>
        </ol>

        <div className="not-prose pt-4 border-t border-stone-700/60 flex items-center gap-4">
          <Button onClick={handleCompleteQuest}>
            Complete Quest
          </Button>
        </div>
        
        <div className="not-prose pt-4">
            <h4 className="font-bold">Verification:</h4>
            <p className="text-sm">Completion Count for "{testableQuest.title}": <span className={`font-bold text-2xl ${completionCount > 0 ? 'text-green-400' : 'text-red-400'}`}>{completionCount}</span></p>
        </div>
      </div>
    </Card>
  );
};

export default CompleteQuestIntegrationTestCase;