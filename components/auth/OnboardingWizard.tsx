
import React from 'react';
import { useData } from '../../context/DataProvider';
import { useAuthState, useAuthDispatch } from '../../context/AuthContext';
import Button from '../user-interface/Button';

const OnboardingWizard: React.FC = () => {
    const { settings } = useData();
    const { currentUser } = useAuthState();
    const { markUserAsOnboarded } = useAuthDispatch();

    if (!currentUser) return null;

    const handleClose = () => {
        markUserAsOnboarded(currentUser.id);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="max-w-lg w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 text-center">
                <h1 className="text-4xl font-medieval text-accent mb-4">Welcome, {currentUser.gameName}!</h1>
                <p className="text-stone-300 mb-6">
                    You've joined the world of {settings.terminology.appName}. Here, completing your assigned {settings.terminology.tasks.toLowerCase()} will earn you {settings.terminology.points.toLowerCase()} and {settings.terminology.xp.toLowerCase()}. Spend them in the {settings.terminology.shoppingCenter.toLowerCase()} to get cool rewards!
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
