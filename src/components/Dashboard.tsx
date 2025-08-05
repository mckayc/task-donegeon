import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Layout } from './layout/Layout';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  return (
    <Layout onLogout={onLogout}>
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-donegeon-gold mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
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
    </Layout>
  );
};

export default Dashboard;