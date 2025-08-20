
import React, { useState, useMemo, useEffect } from 'react';
import { Quest, QuestType, QuestKind, Role } from '../../../types';
import Card from '../../user-interface/Card';
import QuestDetailDialog from '../../quests/QuestDetailDialog';
import { useActionsDispatch } from '../../../context/ActionsContext';
import { useAuthState } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import { useData } from '../../../context/DataProvider';

const MarkVentureAsTodoIntegrationTestCase: React.FC = () => {
  const { currentUser } = useAuthState();
  const { quests: allQuestsFromProvider } = useData();
  const { markQuestAsTodo, unmarkQuestAsTodo } = useActionsDispatch();

  // Find the first available Venture quest from the real data to use for the test.
  const testableQuestFromProvider = useMemo(() => {
    return allQuestsFromProvider.find(q => 
        q.type === QuestType.Venture &&
        (q.assignedUserIds.length === 0 || q.assignedUserIds.includes(currentUser?.id || ''))
    );
  }, [allQuestsFromProvider, currentUser]);

  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  // This effect is crucial for the integration test. It simulates how the main pages
  // should react to data changes from the provider.
  useEffect(() => {
    if (selectedQuest) {
      const updatedQuest = allQuestsFromProvider.find(q => q.id === selectedQuest.id);
      if (updatedQuest && JSON.stringify(updatedQuest) !== JSON.stringify(selectedQuest)) {
        setSelectedQuest(updatedQuest);
      }
    }
  }, [allQuestsFromProvider, selectedQuest]);
  
  if (!currentUser) {
    return <Card title="Error"><p>Current user not found.</p></Card>;
  }
  
  if (!testableQuestFromProvider) {
    return <Card title="Test Case Inapplicable"><p>No suitable Venture quests found in the current data set to run this test.</p></Card>;
  }

  // Get the latest version of the quest for displaying status.
  const currentTestQuestState = allQuestsFromProvider.find(q => q.id === testableQuestFromProvider.id) || testableQuestFromProvider;
  const isTodo = currentTestQuestState.todoUserIds?.includes(currentUser.id) ?? false;
  
  const handleToggleTodo = () => {
    if (!selectedQuest) return;

    // Call the real actions, which will trigger the data provider update,
    // which in turn will trigger our useEffect above.
    if (isTodo) {
      unmarkQuestAsTodo(selectedQuest.id, currentUser.id);
    } else {
      markQuestAsTodo(selectedQuest.id, currentUser.id);
    }
  };
  
  const handleOpenDialog = () => {
    setSelectedQuest(currentTestQuestState);
  };

  return (
    <Card title="Integration Test: Mark Venture as To-Do (Full Flow)">
      <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <h4>Objective</h4>
        <p>
          This test simulates the full user experience on the Quests or Dashboard page. It verifies that toggling the "To-Do" status updates the UI correctly via the main data provider and does not cause the application to crash (the "blank screen" bug).
        </p>
        
        <h4>Instructions</h4>
        <ol>
          <li>This test will use the first available Venture quest: <strong>"{currentTestQuestState.title}"</strong>.</li>
          <li>Click "Open Quest Details".</li>
          <li>In the dialog, click the "To-Do" switch.</li>
          <li>
            <strong>Expected Result:</strong> The switch should toggle, and the "Current State" below should update after a brief moment. The application must remain responsive and no errors should appear.
          </li>
        </ol>

        <div className="not-prose pt-4 border-t border-stone-700/60 flex items-center gap-4">
          <Button onClick={handleOpenDialog}>
            1. Open Quest Details
          </Button>
        </div>
        
        <div className="not-prose pt-4">
            <h4 className="font-bold">Current State:</h4>
            <p className="text-sm">Is "{currentTestQuestState.title}" a To-Do: <span className={`font-bold ${isTodo ? 'text-green-400' : 'text-red-400'}`}>{isTodo ? 'Yes' : 'No'}</span></p>
        </div>
      </div>

      {selectedQuest && (
        <QuestDetailDialog
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
          onToggleTodo={handleToggleTodo}
          isTodo={isTodo}
        />
      )}
    </Card>
  );
};

export default MarkVentureAsTodoIntegrationTestCase;
