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
                        onClick={(e) => { e.preventDefault(); if (item.id !== 'Chat') { setActivePage(item.id as Page); } }}
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


const NavLink: React.FC<{ item: SidebarLink, activePage: Page, onNavigate: (page: Page) => void, badgeCount?: number, isCollapsed: boolean }> = ({ item, activePage, onNavigate, badgeCount = 0, isCollapsed }) => {
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
          onClick={(e) => { e.preventDefault(); if (item.id !== 'Chat') { onNavigate(item.id as Page); } }}
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

const NavHeader: React.FC<{ item: SidebarHeader, isCollapsed: boolean, onToggle: () => void, isOpen: boolean }> = ({ item, isCollapsed, onToggle, isOpen }) => {
    if (isCollapsed) {
        return (
            <div className="flex justify-center my-4">
                <span className="text-xl">{item.emoji}</span>
            </div>
        )
    }
    return (
        <button onClick={onToggle} className="w-full flex items-center justify-between text-left px-4 py-2 mt-4 text-stone-400 hover:text-white transition-colors">
            <span className="font-bold uppercase text-sm tracking-wider">{item.title}</span>
            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    )
};

const Sidebar: React.FC = () => {
    const { activePage, isSidebarCollapsed, isMobileView } = useUIState();
    const { setActivePage, toggleSidebar } = useUIDispatch();
    const { currentUser } = useAuthState();
    const { questCompletions } = useQuestsState();
    const { purchaseRequests, tradeOffers } = useEconomyState();
    const { guilds } = useCommunityState();
    const { settings, chatMessages } = useSystemState();
    const [openHeaders, setOpenHeaders] = useState<string[]>(() => {
        const stored = localStorage.getItem('sidebarOpenHeaders');
        return stored ? JSON.parse(stored) : ['header-character'];
    });
    
    const sidebarConfig = settings.sidebars?.main || [];

    const handleHeaderToggle = (headerId: string) => {
        setOpenHeaders(prev => {
            const newOpenHeaders = prev.includes(headerId)
                ? prev.filter(id => id !== headerId)
                : [...prev, headerId];
            localStorage.setItem('sidebarOpenHeaders', JSON.stringify(newOpenHeaders));
            return newOpenHeaders;
        });
    };

    const handleNavigate = (page: Page) => {
        setActivePage(page);
        if (isMobileView) {
            toggleSidebar();
        }
    };
    
    const totalApprovals = useMemo(() => {
        if (!currentUser || currentUser.role === Role.Explorer) return 0;
        
        const isGatekeeper = currentUser.role === Role.Gatekeeper;
        const isAdmin = currentUser.role === Role.DonegeonMaster;

        const pendingQuests = questCompletions.filter(q => q.status === QuestCompletionStatus.Pending).length;
        const pendingPurchases = isAdmin ? purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length : 0;
        const pendingTrades = tradeOffers.filter(t => t.recipientId === currentUser.id && (t.status === TradeStatus.Pending || t.status === TradeStatus.OfferUpdated)).length;
        
        return pendingQuests + pendingPurchases + pendingTrades;
    }, [currentUser, questCompletions, purchaseRequests, tradeOffers]);

    const unreadChatCount = useMemo(() => {
        if (!currentUser || !settings.chat.enabled) return 0;
        
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
    }, [chatMessages, currentUser, guilds, settings.chat.enabled]);

    if (!currentUser) return null;

    const roleOrder = [Role.Explorer, Role.Gatekeeper, Role.DonegeonMaster];
    const userRoleIndex = roleOrder.indexOf(currentUser.role);
    
    const visibleItems = sidebarConfig.filter(item => {
        if (!item.isVisible) return false;
        const itemRoleIndex = roleOrder.indexOf(item.role as Role);
        return userRoleIndex >= itemRoleIndex;
    });
    
    return (
        <div className={`relative flex flex-col bg-stone-900/95 backdrop-blur-sm border-r border-stone-700/50 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
             <div className={`flex items-center justify-between ${isSidebarCollapsed ? 'h-20 justify-center' : 'h-20 px-6'}`}>
                {!isSidebarCollapsed && <h1 className="text-2xl font-medieval text-emerald-400">{settings.terminology.appName}</h1>}
                <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-md hover:bg-stone-700/50 text-stone-400 hover:text-white transition-colors ${isSidebarCollapsed ? 'absolute right-0 translate-x-1/2 top-6 bg-stone-800 border border-stone-700 rounded-full' : ''}`}
                >
                    {isSidebarCollapsed ? <ArrowRightIcon className="w-5 h-5" /> : <ArrowLeftIcon className="w-5 h-5" />}
                </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                {visibleItems.map(item => {
                    if(item.type === 'separator') return <hr key={item.id} className="border-stone-700 my-3" />
                    
                    const isHeaderOpen = !isSidebarCollapsed && openHeaders.includes(item.id);

                    if(item.type === 'header') {
                        const childLinks = visibleItems.filter(child => child.level > item.level && visibleItems.indexOf(child) > visibleItems.indexOf(item) && !visibleItems.slice(visibleItems.indexOf(item) + 1, visibleItems.indexOf(child)).some(i => i.type === 'header' && i.level <= item.level));
                        if(childLinks.length === 0) return null;
                        
                        return (
                            <React.Fragment key={item.id}>
                                <NavHeader item={item} isCollapsed={isSidebarCollapsed} isOpen={isHeaderOpen} onToggle={() => handleHeaderToggle(item.id)} />
                                {isHeaderOpen && childLinks.map(child => {
                                    if(child.type !== 'link') return null;
                                    const badgeCount = child.id === 'Approvals' ? totalApprovals : child.id === 'Chat' ? unreadChatCount : 0;
                                    return <NavLink key={child.id} item={child} activePage={activePage} onNavigate={handleNavigate} badgeCount={badgeCount} isCollapsed={isSidebarCollapsed}/>
                                })}
                            </React.Fragment>
                        );
                    }
                    if(item.level === 0) {
                         const badgeCount = item.id === 'Approvals' ? totalApprovals : item.id === 'Chat' ? unreadChatCount : 0;
                        return <NavLink key={item.id} item={item} activePage={activePage} onNavigate={handleNavigate} badgeCount={badgeCount} isCollapsed={isSidebarCollapsed} />
                    }
                    return null;
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
