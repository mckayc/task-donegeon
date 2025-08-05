import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {user?.username || 'Explorer'}!</CardTitle>
        <CardDescription>Your adventure awaits. What tasks will you conquer today?</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-brand-brown-300 py-8">
            (The main dashboard and game features will be built here.)
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" onClick={logout} className="w-full">
          Log Out
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Dashboard;
