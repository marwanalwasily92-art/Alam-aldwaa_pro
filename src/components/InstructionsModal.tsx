import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ExternalLink, CheckCircle2, Info } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
}

export default function InstructionsModal({ onClose }: InstructionsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      dir="rtl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
      >
        <div className="bg-blue-600 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">تعليمات تفعيل المحرك الذكي</h2>
            <p className="text-blue-100 text-xs">خطوات بسيطة لتشغيل تطبيق عالم الدواء</p>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">1</div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">ما هو مفتاح Gemini API؟</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  هو رمز سري يربط تطبيقنا بمحركات جوجل للذكاء الاصطناعي. بدونه لا يمكن للتطبيق "رؤية" الروشتات أو "فهم" استفساراتك.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">2</div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">هل هناك تكلفة مالية؟</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  **لا يوجد أي تكلفة.** توفر جوجل هذا المفتاح مجاناً (Free Tier) للاستخدام العادي، وهو كافٍ جداً لعملك اليومي في الصيدلية.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">3</div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">خطوات الحصول على المفتاح:</h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>1. اضغط على الرابط بالأسفل للدخول لموقع Google AI Studio.</p>
                  <p>2. سجل دخولك بحساب جوجل (Gmail) الخاص بك.</p>
                  <p>3. اضغط على زر **"Create API key"** (قد يطلب منك الموافقة على الشروط أولاً).</p>
                  <p>4. اختر **"Create API key in new project"** للحصول على مفتاح جديد.</p>
                  <p>5. قم بنسخ الرمز الذي يظهر لك (يبدأ بـ AIza...).</p>
                  
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-2">
                    <p className="text-[10px] text-amber-800 font-bold">💡 ملاحظة حول حد الاستخدام:</p>
                    <p className="text-[10px] text-amber-700">المفتاح المجاني له حد يومي (مثلاً 15 طلب في الدقيقة و1500 طلب في اليوم). إذا توقف التطبيق، انتظر 24 ساعة ليتجدد الحد تلقائياً.</p>
                  </div>
                  
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all w-full justify-center mt-2"
                  >
                    <span>فتح موقع الحصول على المفتاح</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">4</div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">كيف أفعل التطبيق؟</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  بعد نسخ المفتاح، عد للتطبيق واضغط على **أيقونة المفتاح البرتقالية** في أعلى الشاشة، ثم الصق الرمز واضغط حفظ.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              **ملاحظة:** يتم حفظ المفتاح في متصفحك فقط ولا نطلع عليه أبداً، مما يضمن خصوصية كاملة لعملك.
            </p>
          </div>
        </div>

        <div className="p-6 pt-0 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>موافق، فهمت ذلك</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
