import React, { useState, ReactNode } from 'react';
import { Card, Icons } from '../ui';
import { useAppState } from '../../context/AppContext';

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
                <Icons.ChevronDownIcon className={`w-6 h-6 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 text-stone-300 space-y-4 prose prose-invert max-w-none">
                    {children}
                </div>
            )}
        </div>
    );
}

const V0_0_97_DATE = new Date(2025, 6, 23);
const V0_0_96_DATE = new Date(2025, 6, 22);
const V0_0_95_DATE = new Date(2025, 6, 22);
const V0_0_94_DATE = new Date(2025, 6, 26);
const V0_0_93_DATE = new Date(2025, 6, 25);
const V0_0_92_DATE = new Date(2025, 6, 24);
const V0_0_91_DATE = new Date(2025, 6, 23);
const V0_0_90_DATE = new Date(2025, 6, 22);
const V0_0_89_DATE = new Date(2025, 6, 21);
const V0_0_88_DATE = new Date(2025, 6, 20);
const V0_0_87_DATE = new Date(2025, 6, 20);
const V0_0_86_DATE = new Date(2025, 6, 19);
const V0_0_85_DATE = new Date(2025, 6, 19);
const V0_0_84_DATE = new Date(2025, 6, 19);
const V0_0_83_DATE = new Date(2025, 6, 19);
const V0_0_82_DATE = new Date(2025, 6, 19);
const V0_0_81_DATE = new Date(2025, 6, 19);
const V0_0_80_DATE = new Date(2025, 6, 19);

const VersionHistoryContent: React.FC = () => (
    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.97 ({V0_0_97_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>New "Vacation" Event Type:</strong> Replaced the old global vacation mode setting with a more flexible "Vacation" event type.</li>
                <li><strong>Calendar-Driven Vacations:</strong> Admins can now schedule vacation periods directly on the calendar for either personal use or for an entire guild.</li>
                <li><strong>Automatic Penalty Pausing:</strong> While a "Vacation" event is active, the system automatically pauses all late/incomplete penalties for scheduled quests, allowing users to take a break without consequences.</li>
                <li><strong>Streamlined Settings:</strong> Removed the old vacation mode toggle from the Settings page to create a single, intuitive workflow through the calendar.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.96 ({V0_0_96_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Default Quest Groups:</strong> The app now ships with a default set of Quest Groups (e.g., "Household Chores," "School & Learning") to provide an immediate organizational structure for new and existing games without any groups.</li>
                <li><strong>AI-Powered Group Suggestions:</strong> The Quest Idea Generator in the AI Studio is now aware of all existing Quest Groups and will suggest the most appropriate group for each generated quest idea.</li>
                <li><strong>Streamlined Quest Creation:</strong> When creating a quest from an AI-generated idea, the "Create Quest" form is now pre-filled with the suggested Quest Group, saving administrative time and improving workflow.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.95 ({V0_0_95_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Smarter AI Studio:</strong> The AI Studio is now more integrated with the game's mechanics. When generating quest ideas, it will now also suggest relevant categories (tags) and appropriate rewards, pre-filling the new quest form to save administrators time.</li>
                <li><strong>Powerful Bulk Editing for Quests:</strong> A new bulk editing system has been introduced on the "Manage Quests" page. Administrators can now select multiple quests and simultaneously update their status, group assignments, tags, and assigned users from a single dialog.</li>
                <li><strong>Enhanced Collapsed Sidebar:</strong> The user experience for the collapsed sidebar has been significantly upgraded with a new fly-out menu system. Hovering over any icon now instantly reveals a panel showing the full name of the link or its contents, making navigation faster and more intuitive.</li>
                <li><strong>Default Quest Categories:</strong> To help administrators get started, the app now includes a default set of common quest categories (e.g., "Cleaning," "Learning," "Yardwork"). These appear automatically in tag selection fields.</li>
                <li><strong>UI Bug Fixes:</strong> Corrected a recurring issue where a "0" badge would incorrectly appear on collapsed sidebar menus that had no notifications.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.94 ({V0_0_94_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Default Quest Categories:</strong> To help new administrators get started faster, the app now includes a default set of common quest categories (e.g., "Cleaning", "Learning", "Yardwork"). These appear automatically in the tag selection inputs alongside any custom tags you create.</li>
                <li><strong>Improved Collapsed Sidebar Navigation:</strong> The collapsed sidebar is now more functional. Collapsible menu groups remain visible as icons with expand/collapse arrows, allowing you to access nested links without needing to expand the entire sidebar.</li>
                <li><strong>UI Bug Fix:</strong> Fixed a minor UI bug where a badge with a "0" would incorrectly appear on collapsed sidebar menu groups that had no notifications.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.93 ({V0_0_93_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Purchase Escrow System:</strong> When an item requiring approval is purchased, the funds are now immediately deducted and held in escrow. This prevents users from spending those funds elsewhere. If the purchase is rejected or cancelled, the funds are automatically refunded.</li>
                <li><strong>Chronicles Integration for Purchases:</strong> All purchase requests (pending, completed, rejected) now appear correctly in the Chronicles activity feed with a clear title and a note showing the cost.</li>
                <li><strong>Improved Login Notifications:</strong> The notification popup that appears on login is now scrollable to accommodate a large number of updates, and it includes an "X" button for quick dismissal.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.92 ({V0_0_92_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>In-Dialog Quest Group Creation:</strong> To streamline workflow, administrators can now create new Quest Groups directly from within the "Create/Edit Quest" dialog without navigating to a separate management page.</li>
                <li><strong>Quick Edit Access:</strong> On the "Manage Quests" and "Manage Goods" pages, an item's title is now clickable, immediately opening the edit dialog for faster content updates.</li>
            </ul>
        </div>
         <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.91 ({V0_0_91_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Redesigned Management Pages:</strong> The "Manage Goods" and "Manage Quests" pages have been completely overhauled with a modern, tabbed interface for better organization.</li>
                <li><strong>Powerful Filtering & Sorting:</strong> Both management pages now include search bars and sorting options, making it easier than ever to find the content you need.</li>
                <li><strong>Quest Groups:</strong> A new "Quest Group" system allows administrators to categorize quests. This includes a new management page to create and edit groups.</li>
                <li><strong>Bulk Quest Assignment:</strong> The most powerful feature of Quest Groups is the ability to assign an entire group of quests to multiple users at once, dramatically speeding up workflow.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.90 ({V0_0_90_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Smarter Asset Pack Importer:</strong> The "Import from Library" feature in the Asset Manager has been completely overhauled. It now performs a smart comparison between your local gallery and the server's image packs, highlighting new files (in green, pre-selected) versus duplicates (in red, disabled). This gives administrators granular control over which new assets to import, preventing accidental re-downloads and making library management much more efficient.</li>
            </ul>
        </div>
        <div>
            <h4 className="text-lg font-bold text-stone-100">
                Version 0.0.89 ({V0_0_89_DATE.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })})
            </h4>
            <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Enhanced Chronicles:</strong> The Chronicles page now provides a comprehensive, unified view of all significant events. It now includes not only quest completions, but also item purchases, trophy awards, manual admin adjustments, system-generated events (like late penalties), and announcements. This creates a complete audit trail of all game activity.</li>
            </ul>
        </div>
    </div>
);

export const AboutPage: React.FC = () => {
    const { settings } = useAppState();
    const { terminology } = settings;

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="p-0 overflow-hidden">
                <CollapsibleSection title="Introduction: What is Task Donegeon?" defaultOpen>
                    <p>Welcome to {terminology.appName}! This app transforms everyday tasks, chores, and goals into a fun, medieval-themed role-playing game (RPG). Instead of just checking off a to-do list, you'll complete {terminology.tasks}, earn virtual currency and experience points (XP), unlock {terminology.awards}, and improve your {terminology.level}.</p>
                    <p>It's designed to make productivity more engaging for families, groups, or even individuals who want to add a bit of adventure to their daily lives.</p>
                </CollapsibleSection>

                 <CollapsibleSection title="Core Concepts: How It All Works">
                    <h4 className="text-lg font-bold text-stone-100">Roles: Who's Who?</h4>
                    <p>Every member of your {terminology.group} has a role that defines what they can do:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>{terminology.admin}:</strong> The game administrator. They can create and manage all users, {terminology.tasks}, {terminology.stores}, {terminology.groups}, and settings. They have the ultimate authority.</li>
                        <li><strong>{terminology.moderator}:</strong> A helper role. They can approve or reject {terminology.task} completions, assisting the {terminology.admin} in managing the game's day-to-day activity.</li>
                        <li><strong>{terminology.user}:</strong> The standard player role. They complete {terminology.tasks}, earn {terminology.points}, and customize their character.</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Personal vs. {terminology.group} Mode</h4>
                    <p>The app has two primary contexts, which you can switch between using the dropdown in the header:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Personal Mode:</strong> This is your individual space. {terminology.tasks} you complete here add to your personal balances of currency and XP. You can spend this personal currency in personal {terminology.stores}.
                            <br/><em>Example: A personal {terminology.task.toLowerCase()} might be "Read a chapter of a book" or "Practice piano for 30 minutes".</em></li>
                        <li><strong>{terminology.group} Mode:</strong> When you switch to a {terminology.group}, you'll see {terminology.tasks} and {terminology.stores} specific to that group. Rewards earned here go into your balance for that specific {terminology.group}, creating a separate economy. This is perfect for family chores or group projects.
                            <br/><em>Example: A {terminology.group.toLowerCase()} {terminology.task.toLowerCase()} might be "Help clean the kitchen after dinner" or "Rake the leaves in the yard".</em></li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">{terminology.tasks}: {terminology.recurringTasks} vs. {terminology.singleTasks}</h4>
                     <p>All tasks fall into one of two categories:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>{terminology.recurringTasks}:</strong> These are repeating tasks that happen on a schedule, like daily, weekly, or on specific dates of the month. They are great for building habits.
                            <br/><em>Example: "Take out the trash every Tuesday" or "Make your bed every morning".</em></li>
                        <li><strong>{terminology.singleTasks}:</strong> These are one-time tasks or projects. They can be completable once, or have a certain number of available "slots" for multiple people to complete.
                            <br/><em>Example: "Organize the garage" (completable once) or "Help wash the car" (could have 2 slots).</em></li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Deadlines &amp; {terminology.negativePoints}</h4>
                    <p>The {terminology.admin} can set deadlines for any {terminology.task}. There are two types:</p>
                     <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Late:</strong> The point at which a {terminology.task} is considered late. A {terminology.negativePoint} may be applied, but the {terminology.task} can still be completed for its original {terminology.points}.</li>
                        <li><strong>Incomplete:</strong> The final deadline. If a {terminology.task} isn't completed by this time, it becomes unavailable and a potentially larger {terminology.negativePoint} is applied.</li>
                    </ul>
                </CollapsibleSection>
                
                <CollapsibleSection title={`A Tour of the Donegeon (For Everyone)`}>
                    <p>Here's a breakdown of the pages you'll use most often.</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Sidebar:</strong> Your main navigation panel on the left. It can be collapsed to save space. When collapsed, you can still access nested menus by clicking their group icons and expand/collapse arrows.</li>
                        <li><strong>Dashboard:</strong> Your main hub. Get a quick overview of your current {terminology.level}, recent activities, inventory of {terminology.points}, and a list of high-priority {terminology.tasks}. Click on any task to open its details and complete it.</li>
                        <li><strong>{terminology.tasks.toString()}:</strong> This is the main board showing all available {terminology.recurringTasks} and {terminology.singleTasks}. Click on any card to see its full details and complete it.</li>
                        <li><strong>{terminology.shoppingCenter}:</strong> Browse the {terminology.stores} set up by your {terminology.admin}. Spend your hard-earned currency on virtual items (like avatar outfits or themes) or real-world rewards.</li>
                        <li><strong>Calendar:</strong> A monthly view of all your required {terminology.tasks}. {terminology.recurringTasks} appear on the days they are scheduled. {terminology.singleTasks} will appear if they are due, required, or you have marked them as a "To-Do" item. This is great for planning ahead.</li>
                        <li><strong>Prioritizing with To-Do:</strong> For {terminology.singleTasks}, you'll see a "To-Do" toggle in the detail view. Marking a {terminology.singleTask.toLowerCase()} as a To-Do will highlight it with a purple border and move it to the top of your lists, helping you focus on what's important.</li>
                        <li><strong>Avatar &amp; Collection:</strong> Customize your character's appearance with items you've purchased. You can also change the entire app's visual style by selecting a theme you own. The collection page shows all non-avatar items.</li>
                        <li><strong>Progress &amp; {terminology.levels}:</strong> See a chart of your XP gains over the last 30 days and view your current {terminology.level}, your progress to the next one, and the full list of all {terminology.levels} in the game.</li>
                        <li><strong>{terminology.awards}:</strong> View your trophy case! See all the {terminology.awards} you've earned and check the requirements for those you can still unlock.</li>
                        <li><strong>{terminology.history}:</strong> A detailed log of all your activity, from {terminology.task} completions to purchases and admin adjustments. The new 3-column layout shows the action, any notes, and the final status.</li>
                        <li><strong>{terminology.groups}:</strong> View the {terminology.groups} you are a member of and see the other members.</li>
                    </ul>
                </CollapsibleSection>

                <CollapsibleSection title={`The Admin's Toolkit`}>
                    <p>If you are a <strong>{terminology.admin}</strong> or <strong>{terminology.moderator}</strong>, you have special administrative powers.</p>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">User Management</h4>
                    <p>Go to `Manage Users` to add new adventurers, edit their details, or delete them. The "Adjust" button is a powerful tool to manually grant {terminology.points} or {terminology.awards} for actions that happen outside the app.</p>
                    <p><em>Example Use Case: A user gets a great report card. You can use the "Adjust" button to grant them 100 bonus XP and a special "Good Grades" trophy you created.</em></p>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Content Creation &amp; Management</h4>
                    <p>The "Manage" pages in the sidebar are your world-building tools. You can define new {terminology.tasks}, set up {terminology.stores} with custom items, create {terminology.groups}, define custom {terminology.points}, design {terminology.levels}, and invent unique {terminology.awards}. To help you get started, the app comes with a set of default categories (tags) for quests, such as 'Cleaning' and 'Yardwork'.</p>
                    <p>When setting rewards for {terminology.tasks.toLowerCase()}, you'll see a helpful indicator (e.g., `(equals 5 💎 or $5.00)`) showing its equivalent "real-world" value based on your settings, making it easier to balance your game's economy.</p>
                    
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Theme Editor</h4>
                    <p>The Theme Editor (found under `Content Management` in the sidebar) is a powerful tool for customizing the entire look and feel of the application. It features a two-panel layout:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Live Preview (Left):</strong> The left side of the screen shows a live preview that looks just like your main dashboard. Any change you make in the controls is reflected here instantly.</li>
                        <li><strong>Controls (Right):</strong> The right side contains all your editing tools. You can select a theme to edit, rename it, and adjust its properties. This includes choosing from over 30 display and body fonts, using sliders to set precise font sizes, and picking exact colors for every part of the UI. Changes are not saved until you hit the "Save" or "Create" button, so you can experiment freely.</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Managing Images &amp; Assets</h4>
                    <p>You can add images for your Game Assets in two primary ways from the `Asset Manager` page. This is the central hub for all your visual content.</p>
                    
                    <h5 className="text-md font-bold text-stone-100 mt-4">Method 1: Frontend Upload (Recommended)</h5>
                    <p>This is the easiest way to add images one by one.</p>
                     <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li>Navigate to `System Tools -&gt; Asset Manager`.</li>
                        <li>Use the "Upload New Asset" card to select an image from your device, or simply drag and drop it onto the card.</li>
                        <li>A dialog will pop up asking for a **Category**. This is crucial for organization. For example, if you're uploading a helmet, you could enter the category "Avatar" or "Hats".</li>
                        <li>Click "Upload & Categorize". The image is sent to the server and saved in a folder matching the category you provided.</li>
                        <li>The "Local Image Gallery" on the page will refresh, and your new image will appear under its category.</li>
                        <li>Now, you can click on your new image in the gallery to open the "Create New Asset" dialog and fill in the rest of its details (name, cost, etc.).</li>
                    </ol>

                    <h5 className="text-md font-bold text-stone-100 mt-4">Method 2: Manual Folder Upload (For Docker/Local Installs)</h5>
                    <p>If you are running the application locally using Docker and need to add many images at once, this is the most efficient method:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li>
                            <strong>Where to add files:</strong> Place your image files directly into the <code>uploads</code> folder you have mapped in your Docker configuration.
                        </li>
                        <li>
                            <strong>How to name files:</strong> You can create sub-folders inside your `uploads` folder. The name of the sub-folder will become the category in the app.
                            <ul className="list-disc list-inside space-y-1 pl-6 mt-2">
                                <li>Example 1: Create a folder named `Pets` inside `uploads` and place `BabyDragon.png` inside it. The app will show a "Pets" category containing "BabyDragon".</li>
                                <li>Example 2: Place `FierySword.png` directly into `uploads`. It will appear in a "Miscellaneous" category.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Why do this:</strong> This is the fastest way to add dozens of images. After adding them, go to the `Asset Manager` page. Your images will automatically appear in the gallery, pre-categorized and ready to be used.
                        </li>
                    </ul>

                    <h5 className="text-md font-bold text-stone-100 mt-4">Method 3: Importing from the Library (For Docker/Local Installs)</h5>
                    <p>The "Import from Library" button on the `Asset Manager` page opens a powerful tool for adding curated content packs directly from the project's central repository.</p>
                    <ol className="list-decimal list-inside space-y-2 pl-4">
                        <li><strong>Select a Pack:</strong> You'll first see a list of available image packs. Click one to view its contents.</li>
                        <li><strong>Review and Compare:</strong> The app fetches the list of all files inside the pack and compares them against your existing local image gallery.</li>
                        <li><strong>Smart Selection:</strong> The next screen shows you all the files, intelligently categorized:
                            <ul className="list-disc list-inside space-y-1 pl-6 mt-2">
                                <li><strong className="text-green-400">New Files</strong> are highlighted in green and checked by default, ready for import.</li>
                                <li><strong className="text-red-400">Duplicate Files</strong> are highlighted in red with their checkbox disabled to prevent accidental re-downloads.</li>
                            </ul>
                        </li>
                        <li><strong>Granular Import:</strong> You can uncheck any new files you don't want. When you click "Import," only the selected new files are downloaded and added to your gallery. This gives you precise control over your asset library.</li>
                    </ol>

                    <p className="font-bold mt-4">Best Practices for Images:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Supported Formats:</strong> The app supports standard web image formats like <code>PNG</code>, <code>JPG</code>, <code>GIF</code>, <code>SVG</code>, and <code>WebP</code>.</li>
                        <li><strong>Use Transparency Wisely:</strong> For avatar items, use formats that support transparency like <code>PNG</code> or <code>WebP</code>. This ensures they layer correctly without a white box around them.</li>
                        <li><strong>Optimize File Size:</strong> <code>WebP</code> is highly recommended as it offers excellent quality with smaller file sizes. Aim to keep files under 200kb to ensure the app loads quickly.</li>
                        <li><strong>Keep it Square:</strong> Square images (e.g., 500x500 pixels) display most consistently in the UI.</li>
                    </ul>

                    <h4 className="text-lg font-bold text-stone-100 mt-4">Data Management</h4>
                    <p>This powerful page gives you full control over the game's data. It is separated into several areas:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Backup & Import:</strong> Create a full backup of all game data for safekeeping. You can also import these backups or smaller "Blueprint" files.</li>
                        <li><strong>Object Manager:</strong> A powerful table view of all your created content. You can bulk-select items to delete them or export them as a Blueprint.</li>
                        <li><strong>Asset Library:</strong> Jumpstart your game with pre-made content packs! Install packs of quests, items, and more with just a few clicks.</li>
                    </ul>
                </CollapsibleSection>

                <CollapsibleSection title="Settings Deep Dive">
                    <p>The `Settings` page allows the {terminology.admin} to fine-tune the game experience.</p>
                     <h4 className="text-lg font-bold text-stone-100 mt-4">Security Settings</h4>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Quick User Switching:</strong> Shows avatars in the header for fast switching. Turn this off for a cleaner interface or if you have many users.</li>
                        <li><strong>Require PIN for Users:</strong> When ON, standard users must enter their PIN to log in. Turn this OFF for young children or on a trusted family device for easier access.</li>
                        <li><strong>Require Password for Admins:</strong> When ON, {terminology.admin} and {terminology.moderator} roles must use their full password. Turn this OFF to allow them to use their PIN, which is faster but less secure.</li>
                    </ul>
                     <h4 className="text-lg font-bold text-stone-100 mt-4">Game Rules</h4>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Forgiving Setbacks:</strong> When ON, {terminology.negativePoints} are only applied if a {terminology.task} is incomplete at the end of the day. When OFF, {terminology.negativePoints} are applied the moment a {terminology.task} becomes late.</li>
                        <li><strong>Vacation Mode:</strong> Pause all deadlines and {terminology.negativePoints} between two dates. Perfect for holidays!</li>
                    </ul>
                    <h4 className="text-lg font-bold text-stone-100 mt-4">Terminology</h4>
                    <p>This is one of the most powerful features for personalization. You can change almost any key term in the app.
                    <br/><em>Example: You could change `{terminology.appName}` to "The Family Crew," `{terminology.task}` to "Chore," and `{terminology.group}` to "Team" to create a less fantasy-themed experience.</em></p>
                </CollapsibleSection>

            </Card>
        </div>
    );
};
