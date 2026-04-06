import React from 'react';

export const PrescriptionIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-blue-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#eff6ff" />
    {/* Paper */}
    <g transform="translate(150, 20) rotate(-5)">
      <rect width="120" height="160" rx="4" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
      <text x="15" y="35" fontFamily="serif" fontSize="24" fontWeight="bold" fill="#1e3a8a">Rx</text>
      <line x1="15" y1="55" x2="100" y2="55" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="15" y1="75" x2="90" y2="75" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="15" y1="95" x2="95" y2="95" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M15 120 Q 30 110, 45 125 T 80 115" fill="none" stroke="#0f172a" strokeWidth="2" />
    </g>
    {/* Phone */}
    <g transform="translate(80, 40) rotate(15)">
      <rect width="100" height="180" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="4" />
      <rect x="5" y="5" width="90" height="170" rx="8" fill="#0f172a" />
      {/* Camera interface */}
      <rect x="15" y="30" width="70" height="100" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="50" cy="150" r="12" fill="#ffffff" />
      {/* Scanning line */}
      <line x1="10" y1="80" x2="90" y2="80" stroke="#22c55e" strokeWidth="2" filter="drop-shadow(0 0 4px #22c55e)" />
    </g>
  </svg>
);

export const DrugIdIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-orange-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#fff7ed" />
    {/* Blister Pack */}
    <g transform="translate(50, 80) rotate(-15)">
      <rect width="100" height="60" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="25" cy="20" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
      <circle cx="50" cy="20" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
      <circle cx="75" cy="20" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
      <circle cx="25" cy="40" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
      <circle cx="50" cy="40" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
      <circle cx="75" cy="40" r="8" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))" />
    </g>
    {/* Syrup Bottle */}
    <g transform="translate(280, 50)">
      <path d="M20 0 L40 0 L40 20 L50 30 L50 120 L10 120 L10 30 L20 20 Z" fill="#78350f" />
      <rect x="10" y="50" width="40" height="50" fill="#ffffff" />
      <line x1="15" y1="60" x2="45" y2="60" stroke="#ea580c" strokeWidth="3" />
      <line x1="15" y1="70" x2="35" y2="70" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="15" y="-15" width="30" height="15" fill="#f1f5f9" opacity="0.8" />
    </g>
    {/* Pill Bottle (Cystone style) */}
    <g transform="translate(180, 60)">
      <rect x="10" y="20" width="60" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="15" y="0" width="50" height="20" rx="4" fill="#16a34a" />
      <rect x="10" y="40" width="60" height="40" fill="#f0fdf4" />
      <text x="18" y="55" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#16a34a">Cystone</text>
      <circle cx="40" cy="85" r="15" fill="#22c55e" opacity="0.2" />
    </g>
    {/* Question Mark */}
    <g transform="translate(160, 20)">
      <circle cx="40" cy="40" r="30" fill="#ea580c" opacity="0.1" />
      <text x="40" y="55" fontFamily="sans-serif" fontSize="48" fontWeight="900" fill="#ea580c" textAnchor="middle" filter="drop-shadow(0 2px 4px rgba(234,88,12,0.3))">?</text>
    </g>
  </svg>
);

export const SkinIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-emerald-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#ecfdf5" />
    {/* Skin/Arm */}
    <path d="M -20 180 Q 200 80, 420 180 L 420 220 L -20 220 Z" fill="#fcd34d" opacity="0.6" />
    {/* Psoriasis Patch */}
    <g transform="translate(200, 140)">
      <path d="M -30 0 Q -10 -20, 10 -10 T 40 10 Q 20 30, -10 20 T -30 0" fill="#ef4444" opacity="0.6" />
      <circle cx="-10" cy="5" r="3" fill="#fca5a5" />
      <circle cx="10" cy="-2" r="4" fill="#fca5a5" />
      <circle cx="20" cy="10" r="2" fill="#fca5a5" />
      <circle cx="0" cy="15" r="3" fill="#fca5a5" />
    </g>
    {/* Phone */}
    <g transform="translate(150, 10) rotate(-10)">
      <rect width="140" height="90" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="4" />
      <rect x="5" y="5" width="130" height="80" rx="8" fill="#0f172a" />
      {/* Focus square */}
      <rect x="45" y="20" width="40" height="40" fill="none" stroke="#10b981" strokeWidth="2" />
      <path d="M 45 30 L 45 20 L 55 20 M 75 20 L 85 20 L 85 30 M 85 50 L 85 60 L 75 60 M 55 60 L 45 60 L 45 50" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="115" cy="45" r="10" fill="#ffffff" />
    </g>
  </svg>
);

