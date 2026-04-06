import React from 'react';
import { Camera, Scan, HelpCircle, Plus, Check, X, Pill, FileText, Smartphone, Package } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToolCoverProps {
  toolId: string;
  imageUrl?: string;
}

export const ToolCover: React.FC<ToolCoverProps> = ({ toolId, imageUrl }) => {
  const renderOverlay = () => {
    switch (toolId) {
      case 'drug_id':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Scanning Area */}
            <div className="absolute inset-0 border-2 border-dashed border-blue-400/20 rounded-3xl flex items-center justify-center">
              <motion.div 
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(96,165,250,1)] z-10"
              />
            </div>
          </div>
        );
      case 'prescription':
      case 'skin':
      case 'lab':
      case 'radiology':
      case 'interaction':
      case 'consultation':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-slate-100" />
      )}
      {renderOverlay()}
      {/* Glass Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
    </div>
  );
};
