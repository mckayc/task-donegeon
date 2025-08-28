import React from 'react';
import { User } from '../../types';
import { useEconomyState } from '../../context/EconomyContext';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
    const { gameAssets } = useEconomyState();

    const equippedAssets = Object.entries(user.avatar)
        .map(([_, assetId]) => {
            return gameAssets.find(ga => ga.id === assetId);
        })
        .filter((asset): asset is NonNullable<typeof asset> => !!asset && !!asset.imageUrl);

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Background Layer */}
            {user.profilePictureUrl ? (
                <img
                    src={user.profilePictureUrl}
                    alt="Profile background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                // Only show initial if there are NO equipped assets either
                equippedAssets.length === 0 && (
                    <span className="font-bold text-xl text-stone-300">
                        {user.gameName.charAt(0).toUpperCase()}
                    </span>
                )
            )}
            
            {/* Foreground (Equipped Items) Layer */}
            {equippedAssets.map(asset => (
                <img
                    key={asset.id}
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            ))}
        </div>
    );
};

export default Avatar;