export const LabIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-rose-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#fff1f2" />
    {/* Clipboard */}
    <g transform="translate(120, 20)">
      <rect width="160" height="200" rx="6" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
      <rect x="60" y="-5" width="40" height="15" rx="4" fill="#cbd5e1" />
      <rect x="70" y="-10" width="20" height="10" rx="2" fill="#94a3b8" />
      
      {/* Header */}
      <text x="20" y="30" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#1e293b">LABORATORY REPORT</text>
      <line x1="20" y1="40" x2="140" y2="40" stroke="#e2e8f0" strokeWidth="2" />
      
      {/* Rows */}
      {/* Row 1: Normal */}
      <text x="20" y="60" fontFamily="sans-serif" fontSize="10" fill="#475569">WBC Count</text>
      <text x="100" y="60" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#1e293b">6.5</text>
      <rect x="130" y="52" width="10" height="10" rx="2" fill="#22c55e" />
      
      {/* Row 2: High */}
      <text x="20" y="80" fontFamily="sans-serif" fontSize="10" fill="#475569">Glucose</text>
      <text x="100" y="80" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#ef4444">125</text>
      <rect x="130" y="72" width="10" height="10" rx="2" fill="#ef4444" />
      <path d="M 135 74 L 135 80 M 132 77 L 135 74 L 138 77" stroke="#ffffff" strokeWidth="1.5" fill="none" />
      
      {/* Row 3: Normal */}
      <text x="20" y="100" fontFamily="sans-serif" fontSize="10" fill="#475569">Hemoglobin</text>
      <text x="100" y="100" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#1e293b">14.2</text>
      <rect x="130" y="92" width="10" height="10" rx="2" fill="#22c55e" />

      {/* Row 4: Low */}
      <text x="20" y="120" fontFamily="sans-serif" fontSize="10" fill="#475569">Vitamin D</text>
      <text x="100" y="120" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill="#eab308">12</text>
      <rect x="130" y="112" width="10" height="10" rx="2" fill="#eab308" />
      <path d="M 135 120 L 135 114 M 132 117 L 135 120 L 138 117" stroke="#ffffff" strokeWidth="1.5" fill="none" />
      
      <line x1="20" y1="140" x2="140" y2="140" stroke="#e2e8f0" strokeWidth="2" />
    </g>
    {/* Magnifying Glass */}
    <g transform="translate(220, 100)">
      <circle cx="30" cy="30" r="25" fill="none" stroke="#e11d48" strokeWidth="6" opacity="0.8" />
      <circle cx="30" cy="30" r="20" fill="#ffffff" opacity="0.3" />
      <line x1="48" y1="48" x2="70" y2="70" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
    </g>
  </svg>
);

