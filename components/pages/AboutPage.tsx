

import React, { useState, useEffect, ReactNode } from 'react';
import Card from '../ui/Card';
import { useSettings } from '../../context/SettingsContext';
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
                <li><strong>Reward Rarity &amp; Limits:</strong> Ability to specify how many of a certain reward can be claimed, creating rare or one-of-a-kind items.</li>
                <li><strong>Automated Quest Rotation:</strong> A system for automatically rotating daily or weekly duties among guild members to ensure fair distribution of chores.</li>
            </ul>
        </div>
        
        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 3: Advanced Systems &amp; World Expansion</h4>
            <p className="text-xs text-stone-400">This phase includes the big, game-changing features that add new dimensions to the world.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Game Map:</strong> A visual map with unlockable locations. Traveling to a location could unlock new quests or markets.</li>
                <li><strong>Explorer Markets:</strong> Allow explorers to open their own markets to sell items or services to other players, creating a player-driven economy.</li>
                <li><strong>Advanced Reporting:</strong> A dedicated reporting dashboard for admins to track user engagement, economic flow, and quest completion rates.</li>
            </ul>
        </div>

        <div>
            <h4 className="text-xl font-bold text-stone-100 font-medieval">Phase 4: Platform Maturity &amp; Polish</h4>
            <p className="text-xs text-stone-400">This phase focuses on long-term stability, accessibility, and preparing the app for a wider audience.</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Real-time Notifications:</strong> Use WebSockets for instant updates on approvals, purchases, and guild activity.</li>
                <li><strong>Accessibility (A11Y) Audit:</strong> A full review to ensure the application is usable by people with disabilities.</li>
                <li><strong>Mobile App / PWA:</strong> Package the application as a Progressive Web App (PWA) for a native-like experience on mobile devices.</li>
            </ul>
        </div>
    </div>
);


const AboutPage: React.FC = () => {
    const { settings } = useSettings();
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const GITHUB_URL = 'https://github.com/mckayc/task-donegeon';

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch('/api/metadata');
                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Failed to fetch application details: ${errorBody}`);
                }
                const data: Metadata = await response.json();
                setMetadata(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                setError(message);
                console.error("Error fetching metadata:", err);
            }
        };

        fetchMetadata();
    }, []);

    const renderContent = () => {
        if (error) {
            return <p className="text-red-400">Could not load application details: {error}</p>;
        }
        if (!metadata) {
            return <p>Loading application details...</p>;
        }
        return (
            <div className="space-y-6 text-stone-300 leading-relaxed">
                <p>{metadata.description}</p>
                 <p>This version introduces a fullscreen toggle button in the header, perfect for an immersive experience on tablets. It also includes fixes for item import IDs and shared calendar quest visibility.</p>
                
                <div className="pt-4 border-t border-stone-700/60 text-sm">
                    <p><strong>Version:</strong> {metadata.version}</p>
                    {metadata.lastChangeDate && (
                        <p><strong>Last Updated:</strong> {new Date(metadata.lastChangeDate).toLocaleString()}</p>
                    )}
                </div>
                 <div className="pt-4 border-t border-stone-700/60 text-sm">
                    <h3 className="text-lg font-semibold text-stone-100 mb-2">Latest Changes</h3>
                    <p>{metadata.lastChange}</p>
                </div>

                <div className="pt-4 border-t border-stone-700/60">
                    <h3 className="text-lg font-semibold text-stone-100 mb-2">Contribute or Report Issues</h3>
                    <p>
                        This project is open source. You can view the code, suggest features, or report bugs on our GitHub repository.
                    </p>
                    <a 
                        href={GITHUB_URL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-emerald-400 hover:text-emerald-300 font-bold underline"
                    >
                        Visit GitHub Repository &rarr;
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Card>
                {renderContent()}
            </Card>
            <CollapsibleSection title="Roadmap" defaultOpen>
                <RoadmapContent />
            </CollapsibleSection>
        </div>
    );
};

export default AboutPage;