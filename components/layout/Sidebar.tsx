import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Role, Page, QuestCompletionStatus, PurchaseRequestStatus, Terminology, SidebarConfigItem, SidebarLink, SidebarHeader } from '../../types';
import { ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

const NavLink: React.FC<{ item: SidebarLink, activePage: Page, setActivePage: (page: Page) => void, badgeCount?: number, isCollapsed: boolean }> = ({ item, activePage, setActivePage, badgeCount = 0, isCollapsed }) => {
    const { settings } = useAppState();
    const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
    const isNested = item.level > 0;
    const isActive = activePage === item.id;

    const linkContent = (
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
        className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 ${isNested ? 'pl-12' : 'px-4'} ${ isCollapsed ? 'justify-center' : ''} ${
          isActive
            ? 'bg-primary/20 text-primary-foreground'
            : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'
        }`}
        style={!isCollapsed ? { paddingLeft: isNested ? `${1.5 + item.level * 1.5}rem` : '1rem' } : {}}
      >
        <span className={`text-xl ${!isCollapsed ? 'mr-3' : ''}`}>{item.emoji}</span>
        {!isCollapsed && <span>{linkName}</span>}
        {(badgeCount ?? 0) > 0 && (
          <span className={`absolute flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ${isCollapsed ? 'top-1 right-1' : 'right-3 top-1/2 -translate-y-1/2'}`}>
              {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </a>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{linkName}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
};

interface CollapsibleNavGroupProps {
    header: SidebarHeader;
    childItems: SidebarLink[];
    activePage: Page;
    badgeCount: number;
    isCollapsed: boolean;
}

const CollapsibleNavGroup: React.FC<CollapsibleNavGroupProps> = ({ header, childItems, activePage, badgeCount, isCollapsed }) => {
    const { setActivePage } = useAppDispatch();
    const isGroupActive = childItems.some(child => child.id === activePage);
    const [isOpen, setIsOpen] = useState(isGroupActive);

    if (isCollapsed) {
        // In collapsed mode, we don't render the header, just the child items directly.
        // A more advanced implementation could use a popover.
        return (
             <div className="border-t border-border my-2 pt-2">
                 {childItems.map(item => (
                    <NavLink key={item.id} item={item} activePage={activePage} setActivePage={setActivePage} isCollapsed={true} badgeCount={item.id === 'Approvals' ? badgeCount : 0} />
                ))}
            </div>
        );
    }

    return (
        <div className="border-t border-border my-2 pt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-lg rounded-lg text-foreground/80 hover:bg-accent/50 hover:text-white"
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
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {childItems.map(item => (
                        <NavLink key={item.id} item={item} activePage={activePage} setActivePage={setActivePage} isCollapsed={false} badgeCount={item.id === 'Approvals' ? badgeCount : 0} />
                    ))}
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
    if (link.type === 'link' && link.id === 'AI Studio' && !isAiAvailable) return false;
    if (link.type === 'link' && link.id === 'Chat' && !settings.chat.enabled) return false;
    if (currentUser.role === Role.DonegeonMaster) return true;
    if (currentUser.role === Role.Gatekeeper) return link.role === Role.Gatekeeper || link.role === Role.Explorer;
    return link.role === Role.Explorer;
  }), [settings.sidebars.main, currentUser.role, isAiAvailable, settings.chat.enabled]);

  const pendingQuestApprovals = questCompletions.filter(c => c.status === QuestCompletionStatus.Pending).length;
  const pendingPurchaseApprovals = purchaseRequests.filter(p => p.status === PurchaseRequestStatus.Pending).length;
  const totalApprovals = pendingQuestApprovals + (currentUser?.role === Role.DonegeonMaster ? pendingPurchaseApprovals : 0);

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    
    const unreadDms = chatMessages.filter(
        msg => msg.recipientId === currentUser.id && !msg.readBy.includes(currentUser.id)
    );
    const uniqueSenders = new Set(unreadDms.map(msg => msg.senderId));
    
    const userGuildIds = new Set(guilds.filter(g => g.memberIds.includes(currentUser.id)).map(g => g.id));
    const unreadGuilds = new Set(
        chatMessages
            .filter(msg => msg.guildId && userGuildIds.has(msg.guildId) && !msg.readBy.includes(currentUser.id) && msg.senderId !== currentUser.id)
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
                />
            );
        } else if (item.type === 'link') {
            if (item.id === 'Chat') {
                const linkName = item.termKey ? settings.terminology[item.termKey] : item.id;
                navTree.push(
                    <a
                      key={item.id}
                      href="#"
                      onClick={(e) => { e.preventDefault(); toggleChat(); }}
                      className={`relative flex items-center py-3 text-lg rounded-lg transition-colors duration-200 px-4 ${isSidebarCollapsed ? 'justify-center' : ''} text-foreground/80 hover:bg-accent/50 hover:text-white`}
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
            navTree.push(<div key={item.id} className="border-t border-border my-2"></div>);
            i++;
        } else {
            i++;
        }
    }
    return navTree;
  }

  return (
    <div className={`flex flex-col flex-shrink-0 transition-all duration-300 bg-card ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
      <button 
        onClick={() => setActivePage('Dashboard')} 
        className="flex items-center justify-center h-20 border-b cursor-pointer hover:bg-accent/20 transition-colors" 
      >
        <h1 className={`font-display text-accent transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>{settings.terminology.appName}</h1>
      </button>
      <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {renderNavItems()}
      </nav>
      <div className="px-2 py-4 border-t">
         <Tooltip>
            <TooltipTrigger asChild>
                <button 
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center py-2 text-foreground/60 hover:bg-accent/50 hover:text-white rounded-lg transition-colors"
                >
                    {isSidebarCollapsed ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side="right">
                <p>{isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</p>
            </TooltipContent>
         </Tooltip>
      </div>
    </div>
  );
};

export default Sidebar;