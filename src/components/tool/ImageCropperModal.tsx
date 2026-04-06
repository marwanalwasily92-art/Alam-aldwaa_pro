import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import { Loader2, Crop as CropIcon, Image as ImageIcon } from 'lucide-react';

interface ImageCropperModalProps {
  cropImage: string | null;
  crop: Crop | undefined;
  setCrop: (c: Crop) => void;
  setCompletedCrop: (c: PixelCrop) => void;
  imgRef: React.RefObject<HTMLImageElement | null>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onCancel: () => void;
  onCrop: () => void;
  onSkipCrop: () => void;
  isProcessing: boolean;
  completedCrop: PixelCrop | undefined;
}

export default function ImageCropperModal({
  cropImage,
  crop,
  setCrop,
  setCompletedCrop,
  imgRef,
  onImageLoad,
  onCancel,
  onCrop,
  onSkipCrop,
  isProcessing
}: ImageCropperModalProps) {
  return (
    <AnimatePresence mode="wait">
      {cropImage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-h-full"
            >
              <img 
                ref={imgRef}
                src={cropImage} 
                alt="Crop me" 
                onLoad={onImageLoad}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </ReactCrop>
          </div>
          <div className="bg-slate-900 p-6 flex flex-col gap-4">
            <div className="text-white/60 text-xs text-center">
              قم بتحريك زوايا الإطار لاختيار الجزء المطلوب
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={onSkipCrop}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ImageIcon className="w-5 h-5" />
                <span>رفع بدون قص</span>
              </button>
              <button
                onClick={onCrop}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CropIcon className="w-5 h-5" />
                    <span>قص الصورة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
