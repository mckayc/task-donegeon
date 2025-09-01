import React from 'react';
import { CloseIcon, SunIcon, MoonIcon } from './Icons';

type Theme = 'light' | 'dark';

interface SettingsModalProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onClose: () => void;
}

const Shortcut = ({ keys, description }: { keys: string, description: string}) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">{description}</p>
        <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">{keys}</kbd>
    </div>
);

export const SettingsModal = ({ theme, setTheme, onClose }: SettingsModalProps) => {
  return (
    <div 
        className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
    >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Theme</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTheme('light')}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${theme === 'light' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        <SunIcon className="h-5 w-5" /> Light
                    </button>
                     <button
                        onClick={() => setTheme('dark')}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                    >
                        <MoonIcon className="h-5 w-5" /> Dark
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">How to Use</h3>
                <div className="text-sm space-y-3 text-slate-600 dark:text-slate-300 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <p>
                        • <strong>Calculate:</strong> Use buttons or type expressions and press Enter.
                    </p>
                    <p>
                        • <strong>Take Notes:</strong> Start a line with <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">#</code> to add a comment.
                    </p>
                    <div>
                        <p>• <strong>Convert Units & Currencies:</strong></p>
                        <p className="pl-4">
                          Just type what you want to convert in the input field. Examples:
                        </p>
                        <ul className="list-none pl-8 mt-1 space-y-1">
                            <li><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">10ft in cm</code></li>
                            <li><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">15 USD to EUR</code></li>
                            <li><code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">9.99$ in £</code></li>
                        </ul>
                    </div>
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold mb-2">Keyboard Shortcuts</h3>
                <div className="text-sm">
                    <Shortcut keys="Ctrl/Cmd + N" description="Create new calculator" />
                    <Shortcut keys="Esc" description="Close active calculator window" />
                    <Shortcut keys="Enter" description="Calculate or add note" />
                    <Shortcut keys="Double-click Title" description="Rename calculator" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
