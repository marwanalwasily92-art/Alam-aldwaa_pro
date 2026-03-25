import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserConfig, ToolType } from './types';
import Dashboard from './components/Dashboard';
import ToolView from './components/ToolView';
import HistoryVault from './components/HistoryVault';
import ApiKeyModal from './components/ApiKeyModal';
import InstructionsModal from './components/InstructionsModal';
import { cleanupOldData } from './lib/cleanup';
import { LogOut, History, LayoutDashboard, Key, ShieldCheck, HelpCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'tool' | 'history'>('dashboard');
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Run cleanup once user is authenticated
      if (user) {
        cleanupOldData(user.uid);
      }
    });

    const savedConfig = localStorage.getItem('pharma_world_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Migrate old model names to new ones
        if (parsed.model === 'gemini-1.5-flash') parsed.model = 'gemini-3-flash-preview';
        if (parsed.model === 'gemini-1.5-pro') parsed.model = 'gemini-3.1-pro-preview';
        
        // Ensure the model is one of the supported ones
        if (parsed.model !== 'gemini-3-flash-preview' && parsed.model !== 'gemini-3.1-pro-preview') {
          parsed.model = 'gemini-3-flash-preview';
        }
        
        setConfig(parsed);
        localStorage.setItem('pharma_world_config', JSON.stringify(parsed));

        // Show instructions if API key is missing, with a slight delay for better UX
        if (!parsed.apiKey) {
          setTimeout(() => setShowInstructionsModal(true), 1500);
        }
      } catch (e) {
        console.error("Failed to parse config", e);
        setTimeout(() => setShowInstructionsModal(true), 1500);
      }
    } else {
      // No config at all, show instructions
      setTimeout(() => setShowInstructionsModal(true), 1500);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const syncUser = async () => {
        try {
          const userDoc = doc(db, 'users', user.uid);
          const snap = await getDoc(userDoc);
          if (!snap.exists()) {
            await setDoc(userDoc, {
              email: user.email,
              displayName: user.displayName,
              role: 'user'
            });
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      };
      syncUser();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveView('dashboard');
  };

  const saveConfig = (newConfig: UserConfig) => {
    setConfig(newConfig);
    localStorage.setItem('pharma_world_config', JSON.stringify(newConfig));
    setShowApiKeyModal(false);
  };

  const openTool = (tool: ToolType) => {
    if (!config?.apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    setSelectedTool(tool);
    setActiveView('tool');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4 text-right" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8 border border-blue-100">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 font-serif">عالم الدواء - Pharma World</h1>
            <p className="text-slate-600 leading-relaxed">
              الواجهة الذكية المخصصة للصيادلة في اليمن. استعن بقوة الذكاء الاصطناعي في عملك اليومي بكل أمان وخصوصية.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-blue-400 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-md active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            <span>تسجيل الدخول عبر جوجل</span>
          </button>

          <div className="text-center text-xs text-slate-400">
            بتسجيل الدخول، أنت توافق على شروط الخدمة وسياسة الخصوصية.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-900 leading-tight">عالم الدواء</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Pharma World AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInstructionsModal(true)}
              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              title="تعليمات التشغيل"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className={cn(
                "p-2 rounded-xl transition-colors relative",
                config?.apiKey ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
              )}
              title="إعدادات المفتاح"
            >
              <Key className="w-5 h-5" />
              {config?.apiKey && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
              {!config?.apiKey && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100">
              <img src={user.photoURL || ''} alt={user.displayName || ''} referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-24">
        {activeView === 'dashboard' && <Dashboard onSelectTool={openTool} />}
        {activeView === 'tool' && selectedTool && (
          <ToolView 
            tool={selectedTool} 
            config={config!} 
            onBack={() => setActiveView('dashboard')} 
            userId={user.uid}
            onOpenSettings={() => setShowApiKeyModal(true)}
          />
        )}
        {activeView === 'history' && <HistoryVault onBack={() => setActiveView('dashboard')} userId={user.uid} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveView('dashboard')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeView === 'dashboard' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => setActiveView('history')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeView === 'history' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">السجل</span>
        </button>
      </nav>

      {showApiKeyModal && (
        <ApiKeyModal 
          currentConfig={config} 
          onSave={saveConfig} 
          onClose={() => setShowApiKeyModal(false)} 
        />
      )}

      <AnimatePresence>
        {showInstructionsModal && (
          <InstructionsModal onClose={() => setShowInstructionsModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
