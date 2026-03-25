import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight, Send, Camera, Image as ImageIcon, Share2, Loader2, CheckCircle2, AlertCircle, FileText, Sparkles, Pill, MessageSquare, Copy, Printer, X, Crop as CropIcon, Key, Plus } from 'lucide-react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ToolType, UserConfig } from '../types';
import { generateGeminiResponse } from '../lib/gemini';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ToolViewProps {
  tool: ToolType;
  config: UserConfig;
  onBack: () => void;
  userId: string;
  onOpenSettings?: () => void;
}

export default function ToolView({ tool, config, onBack, userId, onOpenSettings }: ToolViewProps) {
  const [input, setInput] = useState('');
  const [drugs, setDrugs] = useState<string[]>([]);
  const [currentDrug, setCurrentDrug] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSourceSelect, setShowSourceSelect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Cropping state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const toolInfo = {
    prescription: { 
      title: 'تحليل الروشتة', 
      placeholder: image ? 'أضف ملاحظات إضافية (اختياري)...' : 'أضف ملاحظات إضافية...', 
      hasImage: true 
    },
    skin: { 
      title: 'فحص البشرة', 
      placeholder: image ? 'صف الحالة (اختياري)...' : 'صف الحالة أو الأعراض...', 
      hasImage: true 
    },
    interaction: { 
      title: 'كاشف التداخلات', 
      placeholder: 'أدخل أسماء الأدوية المراد فحصها...', 
      hasImage: false 
    },
    consultation: { 
      title: 'استشارة خبير', 
      placeholder: 'اسأل عن أي معلومة طبية أو صيدلانية...', 
      hasImage: false 
    },
  }[tool];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size before processing (limit to 20MB for safety)
      if (file.size > 20 * 1024 * 1024) {
        setError('حجم الملف كبير جداً. يرجى اختيار صورة أصغر.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000; // Further reduced from 1200 to 1000 for better stability
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCropImage(dataUrl);
          setShowSourceSelect(false);
        } catch (err) {
          console.error('Canvas toDataURL error:', err);
          setError('فشل في معالجة الصورة. قد تكون الذاكرة ممتلئة.');
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError('فشل في تحميل الصورة. حاول مرة أخرى.');
      };

      img.src = objectUrl;
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        4 / 3,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const getCroppedImg = async () => {
    if (!imgRef.current || !completedCrop) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      // Resize if too large
      const maxDim = 800;
      let finalDataUrl = '';
      
      if (canvas.width > maxDim || canvas.height > maxDim) {
        const scale = maxDim / Math.max(canvas.width, canvas.height);
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = canvas.width * scale;
        resizedCanvas.height = canvas.height * scale;
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCtx?.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);
        finalDataUrl = resizedCanvas.toDataURL('image/jpeg', 0.6);
      } else {
        finalDataUrl = canvas.toDataURL('image/jpeg', 0.6);
      }
      
      setImage(finalDataUrl);
      setCropImage(null);
    } catch (e) {
      console.error('Cropping error:', e);
      setError('حدث خطأ أثناء معالجة الصورة. يرجى المحاولة مرة أخرى بصورة أصغر.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addDrug = () => {
    if (currentDrug.trim()) {
      setDrugs([...drugs, currentDrug.trim()]);
      setCurrentDrug('');
    }
  };

  const removeDrug = (index: number) => {
    setDrugs(drugs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalInput = input.trim();
    if (tool === 'interaction') {
      const allDrugs = [...drugs];
      if (currentDrug.trim()) {
        allDrugs.push(currentDrug.trim());
      }

      if (allDrugs.length < 2) {
        setError('يرجى إضافة دواءين على الأقل لفحص التداخلات.');
        return;
      }
      
      finalInput = `الأدوية المراد فحص التداخلات بينها هي: ${allDrugs.join('، ')}`;
    }

    if (!finalInput && !image) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let finalImageUrl = image;
      let imagePath = null;

      if (image) {
        const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        imagePath = `history/${userId}/${imageId}.jpg`;
        const storageRef = ref(storage, imagePath);
        
        // Upload base64 string
        await uploadString(storageRef, image, 'data_url');
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const result = await generateGeminiResponse(
        config.apiKey,
        config.model,
        tool,
        finalInput || (tool === 'prescription' ? 'حلل هذه الروشتة' : 'حلل هذه الصورة'),
        image || undefined
      );

      setResponse(result);

      // Save to Firestore
      const path = 'history';
      try {
        const historyData: any = {
          user_id: userId,
          tool_type: tool,
          response: result,
          created_at: serverTimestamp(),
        };
        
        if (finalInput) historyData.input_text = finalInput;
        if (finalImageUrl) historyData.image_url = finalImageUrl;
        if (imagePath) historyData.image_path = imagePath;

        await addDoc(collection(db, path), historyData);
      } catch (fsError) {
        handleFirestoreError(fsError, OperationType.WRITE, path);
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      
      if (msg.includes("API_KEY_ERROR")) {
        setError("مفتاح API غير صحيح. يرجى التأكد من إعدادات المفتاح وتغييره.");
      } else if (msg.includes("QUOTA_ERROR")) {
        setError("لقد بلغت حد الاستخدام المجاني اليومي لهذا المفتاح. جرب مفتاحاً آخر.");
      } else if (msg.includes("PERMISSION_ERROR")) {
        setError("هذا المفتاح محظور أو لا يملك صلاحيات كافية. تأكد من إعدادات المشروع في Google AI Studio.");
      } else if (msg.includes("MODEL_NOT_FOUND")) {
        setError("الموديل المختار غير متاح لهذا المفتاح. تأكد من تفعيل Gemini API في مشروعك في Google Cloud Console.");
      } else if (msg.includes("quota") || msg.includes("429")) {
        setError("لقد بلغت حد الاستخدام المجاني اليومي. سيتم تجديد الحصة تلقائياً خلال 24 ساعة.");
      } else {
        setError(msg || 'حدث خطأ أثناء الاتصال بالمحرك. تأكد من صحة مفتاح API واتصال الإنترنت.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!response) return;
    const text = `*نتائج تحليل ${toolInfo.title} - عالم الدواء*\n\n${response}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-10 no-print" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowRight className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{toolInfo.title}</h2>
        </div>
        {config.apiKey && (
          <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
            <Key className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold font-mono">
              {config.apiKey.substring(0, 4)}...{config.apiKey.substring(config.apiKey.length - 4)}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden no-print">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {toolInfo.hasImage && (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">صورة الروشتة أو الحالة</label>
              
              {!image && !showSourceSelect && (
                <div 
                  onClick={() => setShowSourceSelect(true)}
                  className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all group"
                >
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-slate-500">اضغط للرفع أو الالتقاط</div>
                  </div>
                </div>
              )}

              {showSourceSelect && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="font-bold text-sm">التقاط صورة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-2xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8" />
                    <span className="font-bold text-sm">من المعرض</span>
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
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-blue-500 group">
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

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </div>
          )}

          {tool === 'interaction' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-xs text-blue-700 leading-relaxed">
                  💡 <strong>طريقة الاستخدام:</strong> أضف أسماء الأدوية التي تتناولها واحداً تلو الآخر. سنقوم بفحص التداخلات الدوائية المحتملة بينها جميعاً.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">
                  أضف اسم الدواء
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentDrug}
                    onChange={(e) => setCurrentDrug(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDrug())}
                    placeholder="مثال: Aspirin"
                    className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={addDrug}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {drugs.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[60px]">
                  {drugs.map((drug, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {drug}
                      <button
                        type="button"
                        onClick={() => removeDrug(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (drugs.length < 2 && !currentDrug.trim())}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الفحص...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    بدء فحص التداخلات
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">
                التفاصيل {image && '(اختياري)'}
              </label>
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={toolInfo.placeholder}
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 focus:border-blue-500 focus:ring-0 outline-none transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !image)}
                  className="absolute left-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-400 transition-all active:scale-90"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <AnimatePresence mode="wait">
        {cropImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-full"
              >
                <img 
                  ref={imgRef}
                  src={cropImage} 
                  alt="Crop me" 
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </ReactCrop>
            </div>
            <div className="bg-slate-900 p-6 flex flex-col gap-4">
              <div className="text-white/60 text-xs text-center">
                قم بتحريك زوايا الإطار لاختيار الجزء المطلوب
              </div>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setCropImage(null)}
                  className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={getCroppedImg}
                  disabled={isProcessing || !completedCrop}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CropIcon className="w-5 h-5" />
                      <span>قص الصورة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
                      // This is a bit of a hack to clear it from ToolView
                      // In a real app we'd pass a clear function
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
          <motion.div 
            key="response-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  {tool === 'prescription' && <FileText className="w-6 h-6" />}
                  {tool === 'skin' && <Sparkles className="w-6 h-6" />}
                  {tool === 'interaction' && <Pill className="w-6 h-6" />}
                  {tool === 'consultation' && <MessageSquare className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-tight">النتيجة الذكية</h3>
                  <p className="text-[10px] text-slate-500">{toolInfo.title}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="طباعة"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(response);
                    alert('تم نسخ النص بنجاح');
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="نسخ النص"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="مشاركة"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 prose prose-slate max-w-none prose-headings:text-blue-900 prose-strong:text-blue-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
