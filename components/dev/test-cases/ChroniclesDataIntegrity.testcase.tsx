import React, { useState, useMemo } from 'react';
import { Quest, QuestCompletionStatus, Role, User } from '../../../types';
import Card from '../../user-interface/Card';
import { useQuestsDispatch, useQuestsState } from '../../../context/QuestsContext';
import { useAuthState } from '../../../context/AuthContext';
import Button from '../../user-interface/Button';
import { useUIDispatch } from '../../../context/UIContext';
import { CheckCircleIcon, XCircleIcon } from '../../user-interface/Icons';

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

const ChroniclesDataIntegrityTestCase: React.FC = () => {
    const { currentUser, users } = useAuthState();
    const { quests } = useQuestsState();
    const { completeQuest } = useQuestsDispatch();
    const { setActivePage } = useUIDispatch();

    const [testState, setTestState] = useState<{
        setupRun: boolean;
        completionId: string | null;
        dashboard: TestStatus;
        chroniclesAll: TestStatus;
        chroniclesMy: TestStatus;
    }>({
        setupRun: false,
        completionId: null,
        dashboard: 'pending',
        chroniclesAll: 'pending',
        chroniclesMy: 'pending',
    });

    const testUser = useMemo(() => users.find(u => u.role === Role.Explorer), [users]);
    const testQuest = useMemo(() => quests.find(q => q.title.includes("The Pearly Gate Polish")), [quests]);

    const handleSetup = async () => {
        if (!testUser || !testQuest) return;
        
        const completionData = {
            questId: testQuest.id,
            userId: testUser.id,
            completedAt: new Date().toISOString(),
            status: QuestCompletionStatus.Approved,
            note: `Test completion for Chronicles integrity check at ${new Date().toLocaleTimeString()}`,
            guildId: testQuest.guildId,
        };
        
        await completeQuest(completionData);
        setTestState({
            ...testState,
            setupRun: true,
            completionId: `qc-${Date.now()}`, // Approximate ID for tracking
            dashboard: 'running',
        });
    };
    
    const handleReset = () => {
         setTestState({
            setupRun: false,
            completionId: null,
            dashboard: 'pending',
            chroniclesAll: 'pending',
            chroniclesMy: 'pending',
        });
    }
    
    const markStep = (step: 'dashboard' | 'chroniclesAll' | 'chroniclesMy', status: 'passed' | 'failed') => {
        setTestState(prev => {
            const newState = { ...prev, [step]: status };
            if (status === 'passed') {
                if (step === 'dashboard') newState.chroniclesAll = 'running';
                if (step === 'chroniclesAll') newState.chroniclesMy = 'running';
            }
            return newState;
        });
    };
    
    const TestStep: React.FC<{
        title: string;
        status: TestStatus;
        isActive: boolean;
        instructions: React.ReactNode;
        onPass: () => void;
        onFail: () => void;
    }> = ({ title, status, isActive, instructions, onPass, onFail }) => {
        const baseClass = "p-4 rounded-lg border-2 transition-all";
        const statusClass = {
            pending: "bg-stone-800/50 border-stone-700 opacity-50",
            running: "bg-sky-900/40 border-sky-700",
            passed: "bg-green-900/40 border-green-700",
            failed: "bg-red-900/40 border-red-700",
        }[status];
        
        const StatusIndicator = () => {
            if (status === 'passed') return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
            if (status === 'failed') return <XCircleIcon className="w-6 h-6 text-red-400" />;
            if (isActive) return <div className="w-5 h-5 rounded-full bg-sky-400 animate-pulse" />;
            return <div className="w-5 h-5 rounded-full bg-stone-600" />;
        };

        return (
            <div className={`${baseClass} ${statusClass}`}>
                <h5 className="font-bold text-lg text-stone-200 flex items-center gap-3"><StatusIndicator /> {title}</h5>
                {isActive && (
                    <div className="pl-8 pt-2 mt-2 border-t border-white/10">
                        <div className="prose prose-sm prose-invert max-w-none text-stone-300">
                            {instructions}
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button size="sm" onClick={onPass} className="!bg-green-600 hover:!bg-green-500">Pass</Button>
                            <Button size="sm" onClick={onFail} variant="destructive">Fail</Button>
                        </div>
                    </div>
                )}
            </div>
        )
    };

    if (!testUser || !testQuest) {
        return (
            <Card title="Test Case Unavailable">
                <p className="text-stone-400">This test case requires the default "Explorer" user and "The Pearly Gate Polish ✨" quest to exist. Please ensure default data is loaded.</p>
            </Card>
        )
    }

    return (
        <Card title="Test Case: Chronicles Data Integrity">
            <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
                <h4>Objective</h4>
                <p>To verify that completing a quest correctly updates the Dashboard and appears with full details (no "Unknown Quest" or "Unknown User") on the Chronicles page for both "All" and "My Activity" views.</p>

                <h4>Instructions</h4>
                <ol>
                    <li>Click "1. Run Setup". This will complete a quest for '{testUser.gameName}'.</li>
                    <li>Follow the steps below, navigating to the indicated pages and visually verifying the results.</li>
                    <li>Click "Pass" or "Fail" for each step.</li>
                </ol>
            </div>
            
            <div className="mt-6 pt-6 border-t border-stone-700/60">
                 {!testState.setupRun ? (
                    <Button onClick={handleSetup}>1. Run Setup</Button>
                ) : (
                    <div className="space-y-4">
                        <p className="text-green-400 font-semibold">Setup complete! A quest has been completed for {testUser.gameName}. Proceed with verification.</p>
                        <TestStep
                            title="Step 1: Verify Dashboard"
                            status={testState.dashboard}
                            isActive={testState.dashboard === 'running'}
                            instructions={<>
                                <p>Go to the <button onClick={() => setActivePage('Dashboard')} className="text-accent underline">Dashboard</button>.</p>
                                <p>Does the "Recent Chronicles" section show that <strong>{testUser.gameName}</strong> completed <strong>"{testQuest.title}"</strong>?</p>
                            </>}
                            onPass={() => markStep('dashboard', 'passed')}
                            onFail={() => markStep('dashboard', 'failed')}
                        />
                        <TestStep
                            title="Step 2: Verify Chronicles (All Activity)"
                            status={testState.chroniclesAll}
                            isActive={testState.chroniclesAll === 'running'}
                            instructions={<>
                                <p>Go to the <button onClick={() => setActivePage('Chronicles')} className="text-accent underline">Chronicles</button> page.</p>
                                <p>Make sure "All Activity" is selected.</p>
                                <p>Does the event appear correctly, with <strong>NO</strong> "Unknown Quest" or "Unknown User" text?</p>
                            </>}
                            onPass={() => markStep('chroniclesAll', 'passed')}
                            onFail={() => markStep('chroniclesAll', 'failed')}
                        />
                        <TestStep
                            title="Step 3: Verify Chronicles (My Activity)"
                            status={testState.chroniclesMy}
                            isActive={testState.chroniclesMy === 'running'}
                            instructions={<>
                                <p>On the <button onClick={() => setActivePage('Chronicles')} className="text-accent underline">Chronicles</button> page, switch the filter to "My Activity".</p>
                                <p>Does the event for <strong>"{testQuest.title}"</strong> still appear correctly?</p>
                            </>}
                            onPass={() => markStep('chroniclesMy', 'passed')}
                            onFail={() => markStep('chroniclesMy', 'failed')}
                        />
                    </div>
                )}
            </div>
            <div className="mt-4 text-right">
                <Button onClick={handleReset} variant="secondary">Reset Test</Button>
            </div>
        </Card>
    );
};

export default ChroniclesDataIntegrityTestCase;