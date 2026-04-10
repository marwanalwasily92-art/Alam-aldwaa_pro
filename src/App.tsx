import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import Dashboard from './components/Dashboard';
import ToolView from './components/ToolView';
import HistoryVault from './components/HistoryVault';
import AdminDashboard from './components/AdminDashboard';
import InstructionsModal from './components/InstructionsModal';
import MedicalDisclaimerModal from './components/MedicalDisclaimerModal';
import { History, LayoutDashboard, Key, ShieldCheck, HelpCircle, WifiOff, UserCircle, AlertTriangle, Coins, Clock, Info, ChevronLeft } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { performGlobalCleanup } from './lib/localHistory';
import { db, getDeviceId, ADMIN_EMAILS } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const RedCrescentIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.4" />
      </filter>
      <mask id="crescentMask">
        <rect x="0" y="0" width="100" height="100" fill="white" />
        <circle cx="60" cy="50" r="35" fill="black" />
      </mask>
    </defs>

    {/* Red Crescent */}
    <circle 
      cx="45" cy="50" r="40" 
      fill="url(#redGrad)" 
      mask="url(#crescentMask)" 
      filter="url(#shadow)" 
    />

    {/* Professional Chalice and Snake (Scaled and Mirrored) */}
    <g transform="translate(10, 8) scale(0.85)">
      {/* Snake Behind Chalice */}
      <path 
        d="M 75 80 C 65 70, 50 80, 55 65" 
        fill="none" 
        stroke="url(#greenGrad)" 
        strokeWidth="7" 
        strokeLinecap="round" 
        filter="url(#shadow)"
      />

      {/* Chalice */}
      <g filter="url(#shadow)">
        <path d="M 47 45 L 83 45 C 83 60 70 65 65 65 C 60 65 47 60 47 45 Z" fill="url(#goldGrad)" />
        <ellipse cx="65" cy="45" rx="18" ry="4" fill="#FEF08A" />
        <rect x="62" y="65" width="6" height="20" fill="url(#goldGrad)" />
        <path d="M 52 85 C 52 78 78 78 78 85 Z" fill="url(#goldGrad)" />
      </g>

      {/* Snake In Front of Chalice */}
      <g filter="url(#shadow)">
        {/* Bottom Wrap */}
        <path 
          d="M 55 90 C 70 100, 85 85, 75 80" 
          fill="none" 
          stroke="url(#greenGrad)" 
          strokeWidth="7" 
          strokeLinecap="round" 
        />
        {/* Rising Wrap */}
        <path 
          d="M 55 65 C 60 50, 85 60, 85 35" 
          fill="none" 
          stroke="url(#greenGrad)" 
          strokeWidth="7" 
          strokeLinecap="round" 
        />
        {/* Neck Arch */}
        <path 
          d="M 85 35 C 85 15, 70 15, 65 20" 
          fill="none" 
          stroke="url(#greenGrad)" 
          strokeWidth="7" 
          strokeLinecap="round" 
        />
        
        {/* Professional Snake Head (Viper shape) */}
        <path 
          d="M 72 18 Q 65 14 58 18 L 61 28 Q 65 32 69 28 Z" 
          fill="url(#greenGrad)" 
        />
        
        {/* Snake Eye (Slit pupil) */}
        <g transform="rotate(20 67 23)">
          <ellipse cx="67" cy="23" rx="2.5" ry="3.5" fill="#FDE047" />
          <ellipse cx="67" cy="23" rx="0.8" ry="2.5" fill="#000" />
        </g>

        {/* Forked Tongue (Flicking into chalice) */}
        <path 
          d="M 65 30 L 65 38 M 65 38 L 62 42 M 65 38 L 68 42" 
          fill="none" 
          stroke="#EF4444" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>
    </g>
  </svg>
);

