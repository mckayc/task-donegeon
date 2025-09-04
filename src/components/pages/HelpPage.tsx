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


export const HelpPage: React.FC = () => {
    const { settings } = useSystemState();
    
    return (
        <div className="max-w-4xl mx-auto pb-12">
            <CollapsibleSection title="The Basics: Core Concepts" defaultOpen>
                <div className="prose prose-invert max-w-none text-stone-300 space-y-6 p-6">
                    <h3>Roles: Who's Who?</h3>
                    <p>Every member of your {settings.terminology.group} has a role that defines what they can do:</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>{settings.terminology.admin}:</strong> The game administrator. They can create and manage all users, {settings.terminology.tasks}, {settings.terminology.stores}, {settings.terminology.groups}, and settings. They have the ultimate authority.</li>
                        <li><strong>{settings.terminology.moderator}:</strong> A helper role. They can approve or reject {settings.terminology.task} completions, assisting the {settings.terminology.admin} in managing the game's day-to-day activity.</li>
                        <li><strong>{settings.terminology.user}:</strong> The standard player role. They complete {settings.terminology.tasks}, earn {settings.terminology.points}, and customize their character.</li>
                    </ul>
                    <h3>Personal vs. {settings.terminology.group} Mode</h3>
                    <p>The app has two primary contexts, which you can switch between using the dropdown in the header:</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Personal Mode:</strong> This is your individual space. {settings.terminology.tasks} you complete here add to your personal balances of currency and XP. You can spend this personal currency in personal {settings.terminology.stores}.<br/><em>Example: A personal {settings.terminology.task} might be "Read a chapter of a book" or "Practice piano for 30 minutes".</em></li>
                        <li><strong>{settings.terminology.group} Mode:</strong> When you switch to a {settings.terminology.group}, you'll see {settings.terminology.tasks} and {settings.terminology.stores} specific to that group. Rewards earned here go into your balance for that specific {settings.terminology.group}, creating a separate economy. This is perfect for family chores or group projects.<br/><em>Example: A {settings.terminology.group} {settings.terminology.task} might be "Help clean the kitchen after dinner" or "Rake the leaves in the yard".</em></li>
                    </ul>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Functional Specifications">
                <div className="prose prose-invert max-w-none text-stone-300 space-y-6 p-6">
                    <h3>Interactive Media</h3>
                    <p>
                        Certain {settings.terminology.tasks} can now include interactive elements to make them more engaging or educational.
                    </p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li>
                            <strong>AI Teacher:</strong> This turns a {settings.terminology.task} into a full-screen, interactive lesson. The AI gauges the user's knowledge with a pre-quiz, creates a personalized lesson using relatable examples from the user's profile, and confirms understanding with a final quiz. Passing this quiz is required to complete the {settings.terminology.task}.
                        </li>
                        <li>
                            <strong>AI Story Teller:</strong> This feature generates a unique, short story based on the {settings.terminology.task}'s title and description, turning a simple chore into a narrative adventure.
                        </li>
                        <li>
                            <strong>Video:</strong> Attach a video to a {settings.terminology.task}. You can use a URL from a service like YouTube or a video file uploaded to the Asset Manager. This is perfect for instructional videos or adding a multimedia element to a {settings.terminology.task}.
                        </li>
                    </ul>
                    <h3>The Arcade & Minigames</h3>
                    <p>The "Arcade" is a special {settings.terminology.store} where users can spend "Game Tokens" to play minigames.</p>
                     <ul className="list-disc list-inside space-y-2">
                        <li><strong>Dragon's Dice (Farkle):</strong> A classic dice game of risk and reward. Roll the dice and set aside scoring combinations. Bust, and you lose your points for the turn. Know when to stop and bank your score to reach the goal!
                            <ul className="list-disc list-inside pl-6 mt-2">
                                <li><strong>Bug Fix & UI Improvement:</strong> Fixed a bug where the game would sometimes fail to recognize a "bust," causing it to get stuck. When you bust now, a large, impactful "BUSTED!" message will appear to make the outcome clear.</li>
                            </ul>
                        </li>
                        <li><strong>Rune Breaker:</strong> A fantasy-themed version of the classic *Breakout*. Control a magical shield and bounce an orb to break rows of enchanted runes.</li>
                        <li><strong>Dungeon Dash:</strong> A simple side-scrolling "endless runner." An adventurer runs automatically, and the player taps to make them jump over pits and slide under obstacles.</li>
                        <li><strong>Forge Master:</strong> A rhythm and timing game. The player must click at the right moment to strike a piece of hot metal with a hammer to forge a powerful weapon.</li>
                        <li><strong>Archer's Folly:</strong> An archery game where the player clicks and drags to aim their bow, hitting a series of moving targets.</li>
                        <li><strong>Snake:</strong> The classic game of snake. The game now features a larger play area, a slower starting speed, and a "3, 2, 1, GO!" countdown. You can also press any arrow key on the "Game Over" screen to instantly start a new game.</li>
                    </ul>
                    <h4>Arcade Leaderboard</h4>
                    <p>The Arcade now features an "All-Time Arcade Legends" leaderboard. It shows the top 5 players based on their <strong>cumulative scores</strong> across <strong>all</strong> minigames. Additionally, each individual game card now proudly displays the name of the current high score holder for that game.</p>
                </div>
            </CollapsibleSection>
        </div>
    );
};