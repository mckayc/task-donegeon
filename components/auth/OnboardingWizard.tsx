import React from 'react';
import { useAuth, useAuthDispatch } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Button from '../ui/Button';

const OnboardingWizard: React.FC = () => {
    const { currentUser } = useAuth();
    const { markUserAsOnboarded } = useAuthDispatch();
    const { settings } = useSettings();

    if (!currentUser) return null;

    const handleClose = () => {
        markUserAsOnboarded(currentUser.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="max-w-lg w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 text-center">
                <h1 className="text-4xl font-medieval text-accent mb-4">Welcome, {currentUser.gameName}!</h1>
                <p className="text-stone-300 mb-6">
                    You've joined the world of {settings.terminology.appName}. Here, completing your assigned {settings.terminology.tasks} will earn you {settings.terminology.points} and {settings.terminology.xp}. Spend them in the {settings.terminology.shoppingCenter} to get cool rewards!
                </p>
                <p className="text-stone-400 text-sm mb-8">
                    Check the "{settings.terminology.tasks}" page for your first adventure. Good luck!
                </p>
                <Button onClick={handleClose}>Let's Go!</Button>
            </div>
        </div>
    );
};

export default OnboardingWizard;
