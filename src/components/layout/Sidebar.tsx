

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Role, QuestCompletionStatus, PurchaseRequestStatus, Page, SidebarConfigItem, SidebarLink, SidebarHeader, TradeStatus, ChatMessage } from '../../types';
import { ChevronDownIcon, ArrowLeftIcon, ArrowRightIcon } from '../user-interface/Icons';
import { useUIState, useUIDispatch } from '../../context/UIContext';
import { useAuthState } from '../../context/AuthContext';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import { useCommunityState } from '../../context/CommunityContext';
import { useSystemState } from '../../context/SystemContext';

const FlyoutPanel: React.FC<{ title: string; items?: SidebarLink[]; isVisible: boolean; totalApprovals?: number }> = ({ title, items, isVisible, totalApprovals }) => {
    const { settings } = useSystemState();
    const { setActivePage } = useUIDispatch();
    
    if (!isVisible) return null;

    return (
        <div className="absolute left-full top-0 ml-2 z-20 w-60 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-2">
            <h4 className="font-bold text-accent px-4 pb-2 border-b border-stone-700">{title}</h4>
            <div className="mt-2">
                {items ? items.map(item => (
                     <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
                        className="flex items-center px-4 py-2 text-stone-300 hover:bg-stone-700"
                        data-log-id={`sidebar-flyout-link-${item.id.toLowerCase().replace(' ', '-')}`}
                     >
                        {item.emoji} <span className="ml-2">{item.termKey ? settings.terminology[item.termKey] : item.id}</span>
                        {item.id === 'Approvals' && totalApprovals && totalApprovals > 0 && (
                            <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                                {totalApprovals > 9 ? '9+' : totalApprovals}
                            </span>
                        )}
                     </a>
                )) : (
                    <div className="px-4 py-1 text-stone-200">{title}</div>
                )}
            </div>
        </div>
    );
};


