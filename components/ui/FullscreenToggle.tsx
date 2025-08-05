
import React, { useState, useEffect } from 'react';
import { EnterFullscreenIcon, ExitFullscreenIcon } from './Icons';

const FullscreenToggle: React.FC = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check for fullscreen support on component mount.
        setIsSupported(!!document.documentElement.requestFullscreen);

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Cleanup the event listener on component unmount.
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleToggleFullscreen = () => {
        if (!isSupported) return;

        if (isFullscreen) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };

    if (!isSupported) {
        return null;
    }

    return (
        <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-full text-stone-300 hover:bg-stone-700/50 hover:text-white transition-colors"
            aria-label="Toggle Fullscreen"
        >
            {isFullscreen
                ? <ExitFullscreenIcon className="w-6 h-6" />
                : <EnterFullscreenIcon className="w-6 h-6" />
            }
        </button>
    );
};

export default FullscreenToggle;
