
import React, { useState } from 'react';
import { Dialog } from './ui/Dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LoaderCircle } from 'lucide-react';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (token: string) => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gameName: '',
    birthday: '',
    pin: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, isInitialSetup: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user.');
      }

      const { token } = await response.json();
      onUserCreated(token);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
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
              <Input id="firstName" placeholder="John" required value={formData.firstName} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="space-y-1">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-300">Last Name</label>
              <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="col-span-full space-y-1">
              <label htmlFor="gameName" className="text-sm font-medium text-gray-300">Game Name</label>
              <Input id="gameName" placeholder="TheMightyWizard" required value={formData.gameName} onChange={handleChange} disabled={isSubmitting} />
            </div>
             <div className="space-y-1">
              <label htmlFor="birthday" className="text-sm font-medium text-gray-300">Birthday</label>
              <Input id="birthday" type="date" value={formData.birthday} onChange={handleChange} disabled={isSubmitting} />
            </div>
             <div className="space-y-1">
              <label htmlFor="pin" className="text-sm font-medium text-gray-300">PIN</label>
              <Input id="pin" type="password" placeholder="1234" maxLength={4} value={formData.pin} onChange={handleChange} disabled={isSubmitting} />
            </div>
             <div className="col-span-full space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
              <Input id="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} disabled={isSubmitting} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch">
            {error && <p className="text-sm text-donegeon-red mb-4 text-center">{error}</p>}
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create'}</Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Dialog>
  );
};
