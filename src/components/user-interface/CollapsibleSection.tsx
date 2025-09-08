import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface CollapsibleSectionProps {
    id: string;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ id, title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div id={id} className="border-t border-stone-700/60 first:border-t-0">
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`section-content-${id}`}
            >
                <h3 className="text-2xl font-medieval text-accent">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div 
                    id={`section-content-${id}`}
                    className="pb-6"
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
