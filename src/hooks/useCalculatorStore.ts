import { useState, useEffect, useCallback } from 'react';
import type { Calculator, WindowState } from '../types';

const THEME_KEY = 'openCalcPadTheme';

type Theme = 'light' | 'dark';

const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    if (response.status === 204) return null; // No Content
    return response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    // Here you could add user-facing error notifications
    throw error;
  }
};

export const useCalculatorStore = () => {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setThemeState] = useState<Theme>('dark');

  const fetchState = useCallback(async () => {
    try {
      const data = await apiRequest('/api/state');
      if (data) {
        // Ensure boolean values are correctly typed from DB (0/1)
        const typedWindows = data.windows.map((w: any) => ({
            ...w,
            isOpen: !!w.isOpen,
            isScientific: !!w.isScientific
        }));
        setCalculators(data.calculators);
        setWindows(typedWindows);
      }
    } catch (error) {
       console.error("Failed to load state from server:", error);
    }
  }, []);

  useEffect(() => {
    // Load theme from localStorage (theme is a client-side preference)
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }

    // Load main app state from the server
    fetchState();
  }, [fetchState]);
  
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const getHighestZIndex = useCallback(() => {
    return windows.reduce((max, w) => Math.max(w.zIndex, max), 10);
  }, [windows]);

  const addCalculator = useCallback(async () => {
    const newId = `calc-${Date.now()}`;
    const newSortOrder = calculators.length;
    
    const newCalc = {
      id: newId,
      title: `Calculator ${calculators.length + 1}`,
      history: 'Welcome to OpenCalcPad!\nType notes here.\nUse buttons or numpad for calculations.\nEnter once to carry result.\nEnter twice to clear.\n',
      sortOrder: newSortOrder
    };
    
    const newWindow = {
      id: newId,
      x: 50 + (calculators.length % 5) * 40,
      y: 50 + (calculators.length % 5) * 40,
      width: 380,
      height: 500,
      zIndex: getHighestZIndex() + 1,
      isOpen: true,
      isScientific: false,
    };

    await apiRequest('/api/calculators', {
        method: 'POST',
        body: JSON.stringify({ newCalc, newWindow })
    });
    fetchState(); // Refetch to get the new state
  }, [calculators.length, getHighestZIndex, fetchState]);

  const deleteCalculator = useCallback(async (id: string) => {
    await apiRequest(`/api/calculators/${id}`, { method: 'DELETE' });
    fetchState();
  }, [fetchState]);

  const updateCalculator = useCallback(async (id: string, updates: Partial<Calculator>) => {
    await apiRequest(`/api/calculators/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
    // Optimistic update for smoother UI
    setCalculators(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Or just fetchState();
  }, []);

  const updateWindowState = useCallback(async (id: string, updates: Partial<WindowState>) => {
    await apiRequest(`/api/windows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
    // Optimistic update
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    // Or just fetchState();
  }, []);
  
  const toggleScientificMode = useCallback(async (id: string) => {
      const window = windows.find(w => w.id === id);
      if (window) {
        await updateWindowState(id, { isScientific: !window.isScientific });
      }
  }, [windows, updateWindowState]);

  const bringToFront = useCallback((id: string) => {
    const currentWindow = windows.find(w => w.id === id);
    const highestZIndex = getHighestZIndex();
    if (currentWindow && currentWindow.zIndex <= highestZIndex) {
        updateWindowState(id, { zIndex: highestZIndex + 1 });
    }
  }, [getHighestZIndex, windows, updateWindowState]);

  const toggleWindow = useCallback((id: string) => {
    const windowState = windows.find(w => w.id === id);
    if (!windowState) return;
    
    if (windowState.isOpen) {
        updateWindowState(id, { isOpen: false });
    } else {
        updateWindowState(id, { isOpen: true, zIndex: getHighestZIndex() + 1 });
    }
  }, [windows, updateWindowState, getHighestZIndex]);
  
  const reorderCalculators = useCallback(async (startIndex: number, endIndex: number) => {
     const result = Array.from(calculators);
     const [removed] = result.splice(startIndex, 1);
     result.splice(endIndex, 0, removed);
     
     const orderedIds = result.map(c => c.id);
     await apiRequest('/api/state/reorder', {
         method: 'POST',
         body: JSON.stringify({ orderedIds })
     });
     setCalculators(result); // Optimistic update
  }, [calculators]);

  const exportData = useCallback(async () => {
    const state = await apiRequest('/api/state');
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opencalcpad_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback(async (file: File) => {
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const dataToImport = JSON.parse(text);
            await apiRequest('/api/state/import', {
                method: 'POST',
                body: JSON.stringify(dataToImport)
            });
            fetchState();
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
  }, [fetchState]);

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
  };
};
