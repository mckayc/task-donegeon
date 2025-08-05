
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronLeft, LayoutDashboard, Swords, Store, ScrollText, Users, Settings, FolderCog, Library } from 'lucide-react';
import { Button } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const navLinks = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', type: 'link' },
  { name: 'Quests', icon: Swords, page: 'quests', type: 'link' },
  { name: 'Market', icon: Store, page: 'market', type: 'link' },
  { name: 'Chronicles', icon: ScrollText, page: 'chronicles', type: 'link' },
  { name: 'Guilds', icon: Users, page: 'guilds', type: 'link' },
  { type: 'heading', name: 'Admin Tools' },
  { name: 'Manage Assets', icon: FolderCog, page: 'manage-assets', type: 'link' },
  { name: 'Asset Library', icon: Library, page: 'asset-library', type: 'link' },
  { name: 'Settings', icon: Settings, page: 'settings', type: 'link' },
];

const NavItem = ({ link, isOpen, onNavigate }: { link: any; isOpen: boolean; onNavigate: (page: string) => void; }) => {
  const isClickable = ['dashboard', 'quests', 'manage-assets', 'asset-library'].includes(link.page);
  return (
    <button
        onClick={() => isClickable && onNavigate(link.page)}
        className={`flex items-center p-2 text-base font-normal text-donegeon-text/80 rounded-lg w-full text-left transition-colors ${
        isClickable 
            ? 'hover:bg-donegeon-gray/50 cursor-pointer' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        disabled={!isClickable}
        aria-label={link.name}
    >
        <link.icon className="w-6 h-6 text-donegeon-gold" />
        <AnimatePresence>
        {isOpen && (
            <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="ml-3 whitespace-nowrap"
            >
            {link.name}
            </motion.span>
        )}
        </AnimatePresence>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen, onLogout, onNavigate }) => {
  const sidebarVariants = {
    open: { width: '16rem' }, // 256px
    closed: { width: '5rem' }, // 80px
  };

  const mobileSidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-4 border-b border-donegeon-gray">
        <AnimatePresence>
            {isOpen && (
                <motion.h1 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0}}
                    className="text-xl font-bold text-donegeon-gold whitespace-nowrap"
                >
                    Task Donegeon
                </motion.h1>
            )}
        </AnimatePresence>
        <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:flex bg-transparent border-donegeon-gray/50 hover:bg-donegeon-gray/80"
        >
            <ChevronLeft className={`h-6 w-6 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
        </Button>
         <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden bg-transparent border-donegeon-gray/50 hover:bg-donegeon-gray/80"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => (
            link.type === 'heading' ? (
                <h3 key={link.name} className={`px-2 pt-4 pb-1 text-xs font-semibold text-donegeon-text/60 uppercase whitespace-nowrap ${isOpen ? '' : 'text-center'}`}>
                    {isOpen ? link.name : '···'}
                </h3>
            ) : (
                <NavItem key={link.name} link={link} isOpen={isOpen} onNavigate={onNavigate} />
            )
        ))}
      </nav>

      <div className="p-4 border-t border-donegeon-gray">
        <div className="flex items-center p-2 text-base font-normal text-donegeon-text/80 rounded-lg">
            <img src="https://i.pravatar.cc/40?u=admin" alt="User Avatar" className="w-10 h-10 rounded-full"/>
             <AnimatePresence>
                {isOpen && (
                     <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="ml-3 whitespace-nowrap"
                    >
                        <p className="text-sm font-semibold">DM Name</p>
                        <p className="text-xs text-donegeon-text/60">Donegeon Master</p>
                    </motion.div>
                )}
             </AnimatePresence>
        </div>
        <Button onClick={onLogout} variant="outline" className="w-full mt-4">
          <LogOut className={`w-5 h-5 ${isOpen ? 'mr-3' : ''}`} />
          <AnimatePresence>
             {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="whitespace-nowrap"
                >
                    Log Out
                 </motion.span>
             )}
          </AnimatePresence>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-donegeon-brown-dark border-r border-donegeon-gray z-40"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
       <AnimatePresence>
        {isMobileOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
                <motion.aside
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={mobileSidebarVariants}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="lg:hidden flex flex-col fixed top-0 left-0 h-full w-64 bg-donegeon-brown-dark border-r border-donegeon-gray z-50"
                >
                    <SidebarContent />
                </motion.aside>
            </>
        )}
       </AnimatePresence>
    </>
  );
};
