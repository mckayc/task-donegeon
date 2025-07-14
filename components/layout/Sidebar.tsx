


import React, { useState, useMemo } from 'react';
import { Role, Page, QuestCompletionStatus, PurchaseRequestStatus, Terminology, SidebarConfigItem, SidebarLink } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useGameData } from '../../context/GameDataContext';
import { useSettings, useSettingsDispatch } from '../../context/SettingsContext';

const ChevronDownIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const NavLink: React.FC<{ item: SidebarLink, activePage: Page, setActivePage: (page: Page) => void, badgeCount?: number }> = ({ item, activePage, setActivePage, badgeCount = 0 }) => {
    const { settings } = useSettings();
    const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;

    const isNested = item.level > 0;
    const isActive = activePage === item.id;

    return (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
          className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 ${isNested ? 'px-4 pl-12' : 'px-4'} ${
            isActive
              ? 'bg-emerald-600/20 text-emerald-300'
              : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
          }`}
          style={{ paddingLeft: isNested ? `${1.5 + item.level * 1.5}rem` : '1rem' }}
        >
          <span className="mr-3 text-xl">{item.emoji}</span>
          <span>{linkName}</span>
          {badgeCount > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                {badgeCount}
            </span>
          )}
        </a>
    );
};

interface CollapsibleNavGroupProps {
    title: string;
    children: React.ReactNode;
    activePage: Page;
    childPages: Page[];
    badgeCount?: number;
}

const CollapsibleNavGroup: React.FC<CollapsibleNavGroupProps> = ({ title, children, activePage, childPages, badgeCount }) => {
    const isGroupActive = childPages.includes(activePage);
    const [isOpen, setIsOpen] = useState(isGroupActive);

    return (
        <div className="border-t border-stone-700/60 my-2 pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-lg rounded-lg text-stone-300 hover:bg-stone-700/50 hover:text-white"
            >
                <div className="flex items-center">
                    <span className="font-semibold text-accent-light">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {badgeCount && badgeCount > 0 && !isOpen ? (
                         <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                            {badgeCount}
                        </span>
                    ) : null}
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};


const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { questCompletions, purchaseRequests } = useGameData();
  const { activePage, settings } = useSettings();
  const { setActivePage } = useSettingsDispatch();
  
  if (!currentUser) return null;

  const visibleLinks = useMemo(() => settings.sidebars.main.filter(link => {
    if (!link.isVisible) return false;
    if (currentUser.role === Role.DonegeonMaster) return true;
    if (currentUser.role === Role.Gatekeeper) return link.role === Role.Gatekeeper || link.role === Role.Explorer;
    return link.role === Role.Explorer;
  }), [settings.sidebars.main, currentUser.role]);

  const pendingQuestApprovals = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
  const pendingPurchaseApprovals = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length;
  const totalApprovals = pendingQuestApprovals + (currentUser?.role === Role.DonegeonMaster ? pendingPurchaseApprovals : 0);

  const renderNavItems = () => {
    const navTree: React.ReactNode[] = [];
    let i = 0;
    while (i < visibleLinks.length) {
        const item = visibleLinks[i];
        if (item.type === 'header') {
            const groupChildren: React.ReactNode[] = [];
            const childPages: Page[] = [];
            i++;
            while (i < visibleLinks.length && visibleLinks[i].level > item.level) {
                const childItem = visibleLinks[i];
                if(childItem.type === 'link') {
                    groupChildren.push(
                        <NavLink 
                            key={childItem.id} 
                            item={childItem} 
                            activePage={activePage} 
                            setActivePage={setActivePage} 
                            badgeCount={childItem.id === 'Approvals' ? totalApprovals : 0}
                        />
                    );
                    childPages.push(childItem.id);
                }
                i++;
            }
            navTree.push(
                <CollapsibleNavGroup 
                    key={item.id} 
                    title={item.title} 
                    activePage={activePage} 
                    childPages={childPages} 
                    badgeCount={item.title === 'Management' ? totalApprovals : 0}
                >
                    {groupChildren}
                </CollapsibleNavGroup>
            );
        } else if (item.type === 'link') {
            navTree.push(
                <NavLink 
                    key={item.id} 
                    item={item} 
                    activePage={activePage} 
                    setActivePage={setActivePage} 
                    badgeCount={item.id === 'Approvals' ? totalApprovals : 0}
                />
            );
            i++;
        } else {
            i++;
        }
    }
    return navTree;
  }

  return (
    <div className="w-72 flex flex-col" style={{ backgroundColor: 'hsl(var(--color-bg-primary))', borderRight: '1px solid hsl(var(--color-border))' }}>
      <button 
        onClick={() => setActivePage('Dashboard')} 
        className="flex items-center justify-center h-20 border-b cursor-pointer hover:bg-stone-800/50 transition-colors" 
        style={{ borderColor: 'hsl(var(--color-border))' }}
      >
        <h1 className="text-3xl font-medieval text-accent">{settings.terminology.appName}</h1>
      </button>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {renderNavItems()}
      </nav>
    </div>
  );
};

export default Sidebar;