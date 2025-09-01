import { useState, useEffect, useCallback } from 'react';
import type { Calculator, WindowState } from '../types';

const LOCAL_STORAGE_KEY = 'openCalcPadState_v2';
const THEME_KEY = 'openCalcPadTheme';
const MAX_UNDO_STEPS = 50;

type Theme = 'light' | 'dark';

const saveStateToFile = (state: object) => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `opencalcpad_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const useCalculatorStore = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [undoStack, setUndoStack] = useState<Calculator[][]>([]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('dark'); // Default theme
    }
    
    // Load app state
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const { calculators: savedCalculators, windows: savedWindows } = JSON.parse(savedState);
        if (Array.isArray(savedCalculators) && Array.isArray(savedWindows)) {
          setCalculators(savedCalculators);
          // Ensure old states get the new `isScientific` property
          setWindows(savedWindows.map(w => ({...w, isScientific: w.isScientific || false})));
        }
      } else {
        // Create a default calculator on first load
        addCalculator();
      }
    } catch (error) {
      console.error("Failed to load state from localStorage:", error);
      addCalculator();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const state = { calculators, windows };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [calculators, windows]);
  
  const getHighestZIndex = useCallback(() => {
      return windows.reduce((max, w) => Math.max(w.zIndex, max), 10);
  }, [windows]);

  const addCalculator = useCallback(() => {
    const newId = `calc-${Date.now()}`;
    const newCalc: Calculator = {
      id: newId,
      title: `Calculator ${calculators.length + 1}`,
      history: 'Welcome to OpenCalcPad!\nType notes here.\nUse buttons or numpad for calculations.\nEnter once to carry result.\nEnter twice to clear.\n',
    };
    const newWindow: WindowState = {
      id: newId,
      x: 50 + (calculators.length % 5) * 40,
      y: 50 + (calculators.length % 5) * 40,
      width: 380,
      height: 500,
      zIndex: getHighestZIndex() + 1,
      isOpen: true,
      isScientific: false,
    };

    setCalculators(prev => [...prev, newCalc]);
    setWindows(prev => [...prev, newWindow]);
  }, [calculators.length, getHighestZIndex]);

  const deleteCalculator = useCallback((id: string) => {
    setCalculators(prev => prev.filter(c => c.id !== id));
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const updateCalculator = useCallback((id: string, updates: Partial<Calculator>) => {
    setUndoStack(prev => [...prev, calculators].slice(-MAX_UNDO_STEPS));
    setCalculators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [calculators]);

  const updateWindowState = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);
  
  const toggleScientificMode = useCallback((id: string) => {
      setWindows(prev => prev.map(w => w.id === id ? {...w, isScientific: !w.isScientific} : w));
  }, []);

  const bringToFront = useCallback((id: string) => {
    const currentWindow = windows.find(w => w.id === id);
    const highestZIndex = getHighestZIndex();
    // Only bring to front if it's not already the top window
    if (currentWindow && currentWindow.zIndex <= highestZIndex) {
        setWindows(prev => prev.map(w => {
          if (w.id === id) {
            return { ...w, zIndex: highestZIndex + 1 };
          }
          return w;
        }));
    }
  }, [getHighestZIndex, windows]);

  const toggleWindow = useCallback((id: string) => {
    const windowState = windows.find(w => w.id === id);
    if (windowState?.isOpen) {
        updateWindowState(id, { isOpen: false });
    } else {
        updateWindowState(id, { isOpen: true, zIndex: getHighestZIndex() + 1 });
    }
  }, [windows, updateWindowState, getHighestZIndex]);
  
  const reorderCalculators = useCallback((startIndex: number, endIndex: number) => {
     setCalculators(prev => {
        const result = Array.from(prev);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
     });
  }, []);

  const exportData = useCallback(() => {
    saveStateToFile({ calculators, windows, theme });
  }, [calculators, windows, theme]);

  const importData = useCallback((file: File) => {
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const { calculators: importedCalculators, windows: importedWindows, theme: importedTheme } = JSON.parse(text);
            if (Array.isArray(importedCalculators) && Array.isArray(importedWindows)) {
              setCalculators(importedCalculators);
              setWindows(importedWindows);
              if (importedTheme) {
                  setTheme(importedTheme);
              }
            } else {
                throw new Error("Invalid file format.");
            }
          }
        } catch (error) {
          alert("Error importing file. Make sure it's a valid backup.");
          console.error("Import error:", error);
        }
      };
      reader.readAsText(file);
    } else {
        alert("Please select a valid JSON backup file.");
    }
  }, [setTheme]);
  
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setCalculators(lastState);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  return {
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
    undo,
  };
};