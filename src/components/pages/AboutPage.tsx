import React, { useMemo, useState } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import { version } from '../../../package.json';
import Button from '../user-interface/Button';

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
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-6 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of November 3, 2025 (v0.4.28)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>The Arcade Expansion:</strong> Five new minigames have been added to the Arcade: Dragon's Dice (Farkle), Rune Breaker, Dungeon Dash, Forge Master, and Archer's Folly.</li>
                <li><strong>Arcade Leaderboard:</strong> A new "All-Time Arcade Legends" leaderboard now appears in the Arcade, showing the top players based on cumulative scores across all games.</li>
                <li><strong>High Score Display:</strong> Each minigame card now displays the name of the current global high score holder.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 27, 2025 (v0.4.27)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Snake Minigame Overhaul:</strong> The Snake minigame in the Arcade has been significantly improved for better playability. The game window is now larger, the initial speed is slower, a "3, 2, 1, GO!" countdown has been added, and players can now restart the game by pressing any arrow key on the "Game Over" screen.</li>
                <li><strong>Global Condition Fix:</strong> Resolved a critical logic bug where a quest that was part of a quest group used in a *globally applied* condition set would lock itself, making it impossible to complete. The global condition check now correctly excludes the quest being evaluated from its own group's completion requirements.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 20, 2025 (v0.4.25)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Conditional Market Unlocks:</strong> Locked markets now show a dialog detailing the specific conditions a user must meet to gain access, mirroring the functionality of locked quests.</li>
                <li><strong>Global Conditions:</strong> Introduced "Global" condition sets that can lock content across the entire application, providing a new layer of administrative control.</li>
                <li><strong>Circular Dependency Fix:</strong> Resolved a critical logic bug where a quest could be locked by a condition requiring the completion of its own quest group. The system now intelligently ignores the quest being checked when evaluating its group's completion status.</li>
                <li><strong>Refactored Logic:</strong> Refactored the internal condition checking logic to be more robust and consistent between quests and markets.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 13, 2025 (v0.4.05 - v0.4.24)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Build Stability Fixes:</strong> Resolved a recurring TypeScript JSX error in the help guide that was causing build failures.</li>
                <li><strong>Enhanced AI Teacher:</strong> The AI Teacher is now a more effective and engaging tutor with personalized content, better question handling, and lesson summaries.</li>
                <li><strong>Revamped Kiosk Mode:</strong> Kiosk Mode has been completely re-engineered to be a persistent, device-specific setting activated by admins.</li>
                <li><strong>Flexible Manual Adjustments:</strong> Overhauled the "Manual Adjustment" dialog for more flexibility in awarding rewards and trophies, including 16 new birthday trophies.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">Week of October 6, 2025 (v0.3.01 - v0.4.04)</h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>AI Teacher Launch:</strong> Developed and launched the full AI Teacher feature, moving from a backend foundation to a full-screen UI with an interactive "Teach, Check, Feedback" loop and robust tool-calling for quizzes.</li>
                <li><strong>UI & UX Improvements:</strong> Fixed issues with AI Teacher button responsiveness and made minor improvements to Kiosk Mode and item approval defaults.</li>
            </ul>
        </div>
    </div>
);


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
                <li><strong>User-Created Content:</strong> A system allowing Explorers to design their own quests and items, then submit them to admins for approval. This fosters creativity and allows the game world to be co-created by its members.</li>
                <li><strong>Reward Rework:</strong> Overhaul the reward system to allow for more complex and interesting rewards, such as items that grant temporary bonuses or unlock special abilities.</li>
            </ul>
        </div>
    </div>
);

export const AboutPage: React.FC = () => {
    const { settings } = useSystemState();
    
    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Card className="text-center">
                <h1 className="text-5xl font-medieval text-accent mb-2">{settings.terminology.appName}</h1>
                <p className="text-stone-300 text-lg">A gamified task and chore tracker for families and groups.</p>
                <p className="mt-4 text-stone-400">Version: {version}</p>
                 <div className="mt-6">
                    <a href="https://github.com/google/codewithme-task-donegeon" target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary">
                            View Project on GitHub
                        </Button>
                    </a>
                </div>
            </Card>

            <CollapsibleSection title="Roadmap" defaultOpen>
                <RoadmapContent />
            </CollapsibleSection>
            
            <CollapsibleSection title="Appendix: Version History">
                <VersionHistoryContent />
            </CollapsibleSection>
        </div>
    );
};
