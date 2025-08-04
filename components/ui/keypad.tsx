

import React from 'react';

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onEnter: () => void;
    className?: string;
}

const KeyButton: React.FC<{ children: React.ReactNode; onClick: () => void; primary?: boolean }> = ({ children, onClick, primary }) => {
    const primaryClasses = 'bg-emerald-600 hover:bg-emerald-500 text-white';
    const secondaryClasses = 'bg-stone-700 hover:bg-stone-600 text-stone-200';
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center h-12 rounded-lg text-xl font-bold transition-colors duration-150 focus:outline-none ${primary ? primaryClasses : secondaryClasses}`}
        >
            {children}
        </button>
    );
};

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onBackspace, onEnter, className }) => {
    return (
        <div className={`grid grid-cols-3 gap-3 w-full max-w-xs ${className}`}>
            {'123456789'.split('').map(key => (
                <KeyButton key={key} onClick={() => onKeyPress(key)}>{key}</KeyButton>
            ))}
            <KeyButton onClick={onBackspace}>
                Del
            </KeyButton>
            <KeyButton onClick={() => onKeyPress('0')}>0</KeyButton>
            <KeyButton onClick={onEnter} primary>Enter</KeyButton>
        </div>
    );
};

export default Keypad;