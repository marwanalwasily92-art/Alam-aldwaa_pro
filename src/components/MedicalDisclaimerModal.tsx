import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface MedicalDisclaimerModalProps {
  onAccept: () => void;
}

export default function MedicalDisclaimerModal({ onAccept }: MedicalDisclaimerModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-blue-50"
      >
        <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold">تنبيه هام وإخلاء مسؤولية طبية</h2>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar text-right">
          <p className="text-slate-800 font-bold leading-relaxed">
            إن هذا التطبيق يعتمد على تقنيات الذكاء الاصطناعي لتقديم تحليل استرشادي ومعلوماتي فقط.
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">ليس بديلاً عن الطبيب:</strong> النتائج الصادرة عن التطبيق (تحليل صور، أشعة، أو أدوية) لا تعتبر تشخيصاً طبياً نهائياً ولا تغني عن استشارة الطبيب المختص أو الصيدلي.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">للمساعدة الفنية فقط:</strong> التطبيق أداة مساعدة لتبسيط المعلومات الطبية وليس مرجعاً علاجياً. لا تقم بتغيير جرعات الأدوية أو اتخاذ قرارات صحية مصيرية بناءً على نتائج التطبيق وحدها.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">دقة البيانات:</strong> رغم دقة الذكاء الاصطناعي العالية، إلا أن الخطأ وارد. المطور وإدارة التطبيق غير مسؤولين عن أي نتائج غير دقيقة أو أضرار ناتجة عن سوء استخدام هذه المعلومات.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">الخصوصية:</strong> نحن نلتزم بحذف صورك فور تحليلها لضمان خصوصيتك الكاملة، ولا يتم تخزين أي بيانات طبية حساسة على خوادمنا بشكل دائم.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              باستخدامك لهذا التطبيق، أنت تقر بقرائتك لهذه الشروط وتتحمل كامل المسؤولية عن قراراتك الصحية.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onAccept}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>أوافق وأفهم ذلك</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
