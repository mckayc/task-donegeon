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
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
    const numInputValue = parseFloat(inputValue);
    if (numInputValue !== value && !(inputValue.endsWith('.') && numInputValue === value)) {
       setInputValue(String(value));
    }
  }, [value, inputValue]);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const stopStepping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const handleStep = useCallback((direction: 'up' | 'down') => {
    const currentValue = valueRef.current;
    const precision = String(step).split('.')[1]?.length || 0;
    const newValue = parseFloat((currentValue + (direction === 'up' ? step : -step)).toFixed(precision));
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  }, [min, max, onChange, step]);

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
    
    if (stringValue === '' || stringValue === '-') {
      onChange(min > 0 ? min : 0);
      return; 
    }

    const numValue = parseFloat(stringValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      numValue = min > 0 ? min : 0;
    }
    const clamped = Math.max(min, Math.min(max, numValue));
    onChange(clamped);
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