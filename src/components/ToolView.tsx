import React, { useState, useRef, useEffect } from 'react';
import { type Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Pill, MessageSquare, FileText, Package, Activity, Scan, FileSearch, FlaskConical, ScanFace, Box, ArrowLeftRight, ArrowRight, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ToolType, Drug } from '../types';
import { generateGeminiResponse, generateGeminiStream } from '../lib/gemini';
import { storage, db, getDeviceId, checkAndIncrementQuota, deleteImageFromStorage, getCache, setCache } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';
import { saveToLocalHistory } from '../lib/localHistory';
import imageCompression from 'browser-image-compression';
import { TOOLS } from '../constants';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

import ImageCropperModal from './tool/ImageCropperModal';
import ToolInputForm from './tool/ToolInputForm';
import ToolResponse from './tool/ToolResponse';
import PermissionModal from './PermissionModal';

export default function ToolView() {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config, saveConfig, setShowApiKeyModal } = useConfig();

  const tool = toolId as ToolType;
  const userId = user?.uid || 'anonymous';

  const onBack = () => navigate(-1);
  const onOpenSettings = () => setShowApiKeyModal(true);
  const onSelectTool = (t: ToolType) => navigate(`/tool/${t}`);
  const [input, setInput] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [currentDrug, setCurrentDrug] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSourceSelect, setShowSourceSelect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('جاري المعالجة...');
  const [pendingMessage, setPendingMessage] = useState<{ text: string; image: string | null } | null>(null);
  const [showChatImageMenu, setShowChatImageMenu] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState({ hours: 0, minutes: 0 });

  // Fetch initial quota
  useEffect(() => {
    const fetchQuota = async () => {
      if (!userId) return;
      const hasCustomKey = !!config?.apiKey;
      // We use a "check" without incrementing to get the current state
      // But checkAndIncrementQuota increments. We need a read-only version.
      // Actually, we can just listen to the device_usage doc directly like in App.tsx
    };
    
    // Instead of a one-time fetch, let's use a listener for real-time updates
    const deviceId = getDeviceId();
    let statsUnsub: () => void;
    
    const deviceUnsub = onSnapshot(doc(db, 'device_usage', deviceId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const today = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Riyadh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date());
        
        const hasCustomKey = !!config?.apiKey;
        const usage = data.last_reset_date === today ? (data.usage_count || 0) : 0;
        const anonymousLimit = data.anonymous_limit || 5;
        const hasLimitSet = data.anonymous_limit_set && data.last_reset_date === today;

        // We need stats for the true maxQuota
        statsUnsub = onSnapshot(doc(db, 'system_stats', 'daily'), (statsSnap) => {
          const statsData = statsSnap.exists() ? statsSnap.data() : null;
          const privateUserCount = statsData?.private_user_count || 0;
          const lastResetDate = statsData?.last_reset_date || '';
          
          let maxQuota = 5;
          if (hasCustomKey) {
            maxQuota = (lastResetDate === today && privateUserCount >= 400) ? 5 : 10;
          }

          if (hasCustomKey) {
            setQuotaRemaining(Math.max(0, maxQuota - usage));
          } else {
            const limit = hasLimitSet ? anonymousLimit : 5;
            const remaining = Math.max(0, limit - usage);
            setQuotaRemaining(remaining);
          }
        });
      } else {
        setQuotaRemaining(config?.apiKey ? 10 : 5);
      }
    });

    return () => {
      deviceUnsub();
      if (statsUnsub) statsUnsub();
    };
  }, [userId, config?.apiKey]);

  // Mecca Time Countdown
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const meccaNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
      const meccaMidnight = new Date(meccaNow);
      meccaMidnight.setHours(24, 0, 0, 0);
      const diff = meccaMidnight.getTime() - meccaNow.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset({ hours, minutes });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Permission state
  const [permissionModal, setPermissionModal] = useState<{ isOpen: boolean; type: 'camera' | 'photos' }>({
    isOpen: false,
    type: 'camera'
  });

  const checkPermission = (type: 'camera' | 'photos', callback: () => void) => {
    const key = `permission_${type}_requested`;
    const alreadyRequested = localStorage.getItem(key);
    
    if (!alreadyRequested) {
      setPermissionModal({ isOpen: true, type });
      // Store the callback to execute after permission is granted
      (window as any)._pendingPermissionCallback = callback;
    } else {
      callback();
    }
  };

  const handlePermissionConfirm = async () => {
    const type = permissionModal.type;
    const key = `permission_${type}_requested`;
    
    if (type === 'camera') {
      try {
        // Trigger actual browser prompt
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop stream immediately
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn('Camera permission denied or failed:', err);
      }
    }
    
    localStorage.setItem(key, 'true');
    setPermissionModal({ ...permissionModal, isOpen: false });
    
    // Execute the pending action
    if ((window as any)._pendingPermissionCallback) {
      (window as any)._pendingPermissionCallback();
      (window as any)._pendingPermissionCallback = null;
    }
  };

  // Cropping state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  const isChatMode = tool === 'consultation';
  const currentTool = TOOLS.find(t => t.id === tool);

  useEffect(() => {
    if (!currentTool) {
      navigate('/');
      return;
    }
    setResponse(null);
    setInput('');
    setImage(null);
    setDrugs([]);
    setCurrentDrug('');
    setError(null);
    setPendingMessage(null);
  }, [tool, currentTool, navigate]);

  useEffect(() => {
    if (textareaRef.current && isChatMode) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, isChatMode]);

  useEffect(() => {
    let interval: any;
    if (loading && currentTool?.loadingMessages) {
      let index = 0;
      setLoadingMessage(currentTool.loadingMessages[0]);
      interval = setInterval(() => {
        index = (index + 1) % currentTool.loadingMessages!.length;
        setLoadingMessage(currentTool.loadingMessages![index]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, currentTool?.loadingMessages]);

  useEffect(() => {
    if (response && responseRef.current) {
      setTimeout(() => {
        responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [response]);

  useEffect(() => {
    if (loading && scrollTargetRef.current) {
      // Scroll to the pending message/loading indicator on mobile screens
      if (window.innerWidth < 768) {
        setTimeout(() => {
          const yOffset = -20; 
          const element = scrollTargetRef.current;
          if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [loading]);

  useEffect(() => {
    const handleOffline = () => {
      if (loading) {
        setLoading(false);
        setError('انقطع الاتصال بالإنترنت. يرجى التحقق من الشبكة وإعادة المحاولة.');
        setPendingMessage(null);
      }
    };

    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [loading]);

  if (!currentTool) return null;


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
          const dataUrl = canvas.toDataURL('image/webp', 0.8);
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
    const initialCrop: Crop = {
      unit: '%',
      x: 5,
      y: 5,
      width: 90,
      height: 90
    };
    setCrop(initialCrop);
    setCompletedCrop(convertToPixelCrop(initialCrop, width, height));
  };

  const getCroppedImg = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);

    try {
      let cropToUse = completedCrop;
      if (!cropToUse || cropToUse.width === 0 || cropToUse.height === 0) {
        setImage(cropImage);
        setCropImage(null);
        setIsProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

      canvas.width = cropToUse.width;
      canvas.height = cropToUse.height;

      ctx.drawImage(
        imgRef.current,
        cropToUse.x * scaleX,
        cropToUse.y * scaleY,
        cropToUse.width * scaleX,
        cropToUse.height * scaleY,
        0,
        0,
        cropToUse.width,
        cropToUse.height
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
        finalDataUrl = resizedCanvas.toDataURL('image/webp', 0.8);
      } else {
        finalDataUrl = canvas.toDataURL('image/webp', 0.8);
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

  const handleSkipCrop = () => {
    setImage(cropImage);
    setCropImage(null);
  };

  const addDrug = () => {
    if (currentDrug.trim()) {
      const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setDrugs([...drugs, { id, name: currentDrug.trim() }]);
      setCurrentDrug('');
    }
  };

  const removeDrug = (id: string) => {
    setDrugs(drugs.filter((drug) => drug.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Spam Click Protection
    
    if (!navigator.onLine) {
      setError('لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة والمحاولة مرة أخرى.');
      return;
    }
    
    let finalInput = input.trim();
    if (tool === 'interaction') {
      const allDrugs = [...drugs];
      if (currentDrug.trim()) {
        const id = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
        allDrugs.push({ id, name: currentDrug.trim() });
      }

      if (allDrugs.length < 2) {
        setError('يرجى إضافة دواءين على الأقل لفحص التداخلات.');
        return;
      }
      
      finalInput = `الأدوية المراد فحص التداخلات بينها هي: ${allDrugs.map(d => d.name).join('، ')}`;
    }

    if (!finalInput && !image) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    let finalImage = image;
    
      // Compress image if exists
      if (finalImage) {
        try {
          setLoadingMessage('جاري ضغط الصورة مع الحفاظ على دقة التفاصيل...');
          const response = await fetch(finalImage);
          const blob = await response.blob();
          const options = {
            maxSizeMB: 0.15, // Reduced to 150KB for WebP
            maxWidthOrHeight: 1920, // Kept at Full HD (1920px) to preserve OCR accuracy
            useWebWorker: true,
            fileType: 'image/webp', // Convert to WebP to save bandwidth
          };
          const compressedBlob = await imageCompression(blob as File, options);
          const reader = new FileReader();
          finalImage = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressedBlob);
          });
        } catch (compressionErr) {
          console.error('Compression error:', compressionErr);
          setError('فشل معالجة الصورة. يرجى المحاولة بصورة أخرى.');
          setLoading(false);
          return;
        }
      }

    setPendingMessage({ text: finalInput, image: finalImage });
    setInput('');
    setImage(null);
    setDrugs([]);
    setCurrentDrug('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    try {
      
      // 1. Check Cache first (before incrementing quota)
      const cachedResponse = await getCache(tool, finalInput, finalImage || undefined);
      if (cachedResponse) {
        setResponse(cachedResponse);
        setLoading(false);
        setPendingMessage(null);
        return;
      }

      // 2. Check and Increment Quota (only if cache miss)
      const hasCustomKey = !!config?.apiKey;
      const quota = await checkAndIncrementQuota(userId, hasCustomKey);
      
      if (!quota.allowed) {
        setLoading(false);
        if (!hasCustomKey && quota.maxQuota === 5) {
          setError('لقد استهلكت حصتك المجانية السريعة (5 طلبات). هل تعلم أنه يمكنك الحصول على 10 طلبات يومياً إذا أضفت مفتاح Gemini الخاص بك؟');
        } else if (quota.maxQuota === 0) {
          setError('عذراً، استنفدت الخدمة حصتها المجانية العامة لهذا اليوم لدعم استمرار الخدمة مجاناً لجميع الصيادلة. سيتم تجديد الحصة تلقائياً غداً.');
        } else {
          setError(`عذراً، استنفدت حصتك اليومية (${quota.maxQuota} تحليلات). سيتم تجديد الحصة تلقائياً غداً.`);
        }
        return;
      }
      setQuotaRemaining(quota.remaining);

      let retryCount = 0;
      const maxRetries = 3;
      let success = false;
      let result = '';
      let currentModel = config?.model || 'gemini-3-flash-preview';

      while (retryCount <= maxRetries && !success) {
        try {
          if (retryCount > 0) {
            setLoadingMessage(`الشبكة ضعيفة، جاري محاولة الإرسال... (المحاولة ${retryCount} من ${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
          }

          // 1. Start Gemini Stream
          result = await generateGeminiStream(
            config?.apiKey || '',
            currentModel,
            tool,
            finalInput || currentTool.defaultPrompt || 'حلل هذه الصورة',
            finalImage || undefined,
            (chunk) => {
              setResponse(prev => (prev || '') + chunk);
              setLoading(false); // Hide loading as soon as we get first chunk
            }
          );
          success = true;
        } catch (err: any) {
          const msg = err.message || "";
          
          if ((msg.includes("QUOTA_ERROR") || msg.includes("quota") || msg.includes("429")) && currentModel === 'gemini-3.1-pro-preview') {
            currentModel = 'gemini-3-flash-preview';
            if (config) {
              saveConfig({ ...config, model: 'gemini-3-flash-preview' });
            }
            setLoadingMessage("انتهت حصة Pro، جاري المحاولة باستخدام Flash...");
            continue;
          }

          const isNetworkError = msg.includes('Failed to fetch') || 
                                 msg.includes('NetworkError') || 
                                 msg.includes('fetch failed') ||
                                 !navigator.onLine;
          
          if (isNetworkError && retryCount < maxRetries) {
            retryCount++;
            console.warn(`Network error, retrying... (${retryCount}/${maxRetries})`);
          } else {
            throw err; // Re-throw if it's not a network error or we've exhausted retries
          }
        }
      }

      setResponse(result);
      setLoading(false);

      // 3. Store in Cache
      await setCache(tool, finalInput, result, finalImage || undefined);

      // 4. Handle Storage and History (Local Only)
      const processPostAnalysis = async () => {
        let imagePath = null;
        
        // Upload temporarily to get a URL for Gemini if needed (but we already called Gemini)
        // Wait, Gemini call happened with finalImage (dataUrl).
        // The user wants instant deletion from Storage.
        
        if (finalImage) {
          try {
            const imageId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
            imagePath = `temp/${userId}/${imageId}.jpg`;
            const storageRef = ref(storage, imagePath);
            await uploadString(storageRef, finalImage, 'data_url');
            
            // DELETE IMMEDIATELY after upload/process (as per strict requirement)
            // But wait, if we delete it now, it won't be available for the history view if it uses the URL.
            // The user said: "Delete the image from Storage immediately after receiving the text result".
            // So we delete it NOW.
            await deleteImageFromStorage(imagePath);
          } catch (err) {
            console.error('Storage cleanup error:', err);
          }
        }

        if (!config?.incognitoMode) {
          saveToLocalHistory({
            user_id: userId,
            tool_type: tool,
            response: result,
            input_text: finalInput || undefined,
            image_url: undefined, // No cloud URL saved
            created_at: new Date().toISOString(),
          }, user);
        }
      };

      processPostAnalysis();

    } catch (err: any) {
      setLoading(false);
      setPendingMessage(null); // Clear pending message on error so user can retry
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("API_KEY_INVALID") || msg.includes("invalid API key")) {
        setError("مفتاح API غير صالح. يرجى التأكد من صحة المفتاح في الإعدادات.");
      } else if (msg.includes("QUOTA_ERROR")) {
        setError("لقد بلغت حد الاستخدام المجاني اليومي لهذا المفتاح. جرب مفتاحاً آخر.");
      } else if (msg.includes("PERMISSION_ERROR")) {
        setError("هذا المفتاح محظور أو لا يملك صلاحيات كافية. تأكد من إعدادات المشروع في Google AI Studio.");
      } else if (msg.includes("MODEL_NOT_FOUND")) {
        setError("الموديل المختار غير متاح لهذا المفتاح. تأكد من تفعيل Gemini API في مشروعك في Google Cloud Console.");
      } else if (msg.includes("quota") || msg.includes("429")) {
        if (!config?.apiKey) {
          setError("عذراً، الخادم المجاني العام مزدحم حالياً بسبب ضغط الاستخدام. يرجى المحاولة مرة أخرى بعد قليل، أو أضف مفتاح Gemini الخاص بك من الإعدادات للحصول على حصة خاصة ومستقرة.");
        } else {
          setError("لقد بلغت حد الاستخدام المجاني اليومي لهذا المفتاح. سيتم تجديد الحصة تلقائياً خلال 24 ساعة.");
        }
      } else {
        setError(msg || 'حدث خطأ أثناء الاتصال بالمحرك. تأكد من صحة مفتاح API واتصال الإنترنت.');
      }
    }
  };

  const formatForSharing = (text: string) => {
    let formatted = text.replace(/\[SUGGEST_TOOL:\w+\]/g, '').trim();

    // 1. التعامل مع الجداول: تحويل الصفوف إلى نقاط مرتبة ومنسقة عمودياً لسهولة القراءة
    const lines = formatted.split('\n');
    const newLines: string[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // اكتشاف بداية الجدول أو صفوفه
      if (line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        
        // تجاهل خطوط التقسيم |---|---|
        if (line.includes('---')) {
          inTable = true;
          continue;
        }

        if (!inTable) {
          // هذا هو رأس الجدول
          tableHeaders = cells;
          inTable = true;
          newLines.push(''); // مسافة قبل الجدول
        } else {
          // هذا صف بيانات - تنسيق عمودي احترافي لكل صف
          let rowText = '📍 ';
          cells.forEach((cell, index) => {
            const header = tableHeaders[index] ? `*${tableHeaders[index]}:* ` : '';
            rowText += `${header}${cell}${index < cells.length - 1 ? '\n   ' : ''}`;
          });
          newLines.push(rowText + '\n');
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHeaders = [];
        }
        
        // تحويل العناوين # إلى بولد * (متوافق مع واتساب)
        if (line.startsWith('#')) {
          const cleanHeader = line.replace(/#+/g, '').trim();
          newLines.push(`\n*${cleanHeader}*\n`);
        } else {
          if (line !== '') newLines.push(line);
        }
      }
    }
    
    formatted = newLines.join('\n');

    // 2. تنظيف علامات الماركدوان المتبقية وتحويلها لتنسيق الواتساب/النص العادي
    formatted = formatted
      .replace(/\*\*\*(.*?)\*\*\*/g, '*$1*')
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // تحويل ** إلى * (بولد في واتساب)
      .replace(/__(.*?)__/g, '_$1_')     // تحويل __ إلى _ (مائل في واتساب)
      .replace(/`(.*?)`/g, '`$1`');      // الكود يبقى كما هو

    return formatted.trim();
  };

  const handleShare = () => {
    if (!response) return;
    const cleanText = formatForSharing(response);
    const shareText = `*نتائج تحليل ${currentTool.title} - عالم الدواء*\n\n${cleanText}\n\n--- \nتم التحليل بواسطة تطبيق *عالم الدواء الذكي* 💊`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopy = async () => {
    if (!response) return;
    const textToCopy = formatForSharing(response);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      handlePrint();
    }
  };

  const handlePrint = () => {
    if (!response) return;
    window.print();
  };

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 no-print ${isChatMode ? "pb-40" : "pb-10"}`} dir="rtl">
      <AnimatePresence mode="wait">
        {(!response && !loading) && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <ArrowRight className="w-6 h-6" />
              </button>
              <div className="space-y-1">
                <h2 className="font-bold text-slate-800 text-2xl sm:text-3xl md:text-[var(--font-size-fluid-h2)] leading-tight">{currentTool.title}</h2>
                {/* Quota Progress Bar & Mecca Countdown */}
                <div className="mt-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[7px] font-bold text-slate-700 flex items-center gap-1">
                        <Activity className="w-2 h-2 text-blue-500" />
                        حصة الاستخدام اليومية
                      </span>
                      <span className="text-[7px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        متبقي {quotaRemaining !== null ? quotaRemaining : '...'}
                      </span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: quotaRemaining !== null ? `${(quotaRemaining / (config?.apiKey ? 10 : 5)) * 100}%` : '100%' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="p-1 bg-white rounded shadow-xs">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[6px] text-slate-500 font-medium">تجديد الحصة (توقيت مكة)</p>
                      <p className="text-[7px] font-bold text-slate-700">
                        بعد {timeUntilReset.hours} ساعة و {timeUntilReset.minutes} دقيقة
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {config?.apiKey && (
              <div className="hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                <Key className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold font-mono">
                  {config?.apiKey.substring(0, 4)}...{config?.apiKey.substring(config.apiKey.length - 4)}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollTargetRef} className="scroll-mt-4" />

      {isChatMode ? (
        <>
          <div id="printable-report">
            <div className="pdf-header-container hidden print:flex">
              <div>
                <h1 className="pdf-header-title">استشارة صيدلانية</h1>
                <p className="pdf-header-date">{new Date().toLocaleDateString('ar-SA')}</p>
              </div>
              <div className="pdf-header-badge">
                {currentTool.title}
              </div>
            </div>
            <ToolResponse
              ref={responseRef}
              tool={tool}
              isChatMode={isChatMode}
              pendingMessage={pendingMessage}
              response={response}
              loading={loading}
              loadingMessage={loadingMessage}
              error={error}
              onOpenSettings={onOpenSettings}
              handleShare={handleShare}
              handleCopy={handleCopy}
              exportToPDF={handlePrint}
              onSelectTool={onSelectTool}
              onReset={() => {
                setResponse(null);
                setPendingMessage(null);
                setInput('');
                setImage(null);
                setDrugs([]);
                setCurrentDrug('');
                setError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
          {/* Privacy Disclaimer */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900">ضمان الخصوصية والاستدامة</p>
              <p className="text-[10px] text-blue-700 leading-relaxed">
                سيتم حذف صورك من خوادمنا فوراً بعد التحليل لضمان خصوصيتك. 
                يتم حفظ السجل في ذاكرة هاتفك فقط.
              </p>
            </div>
          </div>

          <ToolInputForm
            isChatMode={isChatMode}
            tool={tool}
            currentTool={currentTool}
            input={input}
            setInput={setInput}
            image={image}
            setImage={setImage}
            drugs={drugs}
            setDrugs={setDrugs}
            currentDrug={currentDrug}
            setCurrentDrug={setCurrentDrug}
            loading={loading}
            loadingMessage={loadingMessage}
            handleSubmit={handleSubmit}
            handleImageUpload={handleImageUpload}
            checkPermission={checkPermission}
            showSourceSelect={showSourceSelect}
            setShowSourceSelect={setShowSourceSelect}
            showChatImageMenu={showChatImageMenu}
            setShowChatImageMenu={setShowChatImageMenu}
            addDrug={addDrug}
            removeDrug={removeDrug}
            setError={setError}
            fileInputRef={fileInputRef}
            cameraInputRef={cameraInputRef}
            textareaRef={textareaRef}
          />
        </>
      ) : (
        <>
      <AnimatePresence mode="wait">
        {!response && !loading && !isChatMode && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <ToolInputForm
              isChatMode={isChatMode}
              tool={tool}
              currentTool={currentTool}
              input={input}
              setInput={setInput}
              image={image}
              setImage={setImage}
              drugs={drugs}
              setDrugs={setDrugs}
              currentDrug={currentDrug}
              setCurrentDrug={setCurrentDrug}
              loading={loading}
              loadingMessage={loadingMessage}
              handleSubmit={handleSubmit}
              handleImageUpload={handleImageUpload}
              checkPermission={checkPermission}
              showSourceSelect={showSourceSelect}
              setShowSourceSelect={setShowSourceSelect}
              showChatImageMenu={showChatImageMenu}
              setShowChatImageMenu={setShowChatImageMenu}
              addDrug={addDrug}
              removeDrug={removeDrug}
              setError={setError}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              textareaRef={textareaRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
          <div id="printable-report">
            <div className="pdf-header-container hidden print:flex">
              <div>
                <h1 className="pdf-header-title">استشارة صيدلانية</h1>
                <p className="pdf-header-date">{new Date().toLocaleDateString('ar-SA')}</p>
              </div>
              <div className="pdf-header-badge">
                {currentTool.title}
              </div>
            </div>
            <ToolResponse
              ref={responseRef}
              tool={tool}
              isChatMode={isChatMode}
              pendingMessage={pendingMessage}
              response={response}
              loading={loading}
              loadingMessage={loadingMessage}
              error={error}
              onOpenSettings={onOpenSettings}
              handleShare={handleShare}
              handleCopy={handleCopy}
              exportToPDF={handlePrint}
              onSelectTool={onSelectTool}
              onReset={() => {
                setResponse(null);
                setPendingMessage(null);
                setInput('');
                setImage(null);
                setDrugs([]);
                setCurrentDrug('');
                setError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </>
      )}

      <PermissionModal 
        isOpen={permissionModal.isOpen}
        type={permissionModal.type}
        onClose={() => setPermissionModal({ ...permissionModal, isOpen: false })}
        onConfirm={handlePermissionConfirm}
      />

      <ImageCropperModal
        cropImage={cropImage}
        crop={crop}
        setCrop={setCrop}
        setCompletedCrop={setCompletedCrop}
        imgRef={imgRef}
        onImageLoad={onImageLoad}
        onCancel={() => setCropImage(null)}
        onCrop={getCroppedImg}
        onSkipCrop={handleSkipCrop}
        isProcessing={isProcessing}
        completedCrop={completedCrop}
      />

      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
            dir="rtl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="font-bold text-sm">تم النسخ بنجاح!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
