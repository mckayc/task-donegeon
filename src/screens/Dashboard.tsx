
import React from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

interface DashboardProps {
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    return (
        <div className="min-h-screen bg-donegeon-gray-dark flex flex-col items-center justify-center p-4 font-medieval text-donegeon-text animate-fade-in">
            <main className="w-full max-w-4xl">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Dungeon Master's Dashboard</CardTitle>
                        <Button variant="outline" onClick={onLogout}>Logout</Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg">Welcome to your domain! From here you shall manage quests and adventurers.</p>
                        <div className="mt-8 p-8 border-2 border-dashed border-donegeon-gray rounded-lg text-center">
                            <p className="text-gray-400">The adventure begins here. Future features will populate this dashboard.</p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};
