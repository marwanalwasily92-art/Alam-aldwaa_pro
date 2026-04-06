import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'camera' | 'photos';
}

export default function PermissionModal({ isOpen, onClose, onConfirm, type }: PermissionModalProps) {
  const isCamera = type === 'camera';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100"
          >
            <div className="p-8 flex flex-col items-center text-center space-y-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${
                isCamera ? "bg-blue-100 text-blue-600 shadow-blue-100" : "bg-emerald-100 text-emerald-600 shadow-emerald-100"
              }`}>
                {isCamera ? <Camera className="w-10 h-10" /> : <ImageIcon className="w-10 h-10" />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  {isCamera ? "إذن الوصول للكاميرا" : "إذن الوصول للصور"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {isCamera 
                    ? "نحتاج للوصول للكاميرا لتتمكن من التقاط صور الروشتات والحالات الطبية وتحليلها بدقة."
                    : "نحتاج للوصول لمعرض الصور لتتمكن من اختيار ورفع صور الروشتات المخزنة على جهازك."}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 text-right w-full">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  نحن نحترم خصوصيتك. يتم استخدام الصور للتحليل فقط وتُحذف فوراً من خوادمنا بعد الانتهاء.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={onConfirm}
                  className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                    isCamera ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  }`}
                >
                  سماح بالوصول
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ليس الآن
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
