import React, { useState } from 'react';
import { X, ExternalLink, Key, Info, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { UserConfig } from '../types';
import { validateApiKey } from '../lib/gemini';

interface ApiKeyModalProps {
  currentConfig: UserConfig | null;
  onSave: (config: UserConfig) => void;
  onClose: () => void;
}

export default function ApiKeyModal({ currentConfig, onSave, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [model, setModel] = useState<'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash-exp' | 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview'>(currentConfig?.model || 'gemini-1.5-flash');
  const [incognitoMode] = useState<boolean>(currentConfig?.incognitoMode || false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteKey = () => {
    onSave({ ...currentConfig!, apiKey: '' });
    setApiKey('');
    setValidationResult(null);
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showDeleteConfirm) return;
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setValidationResult({ valid: false, message: "يرجى إدخال المفتاح أولاً." });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await validateApiKey(trimmedKey);
      setValidationResult(result);
      
      if (result.valid) {
        // Show success for a moment before closing
        setTimeout(() => {
          onSave({ apiKey: trimmedKey, model, incognitoMode });
        }, 1000);
      }
    } catch (err) {
      setValidationResult({ valid: false, message: "حدث خطأ غير متوقع أثناء التحقق." });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6" />
            <h2 className="text-xl font-bold">إعدادات التطبيق</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700 block">مفتاح Gemini API</label>
              {currentConfig?.apiKey && (
                <div className="flex items-center gap-2">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                      <span className="text-[10px] text-amber-600 font-bold">متأكد؟</span>
                      <button 
                        type="button" 
                        onClick={handleDeleteKey}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        نعم، احذف
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-[10px] text-slate-400 font-bold hover:underline"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      حذف المفتاح الحالي
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setApiKey(value);
                  setValidationResult(null);
                }}
                placeholder="أدخل مفتاح Gemini هنا..."
                className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 focus:ring-0 outline-none transition-all text-left font-mono ${
                  validationResult?.valid 
                    ? 'border-green-500 bg-green-50' 
                    : validationResult?.valid === false 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-slate-200 focus:border-blue-500'
                }`}
                required
                disabled={isValidating}
              />
              {apiKey && !isValidating && !validationResult?.valid && (
                <button 
                  type="button"
                  onClick={() => { setApiKey(''); setValidationResult(null); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {validationResult && (
              <div className={`flex items-center gap-2 text-xs font-bold mt-2 ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">نوع المحرك (الموديل)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModel('gemini-1.5-flash')}
                disabled={isValidating}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  model === 'gemini-1.5-flash' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Gemini 1.5 Flash
                <span className="block text-[10px] font-normal opacity-70">الأسرع والأكثر استقراراً</span>
              </button>
              <button
                type="button"
                onClick={() => setModel('gemini-1.5-pro')}
                disabled={isValidating}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  model === 'gemini-1.5-pro' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' 
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                Gemini 1.5 Pro
                <span className="block text-[10px] font-normal opacity-70">دقة عالية للخطوط الصعبة</span>
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Info className="w-4 h-4" />
              <span>كيفية الحصول على المفتاح؟</span>
            </div>
            <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside pr-2">
              <li>اذهب إلى موقع <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold inline-flex items-center gap-1">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
              <li>من القائمة الجانبية، اضغط على زر <span className="font-bold">"Get API key"</span>.</li>
              <li>اضغط على <span className="font-bold">"Create API key in new project"</span>.</li>
              <li>انسخ المفتاح الناتج (يبدأ بـ AIza...) والصقه في الحقل أعلاه.</li>
            </ol>
          </div>

          <button
            type="submit"
            disabled={isValidating || (validationResult?.valid && apiKey === currentConfig?.apiKey && model === currentConfig?.model)}
            className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              isValidating 
                ? 'bg-slate-400 cursor-not-allowed text-white' 
                : validationResult?.valid 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : validationResult?.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>تم التحقق والحفظ!</span>
              </>
            ) : (
              <span>حفظ الإعدادات</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
