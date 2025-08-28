import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import Input from './Input';

interface NumberInputProps {
  label?: string;
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  id,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    // Sync from parent if value changes, but avoid doing so when the user is typing
    // a valid partial number (like "1.").
    const numInputValue = parseFloat(inputValue);
    if (numInputValue !== value && !(inputValue.endsWith('.') && numInputValue === value)) {
       setInputValue(String(value));
    }
  }, [value, inputValue]);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleValueChange = useCallback((newValue: number) => {
    const precision = String(step).split('.')[1]?.length || 0;
    const roundedValue = parseFloat(newValue.toFixed(precision));
    const clampedValue = Math.max(min, Math.min(max, roundedValue));
    if (clampedValue !== value) {
      onChange(clampedValue);
    }
  }, [min, max, onChange, step, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = e.target.value;
    setInputValue(stringValue);
    
    if (stringValue === '' || stringValue === '-') {
      onChange(min > 0 ? min : 0);
      return; 
    }

    const numValue = parseFloat(stringValue);
    if (!isNaN(numValue)) {
      onChange(numValue); // Allow parent to see intermediate value
    }
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = min > 0 ? min : 0;
    }
    const clamped = Math.max(min, Math.min(max, numValue));
    if (clamped !== value) {
      onChange(clamped);
    }
    setInputValue(String(clamped));
  };

  const handleStep = useCallback((direction: 'up' | 'down') => {
    const currentValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const precision = String(step).split('.')[1]?.length || 0;
    const newValue = parseFloat((currentValue + (direction === 'up' ? step : -step)).toFixed(precision));
    handleValueChange(newValue);
  }, [value, handleValueChange, step]);

  const stopStepping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startStepping = useCallback((direction: 'up' | 'down') => {
    handleStep(direction);
    timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
            handleStep(direction);
        }, 80);
    }, 400);
  }, [handleStep]);

  useEffect(() => {
    return () => stopStepping();
  }, [stopStepping]);
  
  const inputComponent = (
    <div className={cn("relative w-full", className)}>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="h-10 w-full rounded-md pr-16 text-sm no-spinner text-center"
        disabled={disabled}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center h-full">
        <button
          type="button"
          onMouseDown={() => startStepping('down')}
          onMouseUp={stopStepping} onMouseLeave={stopStepping}
          onTouchStart={(e) => { e.preventDefault(); startStepping('down'); }}
          onTouchEnd={stopStepping}
          disabled={disabled || value <= min}
          className="h-7 w-7 flex items-center justify-center rounded-l-md bg-stone-700 hover:bg-stone-600 text-stone-200 disabled:opacity-50"
          aria-label="Decrease value"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={() => startStepping('up')}
          onMouseUp={stopStepping} onMouseLeave={stopStepping}
          onTouchStart={(e) => { e.preventDefault(); startStepping('up'); }}
          onTouchEnd={stopStepping}
          disabled={disabled || value >= max}
          className="h-7 w-7 flex items-center justify-center rounded-r-md bg-stone-700 hover:bg-stone-600 text-stone-200 disabled:opacity-50"
          aria-label="Increase value"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (!label) {
    return inputComponent;
  }
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-300 mb-1">
        {label}
      </label>
      {inputComponent}
    </div>
  );
};

export default NumberInput;