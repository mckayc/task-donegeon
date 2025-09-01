import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Calculator, WindowState } from '../types';
import { CloseIcon, ScienceIcon, PencilIcon } from './Icons';
import { performConversion } from '../utils/conversions';

interface CalculatorWindowProps {
  calculator: Calculator;
  windowState: WindowState;
  onUpdateCalculator: (id: string, updates: Partial<Calculator>) => void;
  onUpdateWindowState: (id: string, updates: Partial<WindowState>) => void;
  onBringToFront: (id: string) => void;
  onClose: (id: string) => void;
  onToggleScientific: (id: string) => void;
  onUndo: () => void;
}

const evaluateExpression = (expr: string): number | string => {
  const trimmedExpr = expr?.trim();
  if (!trimmedExpr) return '';

  try {
    // Using `with(Math)` is deprecated and causes issues in strict mode.
    // We will explicitly prefix Math functions and constants to ensure correct evaluation.
    const cleanExpr = trimmedExpr
      .replace(/÷/g, '/')
      .replace(/×/g, '*')
      .replace(/\^/g, '**')
      .replace(/(\d*\.?\d+)%/g, '($1/100)')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/\b(sin|cos|tan|log)\b/g, 'Math.$1')
      .replace(/\b(pi|π)\b/gi, 'Math.PI')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/gi, 'Math.E');

    const result = new Function('return ' + cleanExpr)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return 'Error';
    }
    return Number(result.toPrecision(15));
  } catch (error) {
    console.error("Calculation Error:", error);
    return 'Error';
  }
};

const getLastResult = (history: string): string | null => {
    const lines = history.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.includes('------- Values Reset --------')) {
            return '0';
        }
        if (line.startsWith('=')) {
            const result = line.replace('=', '').trim().split(' ')[0]; // Handle results with units like '= 5 EUR'
            if (result && !isNaN(parseFloat(result))) {
                return result;
            }
        }
    }
    return '0';
};

