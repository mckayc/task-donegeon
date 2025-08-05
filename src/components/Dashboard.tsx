import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { LogOut } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-medieval text-donegeon-text animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold text-donegeon-gold" style={{ textShadow: '2px 2px 4px #000' }}>
          Welcome, Donegeon Master!
        </h1>
        <p className="text-lg md:text-xl text-donegeon-text mt-2">Your realm awaits your command.</p>
      </header>

      <main className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">This is your command center. More features coming soon!</p>
            <Button onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
