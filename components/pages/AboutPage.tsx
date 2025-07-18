
import React, { useState, useEffect, ReactNode } from 'react';
import Card from '../ui/Card';
import { useSettingsState } from '../../context/AppContext';
import { ChevronDownIcon } from '../ui/Icons';

interface Metadata {
  name: string;
  version: string;
  description: string;
  lastChange: string;
  lastChangeDate?: string;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-stone-800/50 border border-stone-700/60 rounded-xl shadow-lg mt-8" style={{ backgroundColor: 'hsl(var(--color-bg-secondary))', borderColor: 'hsl(var(--color-border))' }}>
            <button
                className="w-full flex justify-between items-center text-left px-6 py-4 hover:bg-stone-700/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h3 className="text-2xl font-medieval text-accent">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const RoadmapContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-6">
        <p className="text-sm">Here is the planned development path for Task Donegeon, prioritized for the most impactful features first.</p>
        
        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 1: Foundational Features &amp; Quality of Life</h4>
            <p className="text-xs text-stone-400">This phase focuses on high-impact improvements for admins and players that enhance the core experience.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Backend Authentication:</strong> Implement JWT-based authentication to secure all backend API endpoints.</li>
                <li><strong>Enhanced Security:</strong> A comprehensive security audit and implementation of best practices like strict input validation, Content Security Policy (CSP), and secure headers.</li>
                <li><strong>Quest Bundles:</strong> Group quests into "Quest Chains" or "Storylines." This allows admins to create multi-step adventures.</li>
                <li><strong>Showcase Page:</strong> A public profile page for each explorer to showcase their avatar, earned trophies, and key stats.</li>
                <li><strong>Advanced Object Manager:</strong> Implement bulk editing, quick duplication, and powerful filtering/sorting for all game objects.</li>
                <li><strong>Improved Progress Page:</strong> A more detailed summary of user activity, highlighting strengths and areas for improvement with visual charts.</li>
            </ul>
        </div>

        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 2: Core Gameplay &amp; Personalization</h4>
            <p className="text-xs text-stone-400">This phase introduces major new creative outlets and systems for deeper engagement.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Theme Creator:</strong> An admin tool to create and edit custom visual themes (colors, fonts, etc.) that can be sold in a market.</li>
                <li><strong>User-Created Content:</strong> A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.</li>
                <li><strong>Reward Rarity &amp; Limits:</strong> Ability to specify how many times a reward can be claimed, and its rarity.</li>
            </ul>
        </div>
    </div>
);

const AboutPage: React.FC = () => {
    const { settings } = useSettingsState();
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch('/api/metadata');
                if (response.ok) {
                    const data = await response.json();
                    setMetadata(data);
                }
            } catch (error) {
                console.error("Failed to fetch metadata", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <div className="text-center">
                    <h1 className="text-4xl font-medieval text-accent">{settings.terminology.appName}</h1>
                    {isLoading ? (
                        <p className="text-stone-400 mt-2">Loading version info...</p>
                    ) : metadata ? (
                        <>
                            <p className="text-stone-300 font-semibold mt-2">Version {metadata.version}</p>
                            <p className="text-sm text-stone-500">Last updated: {metadata.lastChangeDate ? new Date(metadata.lastChangeDate).toLocaleString() : 'N/A'}</p>
                        </>
                    ) : (
                        <p className="text-stone-400 mt-2">Could not load version information.</p>
                    )}
                </div>
                <p className="mt-6 text-lg text-stone-300 text-center">{metadata?.description || "A gamified task manager to make productivity fun."}</p>
            </Card>

            <CollapsibleSection title="Roadmap & Future Features" defaultOpen>
                <RoadmapContent />
            </CollapsibleSection>
        </div>
    );
};

export default AboutPage;
