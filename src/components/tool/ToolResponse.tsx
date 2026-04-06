import React from 'react';
import { User, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ResultDisplay from './ResultDisplay';
import { ToolType } from '../../types';

interface ToolResponseProps {
  tool: ToolType;
  isChatMode: boolean;
  pendingMessage: { text: string; image: string | null } | null;
  response: string | null;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  onOpenSettings?: () => void;
  handleShare: () => void;
  handleCopy: () => void;
  exportToPDF: () => void;
  onSelectTool?: (tool: any) => void;
  onReset: () => void;
}

const ToolResponse = React.forwardRef<HTMLDivElement, ToolResponseProps>(({
  tool,
  isChatMode,
  pendingMessage,
  response,
  loading,
  loadingMessage,
  error,
  onOpenSettings,
  handleShare,
  handleCopy,
  exportToPDF,
  onSelectTool,
  onReset
}, ref) => {
  return (
    <AnimatePresence mode="popLayout">
      {pendingMessage && (
        <motion.div
          key="pending-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`space-y-6 ${isChatMode ? "mb-8" : "mb-6"}`}
        >
          {isChatMode ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">سؤالك المرسل</span>
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md max-w-[85%] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {pendingMessage.image && (
                  <img 
                    src={pendingMessage.image} 
                    alt="Uploaded" 
                    className="w-full max-w-[200px] rounded-lg mb-3 border border-white/20 shadow-sm" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {pendingMessage.text || 'تحليل الصورة'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6">
                {pendingMessage.image && (
                  <div className="w-full md:w-1/3 shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">الصورة الأصلية للمقارنة</p>
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                      <img 
                        src={pendingMessage.image} 
                        alt="Original" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">التفاصيل المرسلة</p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                    {pendingMessage.text || 'تم إرسال صورة للتحليل بدون ملاحظات إضافية.'}
                  </div>
                  {!response && loading && (
                    <div className="flex items-center gap-3 text-blue-600 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-bold">{loadingMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading && isChatMode && (
            <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 animate-pulse">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="h-2 w-24 bg-blue-200 rounded-full mb-2" />
                <p className="text-xs font-bold text-blue-600">{loadingMessage}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div 
          key="error-alert"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-3 text-red-700"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{error}</p>
          </div>
          {(error.includes("مفتاح") || error.includes("API")) && onOpenSettings && (
            <div className="flex gap-2 mr-8">
              <button 
                onClick={onOpenSettings}
                className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors w-fit"
              >
                تغيير مفتاح API
              </button>
              <button 
                onClick={() => {
                  if (confirm('هل تريد حذف المفتاح الحالي تماماً؟')) {
                    onOpenSettings();
                  }
                }}
                className="text-xs bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-50 transition-colors w-fit"
              >
                حذف المفتاح
              </button>
            </div>
          )}
        </motion.div>
      )}

      {response && (
        <ResultDisplay
          ref={ref}
          key="result-display"
          tool={tool}
          response={response}
          isChatMode={isChatMode}
          onShare={handleShare}
          onCopy={handleCopy}
          onExport={exportToPDF}
          onSelectTool={onSelectTool}
          onReset={onReset}
        />
      )}
    </AnimatePresence>
  );
});

ToolResponse.displayName = 'ToolResponse';

export default ToolResponse;
