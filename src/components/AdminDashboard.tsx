import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, Users, Activity, Clock, AlertCircle, Trash2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { performMassSelfDestruction } from '../lib/localHistory';
import { cn } from '../lib/utils';

interface SystemStats {
  user_count: number;
  last_reset_date: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adminEmails = ["marwanalwasily96@gmail.com", "kinging71317@gmail.com", "salahwasel129@gmail.com"];
  const isAdmin = user && adminEmails.includes(user.email || '');

  const [isDestroying, setIsDestroying] = useState(false);
  const [destroySuccess, setDestroySuccess] = useState(false);

  const handleSelfDestruct = async () => {
    if (!window.confirm("⚠️ تحذير: سيتم مسح كافة سجلات الاستخدام، الذاكرة المؤقتة، وإحصائيات النظام بالكامل. هل أنت متأكد؟")) {
      return;
    }

    setIsDestroying(true);
    try {
      await performMassSelfDestruction(user);
      setDestroySuccess(true);
      setTimeout(() => setDestroySuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "فشل التدمير الذاتي.");
    } finally {
      setIsDestroying(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const statsRef = doc(db, 'system_stats', 'daily');
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data() as SystemStats);
      } else {
        setError('لا توجد بيانات إحصائية حالياً.');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching stats:', err);
      setError('فشل في تحميل الإحصائيات. تأكد من صلاحيات المسؤول.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  const currentQuota = (stats?.user_count || 0) < 400 ? 10 : 5;
  const usagePercentage = Math.min(((stats?.user_count || 0) / 400) * 100, 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">لوحة تحكم المسؤول</h2>
          <p className="text-sm text-slate-500 font-medium">مرحباً بك، {user?.displayName}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Users Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المستخدمين اليوم</span>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900">{stats?.user_count || 0}</div>
              <p className="text-xs text-slate-500 mt-1">مستخدم فريد قام بعمليات تحليل اليوم</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                <span>ضغط النظام</span>
                <span>{Math.round(usagePercentage)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${usagePercentage > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Quota Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-green-50 rounded-2xl">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">حالة الحصة الحالية</span>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900">{currentQuota}</div>
              <p className="text-xs text-slate-500 mt-1">طلبات مسموحة لكل مستخدم حالياً</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold ${currentQuota === 10 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              <Clock className="w-3 h-3" />
              {currentQuota === 10 ? 'الوضع العادي (كرم)' : 'وضع الحماية (محدود)'}
            </div>
          </div>

          {/* System Info */}
          <div className="md:col-span-2 bg-slate-900 p-6 rounded-3xl text-white space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              معلومات النظام
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase">تاريخ التصفير</p>
                <p className="text-sm font-mono font-bold">{stats?.last_reset_date}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase">المنطقة الزمنية</p>
                <p className="text-sm font-bold">مكة المكرمة</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase">حد التقلص</p>
                <p className="text-sm font-bold">400 مستخدم</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase">حالة Firebase</p>
                <p className="text-sm font-bold text-green-400">مستقر (Spark)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Destruction Section */}
      <div className="bg-red-50 border border-red-100 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Zap className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-900">منطقة الخطر: التدمير الذاتي الجماعي</h3>
        </div>
        <p className="text-xs text-red-800 leading-relaxed">
          هذا الخيار يقوم بمسح كافة البيانات المؤقتة (السجلات، الكاش، عدادات الأجهزة) لتصفير النظام بالكامل. 
          يُستخدم هذا الإجراء لضمان بقاء المشروع ضمن "الخطة المجانية" للأبد عبر منع تراكم البيانات الضخمة.
        </p>
        
        <button
          onClick={handleSelfDestruct}
          disabled={isDestroying}
          className={cn(
            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg",
            isDestroying ? "bg-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white active:scale-95"
          )}
        >
          {isDestroying ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              تفعيل التدمير الذاتي الجماعي 🧨
            </>
          )}
        </button>

        {destroySuccess && (
          <div className="bg-green-100 text-green-800 p-3 rounded-xl text-center text-xs font-bold animate-in slide-in-from-bottom duration-300">
            ✅ تمت عملية التدمير الذاتي بنجاح! تم تصفير النظام.
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl space-y-2">
        <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          ملاحظة للمسؤول
        </p>
        <p className="text-[10px] text-amber-800 leading-relaxed">
          هذه البيانات تعكس الاستهلاك الفعلي لليوم الحالي فقط. يتم تصفير العدادات تلقائياً عند الساعة 12:00 منتصف الليل بتوقيت مكة المكرمة. 
          تذكر أن استهلاك القراءات هنا مجاني تماماً ولا يؤثر على أداء التطبيق.
        </p>
      </div>
    </div>
  );
}