export const CalculatorWindow = ({ 
  calculator, 
  windowState, 
  onUpdateCalculator, 
  onUpdateWindowState,
  onBringToFront,
  onClose,
  onToggleScientific,
  onUndo
}: CalculatorWindowProps) => {

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  
  const historyDisplayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(calculator.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState('');

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    onBringToFront(calculator.id);
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - windowState.x,
      y: e.clientY - windowState.y,
    };
  }, [calculator.id, onBringToFront, windowState.x, windowState.y]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onBringToFront(calculator.id);
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { width: windowState.width, height: windowState.height };
  }, [calculator.id, onBringToFront, windowState.width, windowState.height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onUpdateWindowState(calculator.id, {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }
    if (isResizing) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      onUpdateWindowState(calculator.id, {
        width: Math.max(300, resizeStartSize.current.width + dx),
        height: Math.max(400, resizeStartSize.current.height + dy),
      });
    }
  }, [isDragging, isResizing, calculator.id, onUpdateWindowState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);
  
    useEffect(() => {
        if (historyDisplayRef.current) {
            historyDisplayRef.current.scrollTop = historyDisplayRef.current.scrollHeight;
        }
    }, [calculator.history]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if(titleValue.trim()){
        onUpdateCalculator(calculator.id, { title: titleValue });
    } else {
        setTitleValue(calculator.title);
    }
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleBlur();
    if (e.key === 'Escape') {
      setTitleValue(calculator.title);
      setIsEditingTitle(false);
    }
  };
  
  const handleCalculate = useCallback(() => {
    const trimmedInput = input.trim();

    // First, try to perform a conversion
    const conversionResult = performConversion(trimmedInput);
    if (conversionResult) {
        onUpdateCalculator(calculator.id, { history: `${calculator.history}${trimmedInput}\n= ${conversionResult}\n` });
        setInput('');
        return;
    }
    
    if (!trimmedInput) {
        const historyLines = calculator.history.trim().split('\n');
        const lastLine = historyLines[historyLines.length - 1] || '';
        if (lastLine.trim().startsWith('=') || lastLine.trim() === '' || lastLine.includes('------- Values Reset --------')) {
            onUpdateCalculator(calculator.id, { history: calculator.history + '#------- Values Reset --------\n' });
        } else {
            onUpdateCalculator(calculator.id, { history: calculator.history + '\n' });
        }
        setInput('');
        return;
    }

    if (trimmedInput.startsWith('#')) {
        onUpdateCalculator(calculator.id, { history: `${calculator.history}${trimmedInput}\n` });
        setInput('');
        return;
    }

    let expressionToEvaluate = trimmedInput;
    const isOperatorFirst = ['+', '-', '*', '÷', '/', '^'].includes(trimmedInput.charAt(0));
    if (isOperatorFirst) {
        const prevResult = getLastResult(calculator.history);
        if (prevResult) {
            expressionToEvaluate = prevResult + trimmedInput;
        }
    }
    
    const result = evaluateExpression(expressionToEvaluate);
    onUpdateCalculator(calculator.id, { history: `${calculator.history}${expressionToEvaluate}\n= ${result}\n` });
    setInput('');

  }, [input, calculator.history, calculator.id, onUpdateCalculator]);

  const handleNoteButtonClick = () => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
        const note = trimmedInput.startsWith('#') ? trimmedInput : `# ${trimmedInput}`;
        onUpdateCalculator(calculator.id, { history: `${calculator.history}${note}\n` });
        setInput('');
    } else {
        setInput('# ');
    }
    inputRef.current?.focus();
  };

  const handleButtonClick = (btn: string) => {
      switch(btn) {
          case 'C': setInput(''); break;
          case '⌫': setInput(prev => prev.slice(0, -1)); break;
          case '=': handleCalculate(); break;
          case '↶': onUndo(); break;
          case 'sin': case 'cos': case 'tan': case 'log': case '√': setInput(p => p + `${btn}(`); break;
          default: setInput(prev => prev + btn);
      }
      inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleCalculate();
      }
      if (e.key === 'Escape') {
          onClose(calculator.id);
      }
  };

  const baseButtons = [
      'C', '⌫', '↶', '÷',
      '7', '8', '9', '*',
      '4', '5', '6', '-',
      '1', '2', '3', '+',
      '0', '.', '%', '='
  ];
  
  const scientificButtons = [
      'sin', 'cos', 'tan', 'log',
      '(', ')', '^', 'π',
      '√', 'e', 
  ];

  const renderButton = (btn: string) => (
    <button 
        key={btn}
        onClick={() => handleButtonClick(btn)}
        className={`
            h-11 text-lg rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-cyan-500 select-none
            ${['÷', '*', '-', '+', '=', '^'].includes(btn) ? 'bg-cyan-500 hover:bg-cyan-400 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}
            ${['C', '⌫'].includes(btn) ? 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-red-500 dark:text-red-400' : ''}
            ${['sin', 'cos', 'tan', 'log', '√', 'π', 'e', '(', ')', '↶', '%'].includes(btn) ? 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500' : ''}
        `}
    >{btn}</button>
  );

  return (
    <div
      className="calculator-window absolute bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl flex flex-col"
      data-id={calculator.id}
      style={{
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: `${windowState.height}px`,
        zIndex: windowState.zIndex,
      }}
      onMouseDown={() => onBringToFront(calculator.id)}
    >
      <div 
        className="h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-t-lg flex items-center justify-between px-3 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <button onClick={() => onToggleScientific(calculator.id)} className={`p-1 rounded-full ${windowState.isScientific ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-500'} hover:bg-slate-300 dark:hover:bg-slate-600 mr-2`} aria-label="Toggle Scientific Mode">
            <ScienceIcon className="h-4 w-4" />
        </button>
        {isEditingTitle ? (
             <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white w-full h-6 px-1 rounded"
              />
        ) : (
            <span onDoubleClick={() => setIsEditingTitle(true)} className="font-bold truncate">
                {calculator.title}
            </span>
        )}
        <button onClick={() => onClose(calculator.id)} className="p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 ml-2">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-2 overflow-hidden">
         <div 
            ref={historyDisplayRef} 
            className="flex-1 w-full bg-slate-100/70 dark:bg-slate-900/70 p-3 rounded-md text-slate-700 dark:text-slate-200 font-mono text-lg overflow-y-auto mb-2"
        >
            {calculator.history.split('\n').map((line, index) => {
                const isResult = line.trim().startsWith('=');
                const isNote = line.trim().startsWith('#');
                const isResetMessage = isNote && line.includes('------- Values Reset --------');
                return (
                    <p key={index} className={`whitespace-pre-wrap break-words min-h-[1.75rem] ${isResult ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''} ${isNote ? 'text-slate-500 dark:text-slate-400 italic' : ''} ${isResetMessage ? 'text-center' : ''}`}>
                        {line}
                    </p>
                );
            })}
        </div>
        <div className="flex items-center mb-2">
             <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="w-full bg-slate-100 dark:bg-slate-900 h-10 px-3 rounded-l-md text-cyan-600 dark:text-cyan-300 font-mono text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Calc, #note, or '10ft in cm'..."
                autoFocus
            />
            <button
                onClick={handleNoteButtonClick}
                className="h-10 px-3 bg-slate-300 dark:bg-slate-600 rounded-r-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Add as note"
                title="Add as note"
            >
                <PencilIcon className="h-5 w-5" />
            </button>
        </div>
        <div className="mt-auto">
            {windowState.isScientific && (
              <div className="grid grid-cols-5 gap-2 mb-2">
                {scientificButtons.slice(0, 10).map(renderButton)}
              </div>
            )}
            <div className={`grid grid-cols-4 gap-2`}>
                {baseButtons.map(renderButton)}
            </div>
        </div>
      </div>

      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
        style={{
            borderBottom: '2px solid currentColor',
            borderRight: '2px solid currentColor',
            borderBottomRightRadius: '6px',
            opacity: 0.5,
        }}
      />
    </div>
  );
};
