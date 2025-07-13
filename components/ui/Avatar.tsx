
import React from 'react';
import { User } from '../../types';
import { useAppState } from '../../context/AppContext';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
    const { digitalAssets } = useAppState();

    const equippedAssets = Object.entries(user.avatar)
        .map(([slot, assetId]) => {
            return digitalAssets.find(da => da.slot === slot && da.assetId === assetId);
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
                asset.imageUrl && (
                    <img
                        key={asset.id}
                        src={asset.imageUrl}
                        alt={asset.name}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ zIndex: 1 }}
                    />
                )
            ))}
        </div>
    );
};

export default Avatar;