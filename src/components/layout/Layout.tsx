import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-donegeon-gray-dark font-medieval text-donegeon-text">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        onLogout={onLogout} 
      />
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />
        <main className="animate-fade-in">{children}</main>
      </div>
    </div>
  );
};
