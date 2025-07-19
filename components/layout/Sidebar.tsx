
import React, { useState, useMemo } from 'react';
import { Role, Page, QuestCompletionStatus, PurchaseRequestStatus, Terminology, SidebarConfigItem, SidebarLink } from '../../types';
import { ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon } from '../ui/Icons';
import { useAppState, useAppDispatch } from '../../context/AppContext';

const NavLink: React.FC<{ item: SidebarLink, activePage: Page, setActivePage: (page: Page) => void, badgeCount?: number, isCollapsed: boolean }> = ({ item, activePage, setActivePage, badgeCount = 0, isCollapsed }) => {
    const { settings } = useAppState();
    const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;

    const isNested = item.level > 0;
    const isActive = activePage === item.id;

    return (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
          className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 ${isNested ? 'pl-12' : 'px-4'} ${ isCollapsed ? 'justify-center' : ''} ${
            isActive
              ? 'bg-emerald-600/20 text-emerald-300'
              : 'text-stone-300 hover:bg-stone-700/50 hover:text-white'
          }`}
          style={!isCollapsed ? { paddingLeft: isNested ? `${1.5 + item.level * 1.5}rem` : '1rem' } : {}}
          title={isCollapsed ? linkName : ''}
        >
          <span className={`text-xl ${!isCollapsed ? 'mr-3' : ''}`}>{item.emoji}</span>
          {!isCollapsed && <span>{linkName}</span>}
          {badgeCount > 0 && (
            <span className={`absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ${isCollapsed ? 'top-1 right-1' : 'right-3 top-1/2 -translate-y-1/2'}`}>
                {badgeCount > 9 ? '9+' : badgeCount}
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
    isCollapsed: boolean;
}

const CollapsibleNavGroup: React.FC<CollapsibleNavGroupProps> = ({ title, children, activePage, childPages, badgeCount, isCollapsed }) => {
    const isGroupActive = childPages.includes(activePage);
    const [isOpen, setIsOpen] = useState(isGroupActive);

    if (isCollapsed) {
        return <div className="border-t border-stone-700/60 my-2"></div>;
    }

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
                            {badgeCount > 9 ? '9+' : badgeCount}
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
  const { currentUser, questCompletions, purchaseRequests, activePage, settings, isAiConfigured, isSidebarCollapsed, chatMessages, isChatOpen, guilds } = useAppState();
  const { setActivePage, toggleSidebar, toggleChat } = useAppDispatch();
  const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
  
  if (!currentUser) return null;

  const visibleLinks = useMemo(() => settings.sidebars.main.filter(link => {
    if (!link.isVisible) return false;
    if (link.id === 'AI Studio' && !isAiAvailable) return false;
    if (link.id === 'Chat' && !settings.chat.enabled) return false;
    if (currentUser.role === Role.DonegeonMaster) return true;
    if (currentUser.role === Role.Gatekeeper) return link.role === Role.Gatekeeper || link.role === Role.Explorer;
    return link.role === Role.Explorer;
  }), [settings.sidebars.main, currentUser.role, isAiAvailable, settings.chat.enabled]);

  const pendingQuestApprovals = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
  const pendingPurchaseApprovals = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length;
  const totalApprovals = pendingQuestApprovals + (currentUser?.role === Role.DonegeonMaster ? pendingPurchaseApprovals : 0);

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    
    // 1. Unread DMs are always relevant
    const unreadDms = chatMessages.filter(
        msg => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id)
    );
    const uniqueSenders = new Set(unreadDms.map(msg => msg.senderId));
    
    // 2. Unread messages from any of the user's guilds
    const userGuildIds = new Set(guilds.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
    const unreadGuilds = new Set(
        chatMessages
            .filter(msg => msg.guildId && userGuildIds.has(msg.guildId) && !msg.readBy.includes(currentUser.id))
            .map(msg => msg.guildId)
    );
    
    return uniqueSenders.size + unreadGuilds.size;
  }, [chatMessages, currentUser, guilds]);


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
                            isCollapsed={isSidebarCollapsed}
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
                    badgeCount={item.title === 'User Management' ? totalApprovals : 0}
                    isCollapsed={isSidebarCollapsed}
                >
                    {groupChildren}
                </CollapsibleNavGroup>
            );
        } else if (item.type === 'link') {
            if (item.id === 'Chat') {
                const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
                navTree.push(
                    <a
                      key={item.id}
                      href="#"
                      onClick={(e) => { e.preventDefault(); toggleChat(); }}
                      className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 px-4 ${isSidebarCollapsed ? 'justify-center' : ''} text-stone-300 hover:bg-stone-700/50 hover:text-white`}
                      title={isSidebarCollapsed ? linkName : ''}
                    >
                      <span className={`text-xl ${!isSidebarCollapsed ? 'mr-3' : ''}`}>{item.emoji}</span>
                      {!isSidebarCollapsed && <span>{linkName}</span>}
                      {unreadMessagesCount > 0 && !isChatOpen && (
                        <span className={`absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ${isSidebarCollapsed ? 'top-1 right-1' : 'right-3 top-1/2 -translate-y-1/2'}`}>
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </span>
                      )}
                    </a>
                );
            } else {
                navTree.push(
                    <NavLink 
                        key={item.id} 
                        item={item} 
                        activePage={activePage} 
                        setActivePage={setActivePage} 
                        badgeCount={item.id === 'Approvals' ? totalApprovals : 0}
                        isCollapsed={isSidebarCollapsed}
                    />
                );
            }
            i++;
        } else {
            i++;
        }
    }
    return navTree;
  }

  return (
    <div className={`flex flex-col flex-shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`} style={{ backgroundColor: 'hsl(var(--color-bg-primary))', borderRight: '1px solid hsl(var(--color-border))' }}>
      <button 
        onClick={() => setActivePage('Dashboard')} 
        className="flex items-center justify-center h-20 border-b cursor-pointer hover:bg-stone-800/50 transition-colors" 
        style={{ borderColor: 'hsl(var(--color-border))' }}
      >
        <h1 className={`font-medieval text-accent transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>{settings.terminology.appName}</h1>
      </button>
      <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {renderNavItems()}
      </nav>
      <div className="px-2 py-4 border-t" style={{ borderColor: 'hsl(var(--color-border))' }}>
         <button 
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="w-full flex items-center justify-center py-2 text-stone-400 hover:bg-stone-700/50 hover:text-white rounded-lg transition-colors"
         >
            {isSidebarCollapsed ? <ArrowRightIcon className="w-6 h-6" /> : <ArrowLeftIcon className="w-6 h-6" />}
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
