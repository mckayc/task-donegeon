import React, { useState, useEffect, useCallback } from 'react';
import { useCalculatorStore } from './hooks/useCalculatorStore';
import { Sidebar } from './components/Sidebar';
import { CalculatorWindow } from './components/CalculatorWindow';
import { SettingsModal } from './components/SettingsModal';
import { GearIcon } from './components/Icons';

function App() {
  const {
    calculators,
    windows,
    sidebarOpen,
    theme,
    setTheme,
    setSidebarOpen,
    addCalculator,
    deleteCalculator,
    updateCalculator,
    updateWindowState,
    bringToFront,
    toggleWindow,
    reorderCalculators,
    exportData,
    importData,
    toggleScientificMode,
  } = useCalculatorStore();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      addCalculator();
    }
  }, [addCalculator]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-white flex overflow-hidden">
      {settingsOpen && <SettingsModal theme={theme} setTheme={setTheme} onClose={() => setSettingsOpen(false)} />}
      
      <Sidebar 
        isOpen={sidebarOpen}
        calculators={calculators}
        onAdd={addCalculator}
        onDelete={deleteCalculator}
        onSelect={toggleWindow}
        onReorder={reorderCalculators}
        onUpdate={updateCalculator}
        onExport={exportData}
        onImport={importData}
      />
      
      <main className="flex-1 h-full relative bg-grid">
        <div className="absolute top-4 left-4 z-[9999] flex gap-2">
            <button 
              onClick={() => setSidebarOpen(o => !o)}
              className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors"
              aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={() => setSettingsOpen(true)}
              className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-2 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors"
              aria-label="Open Settings"
            >
                <GearIcon className="h-6 w-6"/>
            </button>
        </div>

        {calculators.map(calc => {
          const win = windows.find(w => w.id === calc.id);
          if (!win || !win.isOpen) return null;
          return (
            <CalculatorWindow 
              key={calc.id}
              calculator={calc}
              windowState={win}
              onUpdateCalculator={updateCalculator}
              onUpdateWindowState={updateWindowState}
              onBringToFront={bringToFront}
              onClose={toggleWindow}
              onToggleScientific={toggleScientificMode}
            />
          );
        })}
      </main>
      
      <style>{`
        .bg-grid {
          background-image:
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .dark .bg-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        }
      `}</style>

    </div>
  );
}

export default App;
