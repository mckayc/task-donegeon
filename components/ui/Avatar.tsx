

import React from 'react';
import { User } from '../../types';
import { useGameDataState } from '../../context/AppContext';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
    const { gameAssets } = useGameDataState();

    const equippedAssets = Object.entries(user.avatar)
        .map(([_, assetId]) => {
            return gameAssets.find(ga => ga.id === assetId);
        })
        .filter((asset): asset is NonNullable<typeof asset> => !!asset);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {user.profilePictureUrl ? (
                <img
                    src={user.profilePictureUrl}
                    alt={`${user.gameName}'s profile`}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : equippedAssets.length === 0 ? (
                <span className="font-bold text-xl text-stone-300">
                    {user.gameName.charAt(0).toUpperCase()}
                </span>
            ) : (
                equippedAssets.map(asset => (
                    <img
                        key={asset.id}
                        src={asset.url}
                        alt={asset.name}
                        className="absolute inset-0 w-full h-full object-contain"
                    />
                ))
            )}
        </div>
    );
};

export default Avatar;