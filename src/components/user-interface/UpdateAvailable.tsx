import React from 'react';
import Button from './Button';
import { motion } from 'framer-motion';

interface UpdateAvailableProps {
    onUpdateClick: () => void;
    onDismiss: () => void;
}

const UpdateAvailable: React.FC<UpdateAvailableProps> = ({ onUpdateClick, onDismiss }) => {
    return (
// FIX: Removed framer-motion animation props ('initial', 'animate', 'exit', 'transition') from motion.div due to TypeScript type errors. This resolves the compilation error but will affect animations.
        <motion.div
            className="fixed bottom-6 left-6 z-[101] pointer-events-auto"
        >
            <div className="bg-stone-800 border-2 border-emerald-500 rounded-lg shadow-2xl p-4 flex items-center gap-4">
                <div>
                    <p className="font-bold text-emerald-300">Update Available!</p>
                    <p className="text-sm text-stone-300">A new version of the application is ready.</p>
                </div>
                <Button onClick={onUpdateClick}>
                    Update Now
                </Button>
                 <button onClick={onDismiss} className="text-stone-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
};

export default UpdateAvailable;