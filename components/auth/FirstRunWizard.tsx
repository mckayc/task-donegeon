
import React, { useState } from 'react';
import { useAuthDispatch } from '../../context/AuthContext';
import { useGameDataDispatch } from '../../context/GameDataContext';
import { useSettings } from '../../context/SettingsContext';
import { Role } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';

const FirstRunWizard: React.FC = () => {
  const { addUser, setCurrentUser } = useAuthDispatch();
  const { populateInitialGameData } = useGameDataDispatch();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    gameName: '',
    email: '',
    birthday: '',
    password: '',
    confirmPassword: '',
    pin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) {
        setError('PIN must be 4-10 numbers.');
        return;
    }
    setError('');

    const { confirmPassword, confirmPin, ...newUserPayload } = formData;
    const newUser = {
      ...newUserPayload,
      role: Role.DonegeonMaster,
    };
    
    const createdUser = addUser(newUser);
    // After creating the admin, populate the world with sample data
    populateInitialGameData(createdUser);
    setCurrentUser(createdUser);
    // isFirstRun is now derived state, so no need to set it false manually
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="max-w-2xl w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <h1 className="font-medieval text-accent text-center mb-4">Welcome, {settings.terminology.admin}!</h1>
        <p className="text-stone-300 text-center mb-8">
          Let's set up your account. As the {settings.terminology.admin}, you will be in charge of your {settings.terminology.group.toLowerCase()}, {settings.terminology.tasks.toLowerCase()}, and adventurers.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <UserFormFields formData={formData} handleChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
              <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="PIN (4-10 digits)" id="pin" name="pin" type="password" value={formData.pin} onChange={handleChange} required />
              <Input label="Confirm PIN" id="confirmPin" name="confirmPin" type="password" value={formData.confirmPin} onChange={handleChange} required />
            </div>
          </div>
          
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="pt-4 text-center">
            <Button type="submit" className="w-full md:w-auto">Create My Account & Build the World</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FirstRunWizard;
