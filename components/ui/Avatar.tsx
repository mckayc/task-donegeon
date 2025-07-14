
import React from 'react';
import { User } from '../../types';
import { useAppState } from '../../context/AppContext';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
    const { gameAssets } = useAppState();

    const equippedAssets = Object.entries(user.avatar)
        .map(([_, assetId]) => {
            return gameAssets.find(ga => ga.id === assetId);
        })
        .filter((asset): asset is NonNullable<typeof asset> => !!asset);

    if (equippedAssets.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-stone-700 rounded-full ${className}`}>
                <span className="font-bold text-xl text-stone-300">
                    {user.gameName.charAt(0).toUpperCase()}
                </span>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full ${className || ''}`}>
            {equippedAssets.map(asset => (
                <img
                    key={asset.id}
                    src={asset.url}
                    alt={asset.name}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ zIndex: 1 }}
                />
            ))}
        </div>
    );
};

export default Avatar;
