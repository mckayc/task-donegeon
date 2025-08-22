import React, { useState, useMemo } from 'react';
import { Quest, User } from '../../../types';
import Card from '../../user-interface/Card';
import { useQuestsState } from '../../../context/QuestsContext';
import { useAuthState } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import Input from '../../user-interface/Input';
import { useNotificationsDispatch } from '../../../context/NotificationsContext';
import { useUIDispatch } from '../../../context/UIContext';

const ChronicleInjectorTestCase: React.FC = () => {
    const { users } = useAuthState();
    const { quests } = useQuestsState();
    const { addNotification } = useNotificationsDispatch();
    const { setActivePage } = useUIDispatch();

    const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
    const [selectedQuestId, setSelectedQuestId] = useState<string>(quests[0]?.id || '');
    const [note, setNote] = useState('Manual injection via dev tool.');
    const [isInjecting, setIsInjecting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedUserId || !selectedQuestId) {
            addNotification({ type: 'error', message: 'Please select a user and a quest.' });
            return;
        }
        setIsInjecting(true);
        try {
            const response = await fetch('/api/system/inject-chronicle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId, questId: selectedQuestId, note }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to inject event.');
            }
            addNotification({ type: 'success', message: 'Chronicle event injected successfully!' });
        } catch (error) {
            addNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsInjecting(false);
        }
    };

    return (
        <Card title="Test Case: Chronicle Injector">
            <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
                <h4>Objective</h4>
                <p>This tool manually injects a "Quest Completed" event into the database. It allows developers to test the data flow and ensure that new events appear correctly on the Dashboard and Chronicles pages.</p>

                <h4>Instructions</h4>
                <ol>
                    <li>Select a user and a quest from the dropdowns below.</li>
                    <li>(Optional) Add a custom note.</li>
                    <li>Click "Inject Event".</li>
                    <li>
                        <strong>Verification:</strong> Navigate to the <button onClick={() => setActivePage('Dashboard')} className="text-accent underline">Dashboard</button> and <button onClick={() => setActivePage('Chronicles')} className="text-accent underline">Chronicles</button> pages to verify the new event appears correctly, without any "Unknown" data.
                    </li>
                </ol>

                <div className="not-prose pt-4 border-t border-stone-700/60 space-y-4">
                    <Input as="select" label="Select User" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                        {users.map(user => <option key={user.id} value={user.id}>{user.gameName}</option>)}
                    </Input>
                    <Input as="select" label="Select Quest" value={selectedQuestId} onChange={(e) => setSelectedQuestId(e.target.value)}>
                        {quests.map(quest => <option key={quest.id} value={quest.id}>{quest.icon} {quest.title}</option>)}
                    </Input>
                    <Input as="textarea" label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
                    <div className="text-right">
                        <Button onClick={handleSubmit} disabled={isInjecting}>
                            {isInjecting ? 'Injecting...' : 'Inject Event'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ChronicleInjectorTestCase;
