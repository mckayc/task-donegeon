
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Role, Page, QuestCompletionStatus, PurchaseRequestStatus, Terminology } from '../../types';
import * as Icons from '../ui/Icons';


interface NavItem {
  name: Page;
  Icon: React.FC;
  role?: Role; // For links inside a group that have specific role requirements
  termKey?: keyof Terminology;
}

const CollapsibleNavGroup: React.FC<{
    title: string;
    Icon: React.FC;
    items: NavItem[];
    activePage: Page;
    currentUserRole: Role;
    setActivePage: (page: Page) => void;
    badgeCount?: number;
}> = ({ title, Icon, items, activePage, currentUserRole, setActivePage, badgeCount }) => {
    const isGroupActive = items.some(item => item.name === activePage);
    const [isOpen, setIsOpen] = useState(isGroupActive);

    const visibleItems = items.filter(item => {
        if (!item.role) return true;
        return currentUserRole === Role.DonegeonMaster || (item.role === currentUserRole);
    });
    
    if (visibleItems.length === 0) return null;

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-lg rounded-lg text-stone-300 hover:bg-stone-700/50 hover:text-white"
            >
                <div className="flex items-center">
                    <Icon />
                    <span>{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {badgeCount && badgeCount > 0 && !isOpen ? (
                         <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                            {badgeCount}
                        </span>
                    ) : null}
                    <Icons.ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {visibleItems.map(item => (
                        <NavLink key={item.name} item={item} activePage={activePage} setActivePage={setActivePage} isNested={true} badgeCount={item.name === 'Approvals' ? badgeCount : 0} />
                    ))}
                </div>
            )}
        </div>
    );
};


const NavLink: React.FC<{ item: NavItem, activePage: Page, setActivePage: (page: Page) => void, badgeCount?: number, isNested?: boolean }> = ({ item, activePage, setActivePage, badgeCount = 0, isNested = false }) => {
    const { settings } = useAppState();
    const linkName = item.termKey ? settings.terminology[item.termKey] : item.name;

    return (
        <a
          key={item.name}
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
          className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 ${isNested ? 'px-4 pl-10' : 'px-4'} ${
            activePage === item.name
              ? 'bg-accent-subtle text-accent-light'
              : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
          }`}
        >
          <item.Icon />
          <span>{linkName}</span>
          {badgeCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {badgeCount}
            </span>
          )}
        </a>
    );
};

const Sidebar: React.FC = () => {
  const { currentUser, questCompletions, purchaseRequests, activePage, settings } = useAppState();
  const { setActivePage } = useAppDispatch();
  
  if (!currentUser) return null;

  const mainNavItems: NavItem[] = [
    { name: 'Dashboard', Icon: Icons.DashboardIcon },
    { name: 'Quests', Icon: Icons.QuestsIcon, termKey: 'tasks' },
    { name: 'Marketplace', Icon: Icons.MarketplaceIcon, termKey: 'shoppingCenter' },
    { name: 'Calendar', Icon: Icons.CalendarIcon },
  ];
  
  const characterNavItems: NavItem[] = [
    { name: 'Avatar', Icon: Icons.AvatarIcon },
    { name: 'Collection', Icon: Icons.CollectionIcon },
    { name: 'Themes', Icon: Icons.ThemeIcon },
    { name: 'Progress', Icon: Icons.ProgressIcon },
    { name: 'Trophies', Icon: Icons.TrophyIcon, termKey: 'awards' },
    { name: 'Ranks', Icon: Icons.RankIcon, termKey: 'levels' },
    { name: 'Chronicles', Icon: Icons.ChroniclesIcon, termKey: 'history' },
    { name: 'Guild', Icon: Icons.GuildIcon, termKey: 'groups' },
  ];

  const managementNavItems: NavItem[] = [
    { name: 'Approvals', Icon: Icons.ApprovalsIcon, role: Role.Gatekeeper },
    { name: 'Manage Users', Icon: Icons.ManageUsersIcon, role: Role.DonegeonMaster },
    { name: 'Manage Quests', Icon: Icons.ManageQuestsIcon, role: Role.DonegeonMaster, termKey: 'tasks' },
    { name: 'Manage Items', Icon: Icons.ItemManagerIcon, role: Role.DonegeonMaster },
    { name: 'Manage Markets', Icon: Icons.ManageMarketsIcon, role: Role.DonegeonMaster, termKey: 'shoppingCenter' },
    { name: 'Manage Guilds', Icon: Icons.ManageGuildsIcon, role: Role.DonegeonMaster, termKey: 'groups' },
    { name: 'Rewards', Icon: Icons.RewardsIcon, role: Role.DonegeonMaster, termKey: 'points' },
    { name: 'Manage Ranks', Icon: Icons.ManageRanksIcon, role: Role.DonegeonMaster, termKey: 'levels' },
    { name: 'Manage Trophies', Icon: Icons.ManageTrophiesIcon, role: Role.DonegeonMaster, termKey: 'awards' },
    settings.enableAiFeatures ? { name: 'AI Studio', Icon: Icons.SparklesIcon, role: Role.DonegeonMaster } : null,
    { name: 'Data Management', Icon: Icons.DatabaseIcon, role: Role.DonegeonMaster },
    { name: 'Settings', Icon: Icons.SettingsIcon, role: Role.DonegeonMaster },
  ].filter(Boolean) as NavItem[];
  
  const pendingQuestApprovals = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
  const pendingPurchaseApprovals = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length;
  const totalApprovals = pendingQuestApprovals + (currentUser?.role === Role.DonegeonMaster ? pendingPurchaseApprovals : 0);

  return (
    <div className="w-72 flex flex-col" style={{ backgroundColor: 'hsl(var(--color-bg-primary))', borderRight: '1px solid hsl(var(--color-border))' }}>
      <button 
        onClick={() => setActivePage('Dashboard')} 
        className="flex items-center justify-center h-20 border-b cursor-pointer hover:bg-stone-800/50 transition-colors" 
        style={{ borderColor: 'hsl(var(--color-border))' }}
      >
        <h1 className="text-3xl font-medieval text-accent">{settings.terminology.appName}</h1>
      </button>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        {mainNavItems.map((item) => <NavLink key={item.name} item={item} activePage={activePage} setActivePage={setActivePage} />)}
        
        <div className="pt-4 mt-4 border-t space-y-1" style={{ borderColor: 'hsl(var(--color-border))' }}>
             <CollapsibleNavGroup
                title="Character"
                Icon={Icons.CharacterIcon}
                items={characterNavItems}
                activePage={activePage}
                currentUserRole={currentUser.role}
                setActivePage={setActivePage}
             />
        </div>

        {(currentUser.role === Role.DonegeonMaster || currentUser.role === Role.Gatekeeper) && (
             <div className="pt-4 mt-4 border-t space-y-1" style={{ borderColor: 'hsl(var(--color-border))' }}>
                <CollapsibleNavGroup
                    title="Management"
                    Icon={Icons.AdminIcon}
                    items={managementNavItems}
                    activePage={activePage}
                    currentUserRole={currentUser.role}
                    setActivePage={setActivePage}
                    badgeCount={totalApprovals}
                />
            </div>
        )}
      </nav>
      <div className="px-4 py-4 border-t space-y-1" style={{ borderColor: 'hsl(var(--color-border))' }}>
        <NavLink item={{ name: 'About', Icon: Icons.AboutIcon }} activePage={activePage} setActivePage={setActivePage} />
        <NavLink item={{ name: 'Help', Icon: Icons.HelpIcon }} activePage={activePage} setActivePage={setActivePage} />
      </div>
    </div>
  );
};

export default Sidebar;
