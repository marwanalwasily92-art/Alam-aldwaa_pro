import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Phone } from 'lucide-react';

interface AdPlaceholderProps {
  id: string; // This will be your AdMob Unit ID
  className?: string;
  type?: 'admob' | 'sponsor';
}

declare global {
  interface Window {
    // Universal Bridge Support
    median?: { ads?: { showBanner: (options: any) => void } };
    gonative?: { ads?: { showBanner: (options: any) => void } };
    webkit?: { messageHandlers?: { admob?: { postMessage: (message: any) => void }, unity?: { postMessage: (message: any) => void } } };
    UnityAdsBridge?: { showBanner: (id: string) => void };
    AdMobBridge?: { showBanner: (id: string) => void };
  }
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ id, className, type = 'admob' }) => {
  // --- إعدادات التفعيل لنسخة الـ APK والـ iOS ---
  // تم الربط بنجاح بمعرفات يونيتي الخاصة بك للأندرويد والآيفون
  const UNITY_IDS = {
    android: '6088161',
    ios: '6088160'
  };

  useEffect(() => {
    const triggerNativeAd = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const activeGameId = isIOS ? UNITY_IDS.ios : UNITY_IDS.android;

      const adData = { 
        action: 'showBanner', 
        unitId: id, 
        gameId: activeGameId,
        provider: type === 'admob' ? 'admob' : 'unity',
        position: 'bottom' 
      };

      // 1. Try known bridges (Median/GoNative)
      if (window.median?.ads?.showBanner) {
        window.median.ads.showBanner({ adUnitId: id });
      } else if (window.gonative?.ads?.showBanner) {
        window.gonative.ads.showBanner({ adUnitId: id });
      } 
      // 2. Try Unity Specific Bridge
      else if (window.UnityAdsBridge?.showBanner) {
        window.UnityAdsBridge.showBanner(id);
      }
      // 3. Try Generic Webkit Bridge (iOS/Android Modern Wrappers)
      else if (window.webkit?.messageHandlers?.unity?.postMessage) {
        window.webkit.messageHandlers.unity.postMessage(adData);
      }
      // 4. Universal postMessage (The most compatible fallback)
      else {
        window.postMessage(JSON.stringify(adData), '*');
      }
    };
    
    // Small delay to ensure bridge is ready
    const timer = setTimeout(triggerNativeAd, 1000);
    return () => clearTimeout(timer);
  }, [id, type, UNITY_IDS.android, UNITY_IDS.ios]);

  const isAdsActive = true; 

  if (type === 'sponsor' || !isAdsActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={`w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[24px] p-4 shadow-lg relative overflow-hidden group ${className}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-10 translate-y-10" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-amber-400 text-blue-900 text-[8px] font-black rounded-md uppercase">إعلان ممول</span>
              <h4 className="text-xs font-black text-white">مخزن عالم الدواء</h4>
            </div>
            <p className="text-[10px] text-blue-50 font-medium leading-tight mb-2">
              أفضل الأسعار للأدوية والمستلزمات الطبية في إب. جملة وتجزئة.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="tel:+967777814591"
                className="flex items-center gap-1.5 text-[9px] font-bold text-white bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all"
              >
                <Phone className="w-3 h-3" />
                اتصل الآن
              </a>
            </div>
          </div>
          
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <ExternalLink className="w-6 h-6 text-white/80" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Placeholder for Native Ad (The actual ad will be injected by the APK wrapper)
  return (
    <div id={`admob-unit-${id}`} className={`w-full min-h-[50px] ${className}`} />
  );
};