export const InteractionIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-amber-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#fffbeb" />
    
    {/* Row 1: Safe Interaction */}
    <g transform="translate(40, 40)">
      {/* Pill */}
      <rect x="0" y="10" width="30" height="15" rx="7.5" fill="#ef4444" />
      <rect x="15" y="10" width="15" height="15" rx="7.5" fill="#ffffff" />
      
      <text x="45" y="25" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#92400e">+</text>
      
      {/* Bottle */}
      <rect x="65" y="5" width="20" height="25" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="67" y="0" width="16" height="5" fill="#3b82f6" />
      
      <text x="95" y="25" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#92400e">+</text>
      
      {/* IV Bag */}
      <path d="M 120 5 L 135 5 L 140 30 L 115 30 Z" fill="#bae6fd" opacity="0.8" />
      <line x1="127.5" y1="30" x2="127.5" y2="40" stroke="#94a3b8" strokeWidth="2" />
      
      <text x="160" y="25" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#92400e">=</text>
      
      {/* Checkmark */}
      <circle cx="200" cy="18" r="15" fill="#22c55e" />
      <path d="M 193 18 L 198 23 L 207 13" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Row 2: Dangerous Interaction */}
    <g transform="translate(40, 120)">
      {/* Pill 1 */}
      <circle cx="15" cy="15" r="10" fill="#f59e0b" />
      <line x1="5" y1="15" x2="25" y2="15" stroke="#ffffff" strokeWidth="2" />
      
      <text x="45" y="25" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#92400e">+</text>
      
      {/* Pill 2 */}
      <rect x="65" y="10" width="30" height="15" rx="7.5" fill="#8b5cf6" />
      
      <text x="160" y="25" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#92400e">=</text>
      
      {/* Cross */}
      <circle cx="200" cy="18" r="15" fill="#ef4444" />
      <path d="M 194 12 L 206 24 M 206 12 L 194 24" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export const RadiologyIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-cyan-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#ecfeff" />
    {/* English Medical Report */}
    <g transform="translate(80, 20)">
      <rect width="180" height="220" rx="4" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
      <text x="20" y="30" fontFamily="serif" fontSize="14" fontWeight="bold" fill="#164e63">MEDICAL IMAGING REPORT</text>
      <line x1="20" y1="40" x2="160" y2="40" stroke="#cbd5e1" strokeWidth="1" />
      
      <text x="20" y="60" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#475569">PATIENT: JOHN DOE</text>
      <text x="100" y="60" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#475569">DATE: 12/04/2026</text>
      
      <text x="20" y="80" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#164e63">FINDINGS:</text>
      <rect x="20" y="90" width="140" height="4" rx="2" fill="#e2e8f0" />
      <rect x="20" y="100" width="130" height="4" rx="2" fill="#e2e8f0" />
      <rect x="20" y="110" width="145" height="4" rx="2" fill="#e2e8f0" />
      <rect x="20" y="120" width="100" height="4" rx="2" fill="#e2e8f0" />
      
      <text x="20" y="145" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#164e63">IMPRESSION:</text>
      <rect x="20" y="155" width="140" height="4" rx="2" fill="#bae6fd" />
      <rect x="20" y="165" width="120" height="4" rx="2" fill="#bae6fd" />
    </g>
    {/* X-Ray Film Overlay */}
    <g transform="translate(220, 60) rotate(10)">
      <rect width="100" height="120" rx="4" fill="#0f172a" opacity="0.9" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
      <rect x="5" y="5" width="90" height="110" fill="#1e293b" />
      {/* Abstract Chest/Ribs X-ray */}
      <path d="M 50 20 Q 50 40, 50 90" stroke="#e2e8f0" strokeWidth="4" fill="none" opacity="0.8" />
      <path d="M 50 30 Q 30 30, 20 50" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M 50 30 Q 70 30, 80 50" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M 50 45 Q 25 45, 15 70" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M 50 45 Q 75 45, 85 70" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M 50 60 Q 25 60, 20 85" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M 50 60 Q 75 60, 80 85" stroke="#e2e8f0" strokeWidth="3" fill="none" opacity="0.6" />
    </g>
  </svg>
);

export const ConsultationIllustration = () => (
  <svg viewBox="0 0 400 200" className="w-full h-full bg-indigo-50" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="200" fill="#eef2ff" />
    {/* Chat Bubbles */}
    {/* User Bubble */}
    <g transform="translate(60, 40)">
      <rect width="180" height="50" rx="16" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))" />
      <path d="M 20 50 L 20 65 L 35 50 Z" fill="#ffffff" />
      <circle cx="30" cy="25" r="10" fill="#e2e8f0" />
      <path d="M 20 35 Q 30 25, 40 35" stroke="#94a3b8" strokeWidth="2" fill="none" />
      <rect x="50" y="15" width="100" height="6" rx="3" fill="#e2e8f0" />
      <rect x="50" y="30" width="70" height="6" rx="3" fill="#e2e8f0" />
    </g>
    {/* Pharmacist Bubble */}
    <g transform="translate(160, 110)">
      <rect width="180" height="60" rx="16" fill="#4f46e5" filter="drop-shadow(0 4px 6px rgba(79,70,229,0.2))" />
      <path d="M 160 60 L 160 75 L 145 60 Z" fill="#4f46e5" />
      {/* Medical Cross */}
      <g transform="translate(140, 30)">
        <rect x="-8" y="-3" width="16" height="6" rx="1" fill="#ffffff" />
        <rect x="-3" y="-8" width="6" height="16" rx="1" fill="#ffffff" />
      </g>
      <rect x="20" y="20" width="100" height="6" rx="3" fill="#818cf8" />
      <rect x="20" y="35" width="80" height="6" rx="3" fill="#818cf8" />
    </g>
  </svg>
);
