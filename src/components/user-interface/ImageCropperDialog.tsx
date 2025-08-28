import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import Button from './Button';

interface ImageCropperDialogProps {
  imageSrc: string;
  onComplete: (croppedFile: File | null) => void;
}

const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({ imageSrc, onComplete }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }

  function handleConfirmCrop() {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    if (!image || !canvas || !completedCrop) {
      throw new Error('Crop canvas does not exist');
    }
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        onComplete(null);
        return;
      }
      const croppedFile = new File([blob], 'profile.jpeg', { type: 'image/jpeg' });
      onComplete(croppedFile);
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={() => onComplete(null)}>
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-medieval text-emerald-400 mb-4">Crop Your Avatar</h2>
        <div className="flex justify-center">
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
            >
                <img ref={imgRef} alt="Crop me" src={imageSrc} onLoad={onImageLoad} className="max-h-[60vh]"/>
            </ReactCrop>
        </div>
        {/* Hidden canvas for generating the final cropped image */}
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />

        <div className="flex justify-end space-x-4 pt-4 mt-4 border-t border-stone-700/60">
          <Button variant="secondary" onClick={() => onComplete(null)}>Cancel</Button>
          <Button onClick={handleConfirmCrop}>Confirm Crop</Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperDialog;