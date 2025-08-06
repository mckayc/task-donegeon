import React from 'react';

interface ImagePreviewDialogProps {
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({ imageUrl, altText, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div 
        className="relative max-w-4xl max-h-[90vh]"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking on the image container
      >
        <img 
          src={imageUrl} 
          alt={altText || 'Image preview'} 
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label="Close image preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ImagePreviewDialog;