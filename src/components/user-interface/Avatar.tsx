import React from 'react';
import { User } from '../../types';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
    return (
        <div className={`relative flex items-center justify-center overflow-hidden bg-stone-700 ${className}`}>
            {user.profilePictureUrl ? (
                <img
                    src={user.profilePictureUrl}
                    alt={`${user.gameName}'s avatar`}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="font-bold text-xl text-stone-300">
                    {user.gameName.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
};

export default Avatar;