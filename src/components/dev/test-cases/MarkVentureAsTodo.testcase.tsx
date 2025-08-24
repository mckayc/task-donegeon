import React, { useState, useMemo } from 'react';
import { Quest, QuestType, QuestKind, Role } from 'types';
import Card from '../../user-interface/Card';
import QuestDetailDialog from '../../quests/QuestDetailDialog';
import { useQuestsDispatch } from '../../../context/QuestsContext';
import { useAuthState } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';

// A mock, self-contained component to test the "Mark Venture as To-Do" functionality.
const MarkVentureAsTodoTestCase: React.FC = () => {
  const { currentUser } = useAuthState();
  const { markQuestAsTodo, unmarkQuestAsTodo } = useQuestsDispatch();

  // Create a stable, mock quest object for this test case.
  const mockQuest = useMemo<Quest>(() => ({
    id: 'test-case-quest-1',
    title: 'Test: Slay the Server Error Dragon',
    description: 'This is a test Venture. The goal is to mark it as "To-Do" and verify no server errors appear.',
    type: QuestType.Venture,
    kind: QuestKind.Personal,
    iconType: 'emoji',
    icon: '🐉',
    tags: ['testing', 'bug-fix'],
    rewards: [],
    lateSetbacks: [],
    incompleteSetbacks: [],
    isActive: true,
    isOptional: false,
    assignedUserIds: [currentUser?.id || ''],
    requiresApproval: false,
    startDateTime: null,
    endDateTime: null,
    allDay: true,
    rrule: null,
    startTime: null,
    endTime: null,
    claimedByUserIds: [],
    dismissals: [],
    todoUserIds: [],
  }), [currentUser]);
  
  // Local state to manage the quest within this test case, simulating the app's behavior.
  const [testQuest, setTestQuest] = useState<Quest>(mockQuest);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  if (!currentUser) {
      return <Card title="Error"><p>Current user not found. Cannot run test case.</p></Card>
  }

  const isTodo = testQuest.todoUserIds?.includes(currentUser.id) ?? false;
  
  const handleToggleTodo = () => {
    // We call the real action dispatches.
    if (isTodo) {
      unmarkQuestAsTodo(testQuest.id, currentUser.id);
    } else {
      markQuestAsTodo(testQuest.id, currentUser.id);
    }
    // And also update our local mock state to reflect the change visually.
    setTestQuest(prev => ({
      ...prev,
      todoUserIds: isTodo
        ? (prev.todoUserIds || []).filter(id => id !== currentUser.id)
        : [...(prev.todoUserIds || []), currentUser.id],
    }));
  };
  
  const handleReset = () => {
      setTestQuest(mockQuest);
  }

  return (
    <Card title="Test Case: Mark Venture as To-Do">
      <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <h4>Objective</h4>
        <p>
          Verify that marking a Venture quest as "To-Do" from its detail dialog
          functions correctly without causing a "Server error" notification.
        </p>
        
        <h4>Bug History</h4>
        <p>
          Previously, clicking the "To-Do" toggle would fail because the backend was
          missing the necessary API endpoint to handle the request. This test ensures
          that the frontend action and backend endpoint are correctly connected.
        </p>
        
        <h4>Instructions</h4>
        <ol>
          <li>Click the "Open Quest Details" button below.</li>
          <li>In the dialog, find the "To-Do" switch and click it.</li>
          <li>
            <strong>Expected Result:</strong> The switch should toggle ON, and NO
            "Server error" notification should appear at the top-right of the screen.
            The dialog should remain open and responsive.
          </li>
           <li>Click the switch again. It should toggle OFF without error.</li>
        </ol>

        <div className="not-prose pt-4 border-t border-stone-700/60 flex items-center gap-4">
          <Button onClick={() => setIsDetailOpen(true)}>
            1. Open Quest Details
          </Button>
          <Button onClick={handleReset} variant="secondary">
            Reset Test State
          </Button>
        </div>
        
        <div className="not-prose pt-4">
            <h4 className="font-bold">Current State:</h4>
            <p className="text-sm">Is "To-Do": <span className={`font-bold ${isTodo ? 'text-green-400' : 'text-red-400'}`}>{isTodo ? 'Yes' : 'No'}</span></p>
        </div>
      </div>

      {isDetailOpen && (
        <QuestDetailDialog
          quest={testQuest}
          onClose={() => setIsDetailOpen(false)}
          onToggleTodo={handleToggleTodo}
          isTodo={isTodo}
        />
      )}
    </Card>
  );
};

export default MarkVentureAsTodoTestCase;