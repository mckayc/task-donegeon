import React, { useEffect, useRef } from 'react';
import { User } from '../../types';
import { useAppState } from '../../context/AppContext';

interface AvatarProps {
  user: User;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, className }) => {
  const { svgContent } = useAppState();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgContent || !containerRef.current) return;

    const div = containerRef.current;
    if (div.innerHTML === '' || !div.querySelector('svg')) {
      div.innerHTML = svgContent;
    }
    
    const svgNode = div.querySelector('svg');
    if (!svgNode) return;

    const avatarConfig = user.avatar || {};
    const allSlots = ['hair', 'shirt', 'pants']; // Define all possible slots here

    allSlots.forEach(slot => {
        const slotGroup = svgNode.querySelector(`#${slot}`);
        if (slotGroup) {
            // Hide all children within the slot group first
            Array.from(slotGroup.children).forEach(child => {
                if (child instanceof SVGElement) {
                    child.style.display = 'none';
                }
            });
            // Then show the selected asset if it exists
            const assetId = avatarConfig[slot];
            if (assetId) {
                const assetToShow = slotGroup.querySelector(`#${assetId}`);
                if (assetToShow && assetToShow instanceof SVGElement) {
                    assetToShow.style.display = 'block';
                }
            }
        }
    });

  }, [svgContent, user.avatar]);


  if (!svgContent) {
    return (
        <div className={`flex items-center justify-center bg-stone-700 rounded-full ${className}`}>
             <span className="font-bold text-xl text-stone-300">
                {user.gameName.charAt(0).toUpperCase()}
             </span>
        </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
    />
  );
};

export default Avatar;