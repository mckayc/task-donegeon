
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
                <div className="px-6 pb-6 text-stone-300 space-y-4 prose">
                    {children}
                </div>
            )}
        </div>
    );
}

const HelpPage: React.FC = () => {
    const { settings } = useSettings();
    const { terminology } = settings;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">{terminology.appName} Guide</h1>
            <Card className="p-0 overflow-hidden">
                <CollapsibleSection title="Introduction: What is Task Donegeon?" defaultOpen>
                    <p className="leading-relaxed">Welcome to {terminology.appName}! This app transforms everyday tasks, chores, and goals into a fun, medieval-themed role-playing game (RPG). Instead of just checking off a to-do list, you'll complete {terminology.tasks}, earn virtual currency and experience points (XP), unlock {terminology.awards}, and improve your {terminology.level}. It's designed to make productivity more engaging for families, groups, or even individuals.</p>
                </CollapsibleSection>

                <CollapsibleSection title="Core Concepts">
                    <h4 className="text-lg font-bold text-stone-100">Roles</h4>
                    <p>Every member of your {terminology.group} has a role that defines what they can do:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>{terminology.admin}:</strong> The game administrator. They can create and manage users, {terminology.tasks}, {terminology.stores}, {terminology.groups}, and all game settings. They have the ultimate authority.</li>
                        <li><strong>{terminology.moderator}:</strong> A helper role. They can approve or reject {terminology.task} completions, assisting the {terminology.admin} in managing the game's day-to-day activity.</li>
                        <li><strong>{terminology.user}:</strong> The standard player role. They complete {terminology.tasks}, earn {terminology.points}, and customize their character.</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Personal vs. {terminology.group} Mode</h4>
                    <p className="leading-relaxed">The app has two primary contexts, which you can switch between using the dropdown in the header:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Personal Mode:</strong> This is your individual space. {terminology.tasks} you complete here add to your personal balances of currency and XP. You can spend this personal currency in personal {terminology.stores}. Example: A personal {terminology.task} might be "Read a chapter of a book" or "Practice piano for 30 minutes".</li>
                        <li><strong>{terminology.group} Mode:</strong> When you switch to a {terminology.group}, you'll see {terminology.tasks} and {terminology.stores} specific to that group. Rewards earned here go into your balance for that specific {terminology.group}, creating a separate economy. This is perfect for family chores or group projects. Example: A {terminology.group} {terminology.task} might be "Help clean the kitchen after dinner" or "Rake the leaves in the yard".</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">{terminology.tasks}: {terminology.recurringTasks} vs. {terminology.singleTasks}</h4>
                     <p>All tasks fall into one of two categories:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>{terminology.recurringTasks}:</strong> These are repeating tasks that happen on a schedule, like daily, weekly, or on specific dates of the month. Example: "Take out the trash every Tuesday" or "Make your bed every morning".</li>
                        <li><strong>{terminology.singleTasks}:</strong> These are one-time tasks or projects. They can be completable once, or have a certain number of available "slots" for multiple people to complete. Example: "Organize the garage" or "Finish your science fair project".</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Deadlines & {terminology.negativePoints}</h4>
                    <p>The {terminology.admin} can set deadlines for any {terminology.task}. There are two types:</p>
                     <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Late:</strong> The point at which a {terminology.task} is considered late. A {terminology.negativePoint} may be applied, but the {terminology.task} can still be completed for its original {terminology.points}.</li>
                        <li><strong>Incomplete:</strong> The final deadline. If a {terminology.task} isn't completed by this time, it becomes unavailable and a potentially larger {terminology.negativePoint} is applied.</li>
                    </ul>
                </CollapsibleSection>
                
                <CollapsibleSection title={`User Guide: For Every ${terminology.user}`}>
                    <p className="leading-relaxed">Here's a breakdown of the pages you'll use most often.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Dashboard:</strong> Your main hub. Get a quick overview of your current {terminology.level}, recent activities, inventory of {terminology.points}, and a list of high-priority {terminology.tasks}.</li>
                        <li><strong>Avatar & Themes:</strong> Customize your character's appearance with items you've purchased. You can also change the entire app's visual style by selecting a theme you own.</li>
                        <li><strong>{terminology.tasks.toString()}:</strong> This is the main board showing all available {terminology.recurringTasks} and {terminology.singleTasks}. You can complete, claim, or release {terminology.tasks} from here.</li>
                        <li><strong>{terminology.shoppingCenter}:</strong> Browse the {terminology.stores} set up by your {terminology.admin}. Spend your hard-earned currency on virtual items (like avatar outfits or themes) or real-world rewards.</li>
                        <li><strong>Calendar:</strong> A monthly view of all your required {terminology.tasks}. {terminology.recurringTasks} appear on the days they are scheduled, and {terminology.singleTasks} appear on their due date. This is great for planning ahead.</li>
                        <li><strong>Progress:</strong> See a chart of your XP gains over the last 30 days. You can filter by different XP types to see what skills you've been working on.</li>
                        <li><strong>{terminology.awards}:</strong> View your trophy case! See all the {terminology.awards} you've earned and check the requirements for those you can still unlock.</li>
                        <li><strong>{terminology.levels}:</strong> See your current {terminology.level}, your progress to the next one, and the full list of all {terminology.levels} in the game.</li>
                        <li><strong>{terminology.history}:</strong> A detailed log of all your activity, from {terminology.task} completions to purchases and admin adjustments.</li>
                        <li><strong>{terminology.groups}:</strong> View the {terminology.groups} you are a member of and see the other members.</li>
                    </ul>
                </CollapsibleSection>

                <CollapsibleSection title={`Admin Guide: For the ${terminology.admin}`}>
                    <p className="leading-relaxed">If you are a <strong>{terminology.admin}</strong> or <strong>{terminology.moderator}</strong>, you have special administrative powers.</p>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Getting Started</h4>
                    <p>As the first {terminology.admin}, your initial steps should be:</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li><strong>Review Settings:</strong> Go to the Settings page and look at the Terminology section. You can rename "Quests" to "Chores", "Guilds" to "Family", etc., to make the app fit your group perfectly.</li>
                        <li><strong>Create Users:</strong> Go to "Manage Users" and create accounts for everyone in your group. You can set their role and an optional, easy-to-remember PIN for quick login.</li>
                    </ol>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Management Pages</h4>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Approvals:</strong> This is your inbox for pending actions. When a {terminology.user} completes a {terminology.task} that needs approval, it will appear here. You can approve or reject it, with an optional note.</li>
                        <li><strong>Manage Users:</strong> Add new adventurers, edit their details, or delete them. The "Adjust" button is a powerful tool to manually grant {terminology.points} or {terminology.awards} for actions that happen outside the app (e.g., "Bonus XP for a great report card").</li>
                        <li><strong>Content Management (Quests, Markets, etc.):</strong> These pages are your world-building tools. You can define new {terminology.tasks}, set up {terminology.stores} with custom items, create {terminology.groups}, define custom {terminology.points}, design {terminology.levels}, and invent unique {terminology.awards}.</li>
                    </ul>

                     <h4 className="text-lg font-bold text-stone-100 mt-4">Data Management</h4>
                     <p>This powerful page gives you full control over the game's data. It is separated into two main areas:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Backup & Sharing:</strong> You can create a full backup of all game data for safekeeping. You can also create and import "Blueprints" - smaller files that only contain certain assets (like a pack of chores) that you can share with others.</li>
                        <li><strong>Bulk Deletion:</strong> This section contains "danger zone" actions for cleaning up your game. You can wipe all historical records, reset all player wallets and XP, or even delete all the custom content you've created to start over without having to reset user accounts.</li>
                    </ul>
                </CollapsibleSection>

            </Card>
        </div>
    );
};

export default HelpPage;