function QuotaDisplay({ userId, isAdmin, variant = 'header' }: { userId: string; isAdmin?: boolean; variant?: 'header' | 'profile' }) {
  const [quota, setQuota] = React.useState<{ usage: number; max: number } | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const { config } = useConfig();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!userId) return;

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const deviceId = getDeviceId();
    const hasCustomKey = !!config?.apiKey;
    let deviceUnsub: (() => void) | undefined;

    // Listen to global stats for dynamic quota
    const statsUnsub = onSnapshot(doc(db, 'system_stats', 'daily'), (snap) => {
      const statsData = snap.exists() ? snap.data() : null;
      const privateUserCount = statsData?.private_user_count || 0;
      const lastResetDate = statsData?.last_reset_date || '';
      
      // Determine Max Quota based on user type and global stats
      let maxQuota = 5;
      if (hasCustomKey) {
        maxQuota = (lastResetDate === today && privateUserCount >= 400) ? 5 : 10;
      } else {
        maxQuota = 5;
      }
      
      // Clean up previous device listener if it exists
      if (deviceUnsub) {
        deviceUnsub();
      }

      // Listen to device stats
      deviceUnsub = onSnapshot(doc(db, 'device_usage', deviceId), (deviceSnap) => {
        if (deviceSnap.exists()) {
          const deviceData = deviceSnap.data();
          const currentUsage = deviceData.last_reset_date === today ? (deviceData.usage_count || 0) : 0;
          const anonymousLimit = deviceData.anonymous_limit || 5;
          const hasLimitSet = deviceData.anonymous_limit_set && deviceData.last_reset_date === today;
          
          if (hasCustomKey) {
            setQuota({ usage: currentUsage, max: maxQuota });
          } else {
            // Apply the transition strategy for display
            const limit = hasLimitSet ? anonymousLimit : 5;
            const usageAtSwitch = hasLimitSet ? (anonymousLimit - 5) : 0;
            const displayUsage = Math.max(0, currentUsage - usageAtSwitch);
            
            setQuota({ usage: displayUsage, max: 5 });
          }
        } else {
          setQuota({ usage: 0, max: maxQuota });
        }
      }, (error) => {
        // Only log if not a permission error from logging out
        if (error.code !== 'permission-denied') {
          console.error("Error fetching device usage:", error);
        }
        setQuota({ usage: 0, max: maxQuota });
      });

    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error("Error fetching system stats:", error);
      }
      setQuota({ usage: 0, max: 5 }); // Fallback
    });

    return () => {
      statsUnsub();
      if (deviceUnsub) {
        deviceUnsub();
      }
    };
  }, [userId, config?.apiKey]);

  if (!quota) return null;

  const remaining = Math.max(0, quota.max - quota.usage);
  const displayValue = isAdmin ? "مفتوح" : remaining;

  const isProfile = variant === 'profile';

  return (
    <div className="relative" ref={tooltipRef}>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTooltip(!showTooltip)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-sm border cursor-help transition-all",
          isProfile 
            ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100" 
            : "bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white border-white/20"
        )}
      >
        <div className="flex flex-col items-center">
          <span className={cn(
            "text-[7px] sm:text-[8px] font-bold leading-none whitespace-nowrap",
            isProfile ? "text-blue-400" : "opacity-80"
          )}>رصيدك اليوم</span>
          <span className="text-[10px] sm:text-xs font-black leading-none mt-0.5">متبقي {displayValue}</span>
        </div>
        <Coins className={cn(
          "w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5",
          isProfile ? "text-amber-500" : "text-amber-300"
        )} />
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-xl border border-blue-100 p-3 z-50 text-right"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold">تجديد تلقائي</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
              {isAdmin 
                ? "بصفتك مسؤولاً، لديك وصول غير محدود لجميع الميزات."
                : "يتم تجديد رصيدك اليومي تلقائياً كل يوم بعد منتصف الليل (بتوقيت مكة المكرمة) لضمان استمرارية الخدمة مجاناً لجميع الصيادلة."}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5 text-amber-600">
              <Info className="w-3 h-3" />
              <span className="text-[8px] font-bold">شكراً لثقتك بنا دكتور</span>
            </div>
            {/* Arrow */}
            <div className="absolute -top-1 left-6 w-2 h-2 bg-white border-t border-l border-blue-100 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppContent() {
  const { user, loading, error: authError } = useAuth();
  const { config, saveConfig, showInstructionsModal, setShowInstructionsModal } = useConfig();
  const [showDisclaimer, setShowDisclaimer] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const showProfileModal = searchParams.get('modal') === 'profile';
  const setShowProfileModal = (show: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) {
      newParams.set('modal', 'profile');
    } else {
      newParams.delete('modal');
    }
    setSearchParams(newParams);
  };

  React.useEffect(() => {
    const hasAccepted = localStorage.getItem('medical_disclaimer_accepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('medical_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email || ''));

  React.useEffect(() => {
    if (user) {
      performGlobalCleanup(user);
      
      // Set up periodic cleanup every 15 minutes
      const cleanupInterval = setInterval(() => {
        performGlobalCleanup(user);
      }, 15 * 60 * 1000);
      
      return () => clearInterval(cleanupInterval);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-600 shadow-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Right Side: Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 border border-white/20">
              <RedCrescentIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">عالم الدواء</h1>
              <p className="text-[9px] text-blue-100 font-bold uppercase tracking-widest opacity-90">PHARMA WORLD AI</p>
            </div>
          </div>

          {/* Left Side: Actions */}
          <div className="flex items-center gap-2">
            <QuotaDisplay userId={user.uid} isAdmin={isAdmin} />
            
            <button 
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 shadow-sm hover:scale-105 transition-transform bg-white/10 flex items-center justify-center"
            >
              <UserCircle className="w-6 h-6 text-white/80" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Greeting Section */}
      {location.pathname === '/' && (
        <div className="px-4 pt-8 pb-4 text-right max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-sm font-black text-slate-900">أهلاً بك يا دكتور</h2>
          <p className="text-slate-500 text-xs mt-1">اختر الأداة التي تحتاجها لمساعدتك في الصيدلية اليوم.</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4 pb-24">
        {!isOnline && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">
              أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل حتى تعاود الاتصال.
            </div>
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tool/:toolId" element={<ToolView />} />
          <Route path="/history" element={<HistoryVault />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => navigate('/')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            location.pathname === '/' ? "text-blue-600 scale-110" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            location.pathname === '/history' ? "text-blue-600 scale-110" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">السجل</span>
        </button>
        {isAdmin && (
          <button 
            onClick={() => navigate('/admin')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              location.pathname === '/admin' ? "text-red-600 scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px] font-bold">المسؤول</span>
          </button>
        )}
      </nav>

      <AnimatePresence>
        {showInstructionsModal && (
          <InstructionsModal onClose={() => setShowInstructionsModal(false)} />
        )}
        {showDisclaimer && (
          <MedicalDisclaimerModal onAccept={handleAcceptDisclaimer} />
        )}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-50">
                <div className="w-6"></div>
                <h2 className="text-slate-900 font-bold text-lg">إعدادات الحساب</h2>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="p-8 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold mb-4 shadow-xl overflow-hidden border-4 border-white">
                  <UserCircle className="w-16 h-16 text-blue-100" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">مستخدم زائر</h3>
                <p className="text-slate-500 text-xs mb-8 text-center px-4">
                  بياناتك محفوظة محلياً على هذا الجهاز لمدة ساعة واحدة فقط لضمان خصوصيتك.
                </p>

                {/* Account Stats & Tools */}
                <div className="w-full space-y-3 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
                    <QuotaDisplay userId={user.uid} isAdmin={isAdmin} variant="profile" />
                    <span className="text-slate-700 font-bold text-sm">الرصيد المتبقي</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowInstructionsModal(true);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 rounded-2xl p-4 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-blue-600">
                      <HelpCircle className="w-4 h-4" />
                      <span>المساعدة</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ConfigProvider>
          <AppContent />
        </ConfigProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
