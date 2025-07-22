import React from 'react';

interface DynamicIconProps {
  iconType: 'emoji' | 'image';
  icon: string; // The emoji or a fallback
  imageUrl?: string;
  className?: string;
  altText?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconType, icon, imageUrl, className, altText }) => {
    if (iconType === 'image' && imageUrl) {
        // For images, we assume className provides sizing like w-8 h-8
        return <img src={imageUrl} alt={altText || 'icon'} className={`${className} object-contain`} />;
    }

    // For emojis, we assume className provides font-size like text-2xl
    return (
        <span className={className} role="img" aria-label={altText || 'icon'}>
            {icon}
        </span>
    );
};

export default DynamicIcon;
