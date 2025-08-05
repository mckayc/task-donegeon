import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  return (
    <header className="sticky top-0 bg-donegeon-brown-dark/80 backdrop-blur-sm z-30">
      <div className="flex items-center justify-between h-16 px-4 border-b border-donegeon-gray sm:px-6 lg:px-8">
        <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={onMobileMenuToggle}
              className="lg:hidden mr-4 bg-transparent border-donegeon-gray/50 hover:bg-donegeon-gray/80"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
            {/* Future home for breadcrumbs or guild toggle */}
        </div>

        <div className="flex items-center gap-4">
             {/* Future home for search, notifications, etc. */}
        </div>
      </div>
    </header>
  );
};
