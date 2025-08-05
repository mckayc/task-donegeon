
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Layout } from './layout/Layout';
import QuestsPage from '../pages/QuestsPage';
import ManageAssetsPage from '../pages/ManageAssetsPage';
import AssetLibraryPage from '../pages/AssetLibraryPage';

interface DashboardProps {
  onLogout: () => void;
}

const DashboardContent: React.FC = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-donegeon-accent mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
            Dashboard
        </h1>
        <Card>
        <CardHeader>
            <CardTitle>Welcome, Donegeon Master!</CardTitle>
        </CardHeader>
        <CardContent>
            <p>Your realm awaits. Use the sidebar to navigate and manage your quests.</p>
            <p className="mt-4 text-sm text-donegeon-text/70">More features coming soon!</p>
        </CardContent>
        </Card>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const handleNavigate = (page: string) => {
      setCurrentPage(page);
  };

  const renderPage = () => {
      switch(currentPage) {
          case 'quests':
              return <QuestsPage />;
          case 'manage-assets':
              return <ManageAssetsPage />;
          case 'asset-library':
              return <AssetLibraryPage />;
          case 'dashboard':
          default:
              return <DashboardContent />;
      }
  };

  return (
    <Layout onLogout={onLogout} onNavigate={handleNavigate}>
        {renderPage()}
    </Layout>
  );
};

export default Dashboard;