
import React, { useState } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';
import { ChevronDownIcon } from '../ui/Icons';

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
                <div className="px-6 pb-6 text-stone-300 space-y-4 prose prose-invert max-w-none">
                    {children}
                </div>
            )}
        </div>
    );
}

const HelpPage: React.FC = () => {
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

export default HelpPage;