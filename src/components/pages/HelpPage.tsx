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
                    <p>The Arcade now features an "All-Time Arcade Legends" leaderboard. It shows the top 5 players based on their <strong>cumulative scores</strong> across <strong>all</strong> minigames. Additionally, each individual game card now proudly displays the name of the current high score holder for that specific game.</p>
                    <h3>Condition Sets</h3>
                    <p><strong>Purpose:</strong> To create reusable sets of rules that can control the availability of {settings.terminology.tasks} and {settings.terminology.stores}. This allows for dynamic content that unlocks based on a player's progress or other game state factors.</p>
                    <p><strong>How it Works:</strong></p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Create a Set:</strong> In `{settings.terminology.link_settings} &gt; {settings.terminology.link_manage_condition_sets}`, an {settings.terminology.admin} can create a new Condition Set. Each set has a name, a description, and a logic type (`ALL` or `ANY`).</li>
                        <li><strong>Add Conditions:</strong> Within a set, you can add one or more conditions. The new condition types include:
                            <ul className="list-disc list-inside pl-6 mt-2">
                                <li><strong>Minimum {settings.terminology.level}:</strong> Requires the player to have reached a certain {settings.terminology.level}.</li>
                                <li><strong>Day of Week:</strong> Active only on selected days.</li>
                                <li><strong>Date Range:</strong> Active only between a start and end date.</li>
                                <li><strong>Time of Day:</strong> Active only between a start and end time (e.g., 9 AM to 5 PM).</li>
                                <li><strong>{settings.terminology.task} Completed:</strong> Checks if a player has an <strong>approved</strong> completion for a specific {settings.terminology.task}.</li>
                                <li><strong>{settings.terminology.group} of {settings.terminology.tasks} Completed:</strong> Checks if a player has an <strong>approved</strong> completion for <strong>every</strong> available {settings.terminology.task} within a specified Quest Group. The system is smart enough to ignore the {settings.terminology.task} being checked (if it's part of the group) to prevent impossible deadlocks.</li>
                                <li><strong>{settings.terminology.award} Awarded:</strong> Checks if a player has earned a specific {settings.terminology.award}.</li>
                                <li><strong>User Has/Doesn't Have Item:</strong> Checks a player's inventory for the presence or absence of a specific item.</li>
                                <li><strong>User is Member of {settings.terminology.group}:</strong> Checks if the player is a member of a specific {settings.terminology.group}.</li>
                                <li><strong>User Has Role:</strong> Restricts access to players with a specific role ({settings.terminology.admin}, {settings.terminology.moderator}, or {settings.terminology.user}).</li>
                            </ul>
                        </li>
                        <li><strong>Apply the Set:</strong>
                            <ul className="list-disc list-inside pl-6 mt-2">
                                <li><strong>For {settings.terminology.stores}:</strong> In the `Manage {settings.terminology.stores}` dialog, set the Status to "Conditional" and select one or more Condition Sets.</li>
                                <li><strong>For {settings.terminology.tasks}:</strong> In the `Manage {settings.terminology.tasks}` dialog, a new "Availability Conditions" section allows you to enable conditions and select one or more Condition Sets.</li>
                            </ul>
                        </li>
                        <li><strong>User-Specific &amp; Global Sets:</strong> In the "Edit Condition Set" dialog, you can limit the set to only apply to specific users. You can also mark a set as <strong>"Global"</strong>, which forces it to apply to <strong>all</strong> {settings.terminology.tasks} and {settings.terminology.stores}, creating a sitewide rule.</li>
                    </ol>
                    <h4>Exempted Assets for Global Sets</h4>
                    <p>When a set is marked as "Global," a new section called <strong>"Exempted Assets"</strong> appears. This allows you to specify certain {settings.terminology.tasks} or {settings.terminology.stores} that should <em>ignore</em> this global rule.</p>
                    <p><strong>Automatic Exemptions:</strong> To prevent impossible situations (deadlocks), the system automatically adds quests to the exemption list if they are used as part of a condition within that same global set. For example:</p>
                    <ul className="list-disc list-inside pl-6 mt-2">
                       <li>If you add a "{`Quest Completed`}" condition, that specific {settings.terminology.task} is automatically exempted.</li>
                       <li>If you add a "{`Quest Group Completed`}" condition, <strong>all</strong> {settings.terminology.tasks} within that group are automatically exempted.</li>
                    </ul>
                    <p>You can manually add more exemptions for any other {settings.terminology.tasks} or {settings.terminology.stores} as needed.</p>
                    <h4>Player Experience: The Lock Icon 🔒</h4>
                    <p>When a {settings.terminology.task} or {settings.terminology.store} is unavailable due to unmet conditions, it will be visible but will display a lock icon (🔒). Clicking this icon opens a new dialog that clearly lists all the required conditions and shows the player's current status for each one with a checkmark (✅) or a cross (❌). This provides immediate, clear feedback on what they need to do to unlock the content.</p>
                    <h3>AI Teacher</h3>
                    <p><strong>Purpose:</strong> An interactive, AI-powered tutor that provides lessons on the topic of a specific {settings.terminology.task}.</p>
                    <p><strong>How it Works:</strong></p>
                    <ol className="list-decimal list-inside space-y-2">
                        <li><strong>Activation:</strong> An {settings.terminology.admin} can set the "Interactive Media" type of a {settings.terminology.task} to "AI Teacher". This adds an "AI Teacher" button to the {settings.terminology.task} detail dialog for players.</li>
                        <li><strong>Baseline Assessment:</strong> When a session begins, the AI generates a short, 3-5 question multiple-choice quiz based on the {settings.terminology.task}'s topic to assess the user's existing knowledge. All questions include an <strong>"I don't know"</strong> option so the user never feels forced to guess.</li>
                        <li><strong>Instant Feedback:</strong> The user answers the questions one by one and receives immediate feedback.</li>
                        <li><strong>Adaptive Learning Path:</strong> Once the quiz is complete, the results are sent to the AI. The AI analyzes these results to identify the user's weakest area and creates a personalized lesson plan that focuses on that specific topic.</li>
                        <li>
                            <strong>Personalized & Interactive Teaching:</strong> The AI begins a tailored lesson using a "Teach, Check, Feedback" loop.
                            <ul className="list-disc list-inside pl-6 mt-2">
                                <li><strong>Personalization:</strong> The AI now leverages the user's "About Me" profile and private "Admin Notes" to create relatable analogies and examples, making the content more engaging.</li>
                                <li><strong>Socratic Method:</strong> Users can ask questions at any time. The AI will pause its lesson, answer the user's question, and then seamlessly resume teaching.</li>
                            </ul>
                        </li>
                        <li><strong>Final Quiz & Summary:</strong> After the lesson (and any optional timer set by the {settings.terminology.admin}), the user takes a final quiz. Upon passing, the "Complete {settings.terminology.task}" button is enabled, and the AI provides a concise, bulleted summary of the key takeaways to reinforce what was learned.</li>
                    </ol>
                    <h3>Manual Adjustments</h3>
                    <p><strong>Purpose:</strong> To give an {settings.terminology.admin} a flexible way to manually grant {settings.terminology.points} or award {settings.terminology.awards} for actions that happen outside the formal {settings.terminology.task} system.</p>
                    <p><strong>How it Works:</strong></p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li>From the `{settings.terminology.link_manage_users}` page, an {settings.terminology.admin} can click the "Adjust" button for any {settings.terminology.user}.</li>
                        <li>This opens a unified dialog where the {settings.terminology.admin} can perform multiple actions at once.</li>
                        <li><strong>Grant Rewards:</strong> Add any amount of any {settings.terminology.currency} or {settings.terminology.xp} type.</li>
                        <li><strong>Apply Setbacks:</strong> Deduct any amount of any {settings.terminology.currency} or {settings.terminology.xp} type.</li>
                        <li><strong>Award Trophy:</strong> Select and award any manually-awarded {settings.terminology.award}.</li>
                        <li>All actions are logged in the `{settings.terminology.history}` as a single, consolidated "Manual Adjustment" event for clarity.</li>
                    </ul>
                    <h4>New Birthday Trophies</h4>
                    <p>A set of 16 new, manually-awarded trophies have been added to celebrate user birthdays for ages 5 through 20. These can be awarded using the Manual Adjustment dialog.</p>
                    <h3>Shared / Kiosk Mode (Device-Specific)</h3>
                    <p><strong>Purpose:</strong> To create a persistent, shared access point for the application on a specific device, like a family tablet. This mode provides a fast user-switching interface and can automatically log users out after a period of inactivity.</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><strong>Global Prerequisite:</strong> An {settings.terminology.admin} must first enable the main <strong>"Shared Mode"</strong> feature in `{settings.terminology.link_settings} &gt; Shared / Kiosk Mode`. This makes the device-specific functionality available.</li>
                        <li>
                            <strong>Device Activation:</strong>
                            <ol className="list-decimal list-inside pl-6">
                                <li>An {settings.terminology.admin} logs into the application on the device they want to turn into a kiosk (e.g., the living room tablet).</li>
                                <li>They click their profile avatar in the header to open the dropdown menu.</li>
                                <li>A new toggle switch, <strong>"Kiosk Mode (This Device)"</strong>, will be visible.</li>
                                <li>The {settings.terminology.admin} flips this switch to <strong>ON</strong>. The page will reload.</li>
                            </ol>
                        </li>
                        <li><strong>Persistent Kiosk State:</strong> Once activated, that device is now a dedicated Kiosk. It will <strong>always</strong> start on the shared user selection screen, even if the browser is closed or the device is restarted. This setting is saved locally in the browser's storage.</li>
                        <li>
                            <strong>Using the Kiosk:</strong>
                            <ul className="list-disc list-inside pl-6">
                                <li>When a user logs in on the Kiosk device, a new <strong>"Kiosk" button</strong> appears in the header.</li>
                                <li>Clicking this "Kiosk" button is the primary way to log out. It immediately returns the device to the shared user selection screen for the next person.</li>
                                <li>The automatic inactivity timer (if configured in `{settings.terminology.link_settings}`) will also correctly log users out and return to this screen.</li>
                            </ul>
                        </li>
                        <li><strong>Deactivation:</strong> To turn Kiosk Mode off, an {settings.terminology.admin} must log in on that specific device, open their profile dropdown, and toggle the <strong>"Kiosk Mode (This Device)"</strong> switch to <strong>OFF</strong>.</li>
                    </ul>
                </div>
            </CollapsibleSection>
        </div>
    );
};

export default HelpPage;
