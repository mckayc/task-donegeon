import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../user-interface/Button';
import { XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../user-interface/Icons';
import { ImageSlide } from './types';

interface ImageSlideshowOverlayProps {
  images: ImageSlide[];
  onClose: () => void;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const ImageSlideshowOverlay: React.FC<ImageSlideshowOverlayProps> = ({ images, onClose }) => {
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    let newPage = page + newDirection;
    if (newPage < 0) {
      newPage = images.length - 1;
    } else if (newPage >= images.length) {
      newPage = 0;
    }
    setPage([newPage, newDirection]);
  };

  const currentImage = images[page];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] p-4"
      data-bug-reporter-ignore
      onClick={onClose}
    >
      <div className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
        <div className="absolute top-2 right-2 z-20">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircleIcon className="w-8 h-8 text-white/70 hover:text-white" />
          </Button>
        </div>
        <div className="flex-grow flex items-center justify-center relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={page}
              src={currentImage.url}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute max-w-full max-h-full object-contain"
            />
          </AnimatePresence>
        </div>
        <div className="flex-shrink-0 text-center text-white p-4 space-y-2">
            <p className="font-semibold">{currentImage.caption}</p>
            <p className="text-sm text-stone-400">{page + 1} / {images.length}</p>
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
            <Button variant="secondary" size="icon" onClick={() => paginate(-1)} className="rounded-full h-12 w-12 bg-black/30 hover:bg-black/60">
                <ChevronLeftIcon className="w-6 h-6" />
            </Button>
        </div>
         <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
            <Button variant="secondary" size="icon" onClick={() => paginate(1)} className="rounded-full h-12 w-12 bg-black/30 hover:bg-black/60">
                <ChevronRightIcon className="w-6 h-6" />
            </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageSlideshowOverlay;