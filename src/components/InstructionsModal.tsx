import { motion } from 'framer-motion';
import { X, HelpCircle, ExternalLink, CheckCircle2, Info, Sparkles, Plus, Copy, Key, Menu } from 'lucide-react';

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
            <h2 className="text-xl font-bold">دليل إعداد المساعد الذكي</h2>
            <p className="text-blue-100 text-xs">لتفعيل التطبيق يرجى اتباع الخطوات التالية</p>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
              <div className="space-y-4 w-full">
                <h3 className="font-bold text-slate-800 text-sm">خطوات تفعيل مساعدك الذكي (مجاناً وبأمان تام)</h3>
                <div className="space-y-5 text-xs text-slate-600">
                  
                  {/* Step 1 & 2 */}
                  <div className="leading-relaxed space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <span>اضغط على الرابط بالأسفل لفتح منصة جوجل (Google AI Studio).</span>
                    </div>
                    <div className="flex items-center gap-2 pr-4 border-r-2 border-blue-100">
                      <span className="font-bold text-blue-600">2.</span>
                      <span>قم بالموافقة على شروط الاستخدام للمتابعة.</span>
                    </div>
                  </div>

                  {/* Step 3 & 4 */}
                  <div className="leading-relaxed space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <span>افتح القائمة الرئيسية (أعلى يسار الشاشة).</span>
                      <Menu className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-2 pr-4 border-r-2 border-blue-100">
                      <span className="font-bold text-blue-600">4.</span>
                      <span>اضغط على خيار</span>
                      <span className="inline-flex items-center gap-1 bg-[#1e1f20] text-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                        <Key className="w-2.5 h-2.5" />
                        Get API key
                      </span>
                    </div>
                  </div>

                  {/* Step 5 & 6 */}
                  <div className="leading-relaxed space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">5.</span>
                      <span>اضغط على الزر الأزرق</span>
                      <span className="inline-flex items-center gap-1 bg-[#0b57d0] text-white px-2 py-1 rounded-full text-[10px]">
                        <Plus className="w-2.5 h-2.5" />
                        Create API key
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pr-4 border-r-2 border-blue-100">
                      <span className="font-bold text-blue-600">6.</span>
                      <span>اختر خيار "Create project" من القائمة.</span>
                    </div>
                  </div>

                  {/* Step 7 & 8 */}
                  <div className="leading-relaxed space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">7.</span>
                      <span>اضغط على زر "Create project" للتأكيد.</span>
                    </div>
                    <div className="flex items-center gap-2 pr-4 border-r-2 border-blue-100">
                      <span className="font-bold text-blue-600">8.</span>
                      <span>اضغط على "Create key" ثم انسخ الرمز الناتج.</span>
                      <Copy className="w-3 h-3 text-blue-500" />
                    </div>
                  </div>

                  {/* Step 9 */}
                  <div className="leading-relaxed space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">9.</span>
                      <span>عُد للتطبيق واضغط على أيقونة المفتاح 🔑 أعلى الشاشة، ثم الصق المفتاح واحفظه.</span>
                    </div>
                  </div>

                  {/* Instructional Image */}
                  <div className="rounded-2xl overflow-hidden border-2 border-blue-50 shadow-md mt-4 relative group">
                    <img 
                      src="https://picsum.photos/seed/gemini-guide-steps/800/1200" 
                      alt="Gemini API Key Guide" 
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 text-white">
                      <p className="text-[11px] font-bold flex items-center gap-2">
                        <Info className="w-3 h-3 text-blue-400" />
                        دليل استخراج وتثبيت مفتاح Gemini API
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-4">
                    <p className="text-[10px] text-amber-800 font-bold">💡 خصوصيتك بأمان:</p>
                    <p className="text-[10px] text-amber-700">هذا المفتاح مشفر ومخصص لاستخدامك الشخصي فقط، ولا يتم مشاركته مع أي جهة.</p>
                  </div>
                  
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all w-full justify-center mt-2"
                  >
                    <span>فتح موقع جوجل (الحصول على المفتاح)</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">2</div>
              <div className="space-y-3 w-full">
                <h3 className="font-bold text-slate-800">كيف أقوم بتفعيل التطبيق؟</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  عُد إلى تطبيق "عالم الدواء"، واضغط على أيقونة المفتاح 🔑 الموجودة أعلى الشاشة. قم بلصق الرمز الذي نسخته في الخانة المخصصة، ثم اضغط على "حفظ الإعدادات". تهانينا، التطبيق الآن جاهز للعمل!
                </p>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100/50 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 w-full">
                    <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center text-amber-600">
                      <span className="text-xs">🔑</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </div>
                  <div className="w-full bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg text-center shadow-sm">
                    حفظ الإعدادات
                  </div>
                </div>
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
