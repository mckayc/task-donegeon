
import React, { useState, ReactNode } from 'react';
import Card from '../ui/Card';
import { ChevronDownIcon } from '../ui/Icons';

interface HelpSectionProps {
  title: string;
  children: ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-stone-700/60 last:border-b-0">
            <button
                className="w-full flex justify-between items-center text-left py-4 px-6 hover:bg-stone-700/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <h3 className="text-xl font-semibold text-stone-200">{title}</h3>
                <ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 text-stone-300 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
}

const HelpPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">Task Donegeon Guide</h1>
            <Card className="p-0 overflow-hidden">
                <HelpSection title="Introduction: What is Task Donegeon?">
                    <p className="leading-relaxed">Welcome to Task Donegeon! This app transforms everyday tasks, chores, and goals into a fun, medieval-themed role-playing game (RPG). Instead of just checking off a to-do list, you'll complete quests, earn virtual currency and experience points (XP), unlock trophies, and level up your adventurer. It's designed to make productivity more engaging for families, groups, or even individuals.</p>
                </HelpSection>

                <HelpSection title="Core Concepts">
                    <h4 className="text-lg font-bold text-stone-100">Roles</h4>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Donegeon Master:</strong> The game administrator. They can create and manage users, quests, markets, guilds, and all game settings. They have the ultimate authority.</li>
                        <li><strong>Gatekeeper:</strong> A moderator role. Gatekeepers can approve or reject quest completions, helping the Donegeon Master manage the game.</li>
                        <li><strong>Explorer:</strong> The standard player role. Explorers complete quests, earn rewards, and customize their character.</li>
                    </ul>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Personal vs. Guild Mode</h4>
                    <p className="leading-relaxed">The app has two primary contexts, which you can switch between using the dropdown in the header:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Personal Mode:</strong> This is your individual space. Quests you complete here add to your personal balances of currency and XP. You can spend this personal currency in the personal marketplace.</li>
                        <li><strong>Guild Mode:</strong> When you switch to a guild, you'll see quests and markets specific to that group. Rewards earned here go into your balance for that specific guild, creating a separate economy. This is perfect for family chores or group projects.</li>
                    </ul>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Currencies & Experience</h4>
                    <p className="leading-relaxed">You earn rewards for completing quests. These are split into two categories:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Currency (e.g., Gold, Gems):</strong> Used to "buy" items from the Marketplace. These can represent real-world rewards like an allowance, a special treat, or choosing the next movie night.</li>
                        <li><strong>Experience Points (XP) (e.g., Strength, Wisdom):</strong> These are used for character progression. Earning XP increases your total, which helps you achieve new Ranks.</li>
                    </ul>
                </HelpSection>
                
                <HelpSection title="User Guide: Main Features">
                    <p className="leading-relaxed">Here's a breakdown of the pages you'll use most often.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Dashboard:</strong> Your main hub. See your current rank, recent activities, inventory, and a list of quick-action quests.</li>
                        <li><strong>Quests:</strong> A full list of all available Duties (recurring tasks) and Ventures (one-time tasks).</li>
                        <li><strong>Marketplace:</strong> Browse markets and purchase items using the currency you've earned in the current mode.</li>
                        <li><strong>Calendar:</strong> A monthly view of all your required quests. Duties appear on the days they are scheduled, and Ventures appear on their due date.</li>
                        <li><strong>Progress:</strong> See a visual chart of your XP gains over the last 30 days.</li>
                        <li><strong>Trophies:</strong> View a gallery of trophies you've earned and see the requirements for those you can still unlock.</li>
                        <li><strong>Ranks:</strong> See your current rank, your progress to the next one, and the full list of all ranks in the game.</li>
                        <li><strong>Chronicles:</strong> A detailed log of all your activity, from quest completions to purchases and admin adjustments.</li>
                        <li><strong>Guild:</strong> View the guilds you are a member of and see the other members.</li>
                    </ul>
                </HelpSection>

                <HelpSection title="Admin Guide: Managing the Donegeon">
                    <p className="leading-relaxed">If you are a <strong>Donegeon Master</strong> or <strong>Gatekeeper</strong>, you have special administrative powers.</p>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Approvals</h4>
                    <p className="leading-relaxed">On this page, you can review pending requests. This includes quests that require approval to be marked as "Completed" and certain marketplace purchases that require fulfillment.</p>
                    
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Manage Users</h4>
                    <p className="leading-relaxed">Add new adventurers to the game, edit their details, or delete them. You can also use the "Adjust" button to manually grant rewards, apply setbacks, or award trophies with a note, which will appear in the user's Chronicles.</p>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Manage Quests, Markets, and Guilds</h4>
                    <p className="leading-relaxed">These pages allow you to create the content of your world. You can define new quests, set up marketplaces with custom items for purchase, and create or manage guilds and their membership.</p>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Settings</h4>
                    <p className="leading-relaxed">This is where the Donegeon Master can customize the core rules of the game. You can create custom reward types, define the ranks and their XP requirements, and create custom trophies for your adventurers to earn.</p>
                </HelpSection>

            </Card>
        </div>
    );
};

export default HelpPage;