const NavLink: React.FC<{ item: SidebarLink, activePage: Page, setActivePage: (page: Page) => void, badgeCount?: number, isCollapsed: boolean }> = ({ item, activePage, setActivePage, badgeCount = 0, isCollapsed }) => {
    const { settings } = useSystemState();
    const [isHovered, setIsHovered] = useState(false);
    const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;

    const isNested = item.level > 0;
    const isActive = activePage === item.id;

    return (
        <a
          href="#"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
          data-log-id={`sidebar-link-${item.id.toLowerCase().replace(' ', '-')}`}
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
          {(badgeCount ?? 0) > 0 && (
            <span className={`absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ${isCollapsed ? 'top-1 right-1' : 'right-3 top-1/2 -translate-y-1/2'}`}>
                {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
          {isCollapsed && <FlyoutPanel title={linkName} isVisible={isHovered} />}
        </a>
    );
};

interface CollapsibleNavGroupProps {
    header: SidebarHeader;
    childItems: SidebarLink[];
    activePage: Page;
    badgeCount: number;
    isCollapsed: boolean;
    totalApprovals: number;
}

const CollapsibleNavGroup: React.FC<CollapsibleNavGroupProps> = ({ header, childItems, activePage, badgeCount, isCollapsed, totalApprovals }) => {
    const { setActivePage } = useUIDispatch();
    const isGroupActive = childItems.some(child => child.id === activePage);
    const [isOpen, setIsOpen] = useState(isGroupActive);
    const [isHovered, setIsHovered] = useState(false);

    if (isCollapsed) {
        return (
            <div 
                className="border-t border-stone-700/60 my-2 pt-2 relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    data-log-id={`sidebar-group-toggle-collapsed-${header.id}`}
                    className="relative w-full flex flex-col items-center justify-center py-2 text-lg rounded-lg text-stone-400 hover:bg-stone-700/50 hover:text-white"
                    title={header.title}
                >
                    {header.emoji && <span className="text-2xl">{header.emoji}</span>}
                    <ChevronDownIcon className={`w-4 h-4 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    {(badgeCount ?? 0) > 0 && !isOpen && (
                         <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full top-1 right-1">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    )}
                </button>
                 {isOpen && (
                    <div className="mt-1 space-y-1">
                        {childItems.map(item => (
                            <NavLink 
                                key={item.id} 
                                item={item} 
                                activePage={activePage} 
                                setActivePage={setActivePage} 
                                isCollapsed={true} 
                                badgeCount={item.id === 'Approvals' ? totalApprovals : 0}
                            />
                        ))}
                    </div>
                )}
                 <FlyoutPanel title={header.title} items={childItems} isVisible={isHovered && !isOpen} totalApprovals={totalApprovals} />
            </div>
        );
    }

    return (
        <div className="border-t border-stone-700/60 my-2 pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                data-log-id={`sidebar-group-toggle-${header.id}`}
                className="w-full flex items-center justify-between px-4 py-3 text-lg rounded-lg text-stone-300 hover:bg-stone-700/50 hover:text-white"
            >
                <div className="flex items-center">
                    {header.emoji && <span className="text-xl mr-3">{header.emoji}</span>}
                    <span className="font-semibold text-accent-light">{header.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {(badgeCount ?? 0) > 0 && !isOpen ? (
                         <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                            {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                    ) : null}
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {childItems.map(item => (
                        <NavLink 
                            key={item.id} 
                            item={item} 
                            activePage={activePage} 
                            setActivePage={setActivePage} 
                            isCollapsed={false}
                            badgeCount={item.id === 'Approvals' ? totalApprovals : 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const Sidebar: React.FC = () => {
  const { settings, isAiConfigured, chatMessages } = useSystemState();
  const { guilds } = useCommunityState();
  const { purchaseRequests, tradeOffers } = useEconomyState();
  const { quests, questCompletions } = useQuestsState();
  const { activePage, isSidebarCollapsed, isChatOpen } = useUIState();
  const { setActivePage, toggleSidebar, toggleChat } = useUIDispatch();
  const { currentUser } = useAuthState();
  const isAiAvailable = settings.enableAiFeatures && isAiConfigured;
  
  if (!currentUser) return null;

  const visibleLinks = useMemo(() => settings.sidebars.main.filter(link => {
    if (!link.isVisible) return false;
    if (link.type === 'link' && link.id === 'Suggestion Engine' && !isAiAvailable) return false;
    if (link.type === 'link' && link.id === 'Chat' && !settings.chat.enabled) return false;
    if (link.type === 'link' && link.id === 'Bug Tracker' && !settings.developerMode.enabled) return false;
    if (currentUser.role === Role.DonegeonMaster) return true;
    if (currentUser.role === Role.Gatekeeper) return link.role === Role.Gatekeeper || link.role === Role.Explorer;
    return link.role === Role.Explorer;
  }), [settings.sidebars.main, currentUser.role, isAiAvailable, settings.chat.enabled, settings.developerMode.enabled]);

  const pendingQuestApprovals = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
  const pendingPurchaseApprovals = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length;
  const pendingTrades = tradeOffers.filter(t => t.recipientId === currentUser.id && (t.status === TradeStatus.Pending || t.status === TradeStatus.OfferUpdated)).length;
  const pendingClaimsCount = quests.reduce((sum, quest) => sum + (quest.pendingClaims?.length || 0), 0);
  const totalApprovals = pendingQuestApprovals + pendingClaimsCount + (currentUser?.role === Role.DonegeonMaster ? pendingPurchaseApprovals : 0) + pendingTrades;

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    
    const unreadDms = chatMessages.filter(
        (msg: ChatMessage) => msg.recipientId === currentUser.id && 
                !msg.readBy.includes(currentUser.id) &&
                msg.senderId !== currentUser.id
    );
    const uniqueSenders = new Set(unreadDms.map(msg => msg.senderId));
    
    const userGuildIds = new Set(guilds.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
    const unreadGuilds = new Set(
        chatMessages
            .filter((msg: ChatMessage) => 
                msg.guildId && 
                userGuildIds.has(msg.guildId) && 
                !msg.readBy.includes(currentUser.id) &&
                msg.senderId !== currentUser.id
            )
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
            const childItems: SidebarLink[] = [];
            i++;
            while (i < visibleLinks.length && visibleLinks[i].level > item.level) {
                const childItem = visibleLinks[i];
                if(childItem.type === 'link') {
                    childItems.push(childItem);
                }
                i++;
            }
            
            const groupBadgeCount = childItems.reduce((sum, child) => {
                if (child.id === 'Approvals') {
                    return sum + totalApprovals;
                }
                // Can be extended for other badges in the future
                return sum;
            }, 0);
            
            navTree.push(
                <CollapsibleNavGroup 
                    key={item.id} 
                    header={item}
                    childItems={childItems}
                    activePage={activePage} 
                    badgeCount={groupBadgeCount}
                    isCollapsed={isSidebarCollapsed}
                    totalApprovals={totalApprovals}
                />
            );
        } else if (item.type === 'link') {
            if (item.id === 'Chat') {
                const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
                navTree.push(
                    <a
                      key={item.id}
                      href="#"
                      data-log-id="sidebar-chat-toggle"
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
        } else if (item.type === 'separator') {
            navTree.push(<div key={item.id} className="border-t border-stone-700/60 my-2"></div>);
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
        data-log-id="sidebar-header-logo"
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
            data-log-id="sidebar-toggle-collapse"
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