import React, { useRef, useState, useEffect } from 'react';
import type { Calculator } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, DownloadIcon, PencilIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  calculators: Calculator[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSelect: (id:string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onUpdate: (id: string, updates: Partial<Calculator>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const SidebarItem = ({ 
    calculator, 
    onDelete, 
    onSelect,
    onUpdate
}: { 
    calculator: Calculator, 
    onDelete: (id: string) => void, 
    onSelect: (id:string) => void,
    onUpdate: (id: string, updates: Partial<Calculator>) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(calculator.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(calculator.title);
  }, [calculator.title]);

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
      }
  }, [isEditing]);

  const handleRename = () => {
    if (title.trim()) {
        onUpdate(calculator.id, { title });
    } else {
        setTitle(calculator.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRename();
      if (e.key === 'Escape') {
          setTitle(calculator.title);
          setIsEditing(false);
      }
  };

  return (
    <div 
      className="group flex items-center justify-between p-2 rounded-md hover:bg-slate-700 dark:hover:bg-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
      onClick={() => onSelect(calculator.id)}
    >
        {isEditing ? (
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                onClick={e => e.stopPropagation()}
                className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white w-full h-6 px-1 rounded"
            />
        ) : (
            <span className="truncate flex-1 pr-2">{calculator.title}</span>
        )}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-slate-500 hover:text-cyan-400 mr-1"
            aria-label={`Rename ${calculator.title}`}
        >
            <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(calculator.id);
          }}
          className="text-slate-500 hover:text-red-400"
          aria-label={`Delete ${calculator.title}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};


export const Sidebar = ({ isOpen, calculators, onAdd, onDelete, onSelect, onReorder, onUpdate, onExport, onImport }: SidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(file){
        onImport(file);
    }
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleDragSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        onReorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <aside className={`flex flex-col bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Calculators</h2>
          <button onClick={onAdd} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-1">
          {calculators.map((calc, index) => (
            <div
                key={calc.id}
                draggable
                onDragStart={() => dragItem.current = index}
                onDragEnter={() => dragOverItem.current = index}
                onDragEnd={handleDragSort}
                onDragOver={(e) => e.preventDefault()}
            >
                <SidebarItem calculator={calc} onDelete={onDelete} onSelect={onSelect} onUpdate={onUpdate}/>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-2">Data</h3>
        <div className="space-y-2">
            <button 
                onClick={onExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <DownloadIcon className="h-4 w-4"/>
                Backup Data
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileImport}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <UploadIcon className="h-4 w-4"/>
                Import Data
            </button>
        </div>
      </div>
    </aside>
  );
};
