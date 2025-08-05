import React from 'react';
import { Dialog } from './ui/Dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ isOpen, onClose }) => {
  // In a real app, you'd handle form state and submission here
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating user...");
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Card className="border-2 border-donegeon-gold/80">
          <CardHeader>
            <CardTitle id="dialog-title">Create the Donegeon Master</CardTitle>
            <CardDescription>This will be the first and primary administrator account.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-300">First Name</label>
              <Input id="firstName" placeholder="John" required />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-300">Last Name</label>
              <Input id="lastName" placeholder="Doe" required />
            </div>
            <div className="col-span-full space-y-1">
              <label htmlFor="gameName" className="text-sm font-medium text-gray-300">Game Name</label>
              <Input id="gameName" placeholder="TheMightyWizard" required />
            </div>
             <div className="space-y-1">
              <label htmlFor="birthday" className="text-sm font-medium text-gray-300">Birthday</label>
              <Input id="birthday" type="date" required />
            </div>
             <div className="space-y-1">
              <label htmlFor="pin" className="text-sm font-medium text-gray-300">PIN</label>
              <Input id="pin" type="password" placeholder="1234" maxLength={4} required />
            </div>
             <div className="col-span-full space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create</Button>
          </CardFooter>
        </Card>
      </form>
    </Dialog>
  );
};