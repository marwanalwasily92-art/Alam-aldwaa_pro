import { Camera, Image as ImageIcon, Send, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DrugInteractionInput from './DrugInteractionInput';

import { Drug } from '../../types';

interface ToolInputFormProps {
  isChatMode: boolean;
  tool: string;
  currentTool: any;
  input: string;
  setInput: (val: string) => void;
  image: string | null;
  setImage: (val: string | null) => void;
  drugs: Drug[];
  setDrugs: (val: Drug[]) => void;
  currentDrug: string;
  setCurrentDrug: (val: string) => void;
  loading: boolean;
  loadingMessage: string;
  handleSubmit: (e: React.FormEvent) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showSourceSelect: boolean;
  setShowSourceSelect: (val: boolean) => void;
  showChatImageMenu: boolean;
  setShowChatImageMenu: (val: boolean) => void;
  addDrug: () => void;
  removeDrug: (id: string) => void;
  setError: (val: string | null) => void;
  checkPermission: (type: 'camera' | 'photos', callback: () => void) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ToolInputForm({
  isChatMode,
  tool,
  currentTool,
  input,
  setInput,
  image,
  setImage,
  drugs,
  setDrugs,
  currentDrug,
  setCurrentDrug,
  loading,
  loadingMessage,
  handleSubmit,
  handleImageUpload,
  showSourceSelect,
  setShowSourceSelect,
  showChatImageMenu,
  setShowChatImageMenu,
  addDrug,
  removeDrug,
  setError,
  checkPermission,
  fileInputRef,
  cameraInputRef,
  textareaRef
}: ToolInputFormProps) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 no-print ${
      isChatMode ? "fixed bottom-[72px] left-0 right-0 z-30 max-w-5xl mx-auto px-4 pb-4 bg-transparent border-none shadow-none" : "overflow-hidden"
    }`}>
      <div className={isChatMode ? "bg-white rounded-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border border-slate-100" : ""}>
        <form onSubmit={handleSubmit} className={`${isChatMode ? "p-2" : "p-4 sm:p-6"} space-y-4 sm:space-y-6`}>
          <input 
            type="file" 
            id="chat-file-input"
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <input 
            type="file" 
            id="chat-camera-input"
            ref={cameraInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            capture="environment"
            className="hidden" 
          />
          {currentTool.hasImage && !isChatMode && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">صورة الروشتة أو الحالة</label>
              
              {!image && !showSourceSelect && (
                <div 
                  onClick={() => setShowSourceSelect(true)}
                  className="h-32 sm:h-auto sm:aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-xs text-slate-500">اضغط للرفع أو الالتقاط</div>
                  </div>
                </div>
              )}

              {showSourceSelect && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => checkPermission('camera', () => cameraInputRef.current?.click())}
                    className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="font-bold text-xs sm:text-sm">التقاط صورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => checkPermission('photos', () => fileInputRef.current?.click())}
                    className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="font-bold text-xs sm:text-sm">من المعرض</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowSourceSelect(false)}
                    className="col-span-2 py-2 text-slate-400 text-xs hover:text-slate-600"
                  >
                    إلغاء
                  </button>
                </div>
              )}

              {image && (
                <div className="relative h-32 sm:h-auto sm:aspect-video rounded-2xl overflow-hidden border-2 border-blue-500 group">
                  <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowSourceSelect(true)}
                      className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setImage(null)}
                      className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {tool === 'interaction' ? (
            <DrugInteractionInput
              drugs={drugs}
              currentDrug={currentDrug}
              setCurrentDrug={setCurrentDrug}
              addDrug={addDrug}
              removeDrug={removeDrug}
              loading={loading}
              loadingMessage={loadingMessage}
            />
          ) : (
            <div className="space-y-3">
              {!isChatMode && (
                <label className="text-sm font-bold text-slate-700 block">
                  التفاصيل {image && '(اختياري)'}
                </label>
              )}

              {isChatMode && image && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm mb-2"
                >
                  <img src={image} alt="Selected" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              <div className="flex items-end gap-2 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner">
                {(input.trim() || image || drugs.length > 0) && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput('');
                      setImage(null);
                      setDrugs([]);
                      setCurrentDrug('');
                      setError(null);
                    }}
                    className="flex flex-col items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all mb-0.5"
                    title="مسح الكل"
                  >
                    <X className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-0.5">حذف</span>
                  </button>
                )}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={image ? 'أضف ملاحظات إضافية (اختياري)...' : currentTool.placeholder}
                  rows={isChatMode ? 1 : 2}
                  className={`flex-1 bg-transparent border-none rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:ring-0 outline-none transition-all resize-none ${isChatMode ? "max-h-32 overflow-y-auto" : ""}`}
                />

                <div className="flex items-center gap-1.5 px-1 pb-1">
                  <button
                    type="submit"
                    disabled={loading || (!input.trim() && !image)}
                    className="p-2 sm:p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-400 transition-all active:scale-90 shadow-md hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  
                  {isChatMode && currentTool.hasImage && (
                    <div className="relative">
                      <AnimatePresence>
                        {showChatImageMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 flex flex-col gap-1 min-w-[180px] z-[60]"
                          >
                            <label
                              htmlFor="chat-camera-input"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowChatImageMenu(false);
                                checkPermission('camera', () => cameraInputRef.current?.click());
                              }}
                              className="flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl text-slate-700 transition-colors text-right group cursor-pointer"
                            >
                              <span className="text-sm font-bold group-hover:text-blue-600">التقاط صورة</span>
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Camera className="w-5 h-5" />
                              </div>
                            </label>
                            <label
                              htmlFor="chat-file-input"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowChatImageMenu(false);
                                checkPermission('photos', () => fileInputRef.current?.click());
                              }}
                              className="flex items-center justify-between p-4 hover:bg-emerald-50 rounded-2xl text-slate-700 transition-colors text-right group cursor-pointer"
                            >
                              <span className="text-sm font-bold group-hover:text-emerald-600">من المعرض</span>
                              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            </label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => setShowChatImageMenu(!showChatImageMenu)}
                        className={`p-2 sm:p-3 rounded-full transition-all border-2 ${image ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300"}`}
                      >
                        <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {loading && !isChatMode && (
                <div className="flex items-center gap-2 text-blue-600 text-xs font-bold animate-pulse px-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{loadingMessage}</span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
