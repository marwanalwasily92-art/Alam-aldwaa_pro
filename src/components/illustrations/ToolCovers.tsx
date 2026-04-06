import React from 'react';
import { Check, X, HelpCircle, Scan, FileSearch, Stethoscope } from 'lucide-react';

// 1. تحليل الروشتة (صورة روشتة حقيقية مع إطار مسح بالكاميرا)
export const PrescriptionCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=600" 
      alt="Prescription" 
      className="absolute inset-0 w-full h-full object-cover opacity-70"
    />
    <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
    
    {/* Phone Scanner Overlay */}
    <div className="absolute inset-4 border-2 border-white/60 rounded-xl flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-400/0 via-blue-400/20 to-blue-400/0 animate-[scan_3s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-[scan-line_3s_ease-in-out_infinite]" />
      <Scan className="w-8 h-8 text-white/50" />
    </div>
  </div>
);

// 2. كاشف الأدوية (صورة أدوية حقيقية تتوسطها علامة استفهام)
export const DrugIdCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600" 
      alt="Medications" 
      className="absolute inset-0 w-full h-full object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-orange-900/30 mix-blend-multiply" />
    
    {/* Question Mark Overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center border border-white/40 shadow-xl">
        <HelpCircle className="w-10 h-10 text-white drop-shadow-md" />
      </div>
    </div>
  </div>
);

// 3. فحص البشرة (صورة جلد حقيقية مع إطار تركيز الكاميرا)
export const SkinCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1606902965551-dce093cda6e7?auto=format&fit=crop&q=80&w=600" 
      alt="Skin Examination" 
      className="absolute inset-0 w-full h-full object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply" />
    
    {/* Camera Focus Overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-20 h-20 border-2 border-emerald-400/80 rounded-lg relative">
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
        </div>
      </div>
    </div>
  </div>
);

// 4. نتائج الفحص المخبري (صورة تقارير حقيقية مع عدسة مكبرة)
export const LabCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600" 
      alt="Lab Results" 
      className="absolute inset-0 w-full h-full object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-rose-900/20 mix-blend-multiply" />
    
    {/* Magnifying Glass Overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/30 shadow-xl">
        <FileSearch className="w-10 h-10 text-white drop-shadow-md" />
      </div>
    </div>
  </div>
);

// 5. كاشف التداخلات (صورة أدوية حقيقية مع معادلات التداخل)
export const InteractionCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1550572017-edb3f115209c?auto=format&fit=crop&q=80&w=600" 
      alt="Drug Interactions" 
      className="absolute inset-0 w-full h-full object-cover opacity-60"
    />
    <div className="absolute inset-0 bg-slate-900/40" />
    
    {/* Equations Overlay */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
      {/* Safe Interaction */}
      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 shadow-lg w-full max-w-[180px] justify-between">
        <div className="flex items-center gap-1 text-white text-sm">
          <span>💊</span> <span className="text-white/70 text-xs">+</span> <span>💉</span>
        </div>
        <span className="text-white/70 text-xs">=</span>
        <div className="bg-green-500/20 p-1 rounded-full">
          <Check className="w-4 h-4 text-green-400" strokeWidth={3} />
        </div>
      </div>
      
      {/* Dangerous Interaction */}
      <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30 shadow-lg w-full max-w-[180px] justify-between">
        <div className="flex items-center gap-1 text-white text-sm">
          <span>💊</span> <span className="text-white/70 text-xs">+</span> <span>💊</span>
        </div>
        <span className="text-white/70 text-xs">=</span>
        <div className="bg-red-500/20 p-1 rounded-full">
          <X className="w-4 h-4 text-red-400" strokeWidth={3} />
        </div>
      </div>
    </div>
  </div>
);

// 6. محلل التقارير والأشعة (صورة أشعة وتقرير حقيقي)
export const RadiologyCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=600" 
      alt="Radiology and Reports" 
      className="absolute inset-0 w-full h-full object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-cyan-900/30 mix-blend-multiply" />
    
    {/* Analysis Overlay */}
    <div className="absolute bottom-3 right-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/50">
      <div className="h-1.5 w-1/3 bg-slate-200 rounded-full mb-1.5" />
      <div className="h-1.5 w-2/3 bg-slate-200 rounded-full mb-1.5" />
      <div className="h-1.5 w-1/2 bg-cyan-500/50 rounded-full" />
    </div>
  </div>
);

// 7. استشارة خبير (صورة صيدلاني/طبيب حقيقي)
export const ConsultationCover = () => (
  <div className="relative w-full h-full bg-slate-900">
    <img 
      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600" 
      alt="Medical Consultation" 
      className="absolute inset-0 w-full h-full object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply" />
    
    {/* Chat/Consultation Overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-full flex items-center justify-center border border-white/40 shadow-xl">
        <Stethoscope className="w-8 h-8 text-white drop-shadow-md" />
      </div>
    </div>
  </div>
);
