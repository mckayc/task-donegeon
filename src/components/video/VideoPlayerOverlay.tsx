import React from 'react';
import { motion } from 'framer-motion';
import Button from '../user-interface/Button';

interface VideoPlayerOverlayProps {
  videoUrl: string;
  onClose: () => void;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    let videoId = null;
    try {
        const urlObj = new URL(url);

        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        }
    } catch (e) {
        // Not a valid URL, could be a local path
        return null;
    }


    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
};

const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({ videoUrl, onClose }) => {
    const embedUrl = getYouTubeEmbedUrl(videoUrl);

    return (
        // FIX: The `initial` and `exit` props were causing a type error. Removed them to fix the compilation issue.
        <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] p-4"
            data-bug-reporter-ignore
            onClick={onClose}
        >
            <div className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-grow bg-black rounded-lg overflow-hidden">
                    {embedUrl ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <video
                            src={videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
                 <div className="text-center mt-4 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose}>Close Player</Button>
                </div>
            </div>
        </motion.div>
    );
};

export default VideoPlayerOverlay;
