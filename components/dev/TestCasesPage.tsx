import React, { useState } from 'react';
import Card from '../user-interface/Card';
import MarkVentureAsTodoTestCase from './test-cases/MarkVentureAsTodo.testcase';
import MarkVentureAsTodoIntegrationTestCase from './test-cases/MarkVentureAsTodo.integration.testcase';

const testCases = [
  { id: 'mark-venture-todo', name: 'Mark Venture as To-Do (Unit)', component: MarkVentureAsTodoTestCase },
  { id: 'mark-venture-todo-integration', name: 'Mark Venture as To-Do (Integration)', component: MarkVentureAsTodoIntegrationTestCase },
  // Future test cases can be added here
];

const TestCasesPage: React.FC = () => {
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(testCases[0]?.id || null);

  const ActiveComponent = testCases.find(tc => tc.id === activeTestCaseId)?.component;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <Card title="Test Suites">
          <nav className="space-y-1">
            {testCases.map(tc => (
              <button
                key={tc.id}
                onClick={() => setActiveTestCaseId(tc.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTestCaseId === tc.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-300 hover:bg-stone-700'
                }`}
              >
                {tc.name}
              </button>
            ))}
          </nav>
        </Card>
      </div>
      <div className="md:col-span-3">
        {ActiveComponent ? <ActiveComponent /> : (
          <Card>
            <p className="text-stone-400">Select a test case to view it.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestCasesPage;