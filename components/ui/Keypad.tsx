import React from 'react';
import { Button } from '@/components/ui/Button';

interface KeypadProps {
    onKeyPress: (key: string) => void;
    onBackspace: () => void;
    onEnter: () => void;
    className?: string;
}

const KeyButton: React.FC<{ children: React.ReactNode; onClick: () => void; primary?: boolean }> = ({ children, onClick, primary }) => {
    return (
        <Button
            type="button"
            variant={primary ? "default" : "secondary"}
            onClick={onClick}
            className="h-12 text-xl font-bold"
        >
            {children}
        </Button>
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