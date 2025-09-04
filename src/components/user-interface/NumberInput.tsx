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

  // Effect to sync the input value when the `value` prop changes from the parent
  // This is important for resets or external updates.
  useEffect(() => {
    // Only update if the numeric value is different, to avoid interrupting typing
    if (Number(inputValue) !== value) {
      setInputValue(String(value));
    }
  }, [value]);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const stopStepping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const handleStep = useCallback((direction: 'up' | 'down') => {
    // FIX: The onChange prop is a simple callback that expects a number, not a function like useState's setter.
    // This calculates the new value based on the current `value` prop and calls `onChange` correctly.
    const precision = String(step).split('.')[1]?.length || 0;
    const newValue = parseFloat((value + (direction === 'up' ? step : -step)).toFixed(precision));
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setInputValue(String(clampedValue)); // Keep local state in sync for immediate feedback
    onChange(clampedValue);
  }, [min, max, onChange, step, value]);

  const startStepping = useCallback((direction: 'up' | 'down') => {
    stopStepping();
    handleStep(direction);
    timeoutRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
            handleStep(direction);
        }, 50);
    }, 400);
  }, [handleStep, stopStepping]);

  useEffect(() => {
    return () => stopStepping();
  }, [stopStepping]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = e.target.value;
    setInputValue(stringValue);

    // Only allow numeric-like characters that are valid for parsing or are partial
    if (stringValue === '' || stringValue === '-' || /^-?\d*\.?\d*$/.test(stringValue)) {
        const numValue = parseFloat(stringValue);
        // Propagate change to parent if it's a valid number, or 0 if it's empty
        if (!isNaN(numValue)) {
            onChange(numValue);
        } else if (stringValue === '') {
            onChange(0); // This is the key fix to allow clearing.
        }
    }
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = 0; // Treat blank as zero instead of reverting. This is the other key fix.
    }
    const clamped = Math.max(min, Math.min(max, numValue));
    // Finalize the value in the parent state
    onChange(clamped);
    // And ensure the input visually reflects the final clamped value
    setInputValue(String(clamped));
  };
  
  const inputComponent = (
    <div className={cn("relative w-28", className)}>
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
