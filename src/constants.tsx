import React from 'react';
import { Camera, Sparkles, Pill, MessageSquare, FileText, Package, Activity, Scan, FileSearch, FlaskConical, ScanFace, Box, ArrowLeftRight } from 'lucide-react';
import { ToolType } from './types';

export interface ToolDefinition {
  id: ToolType;
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl?: string;
  badge?: string;
  color: string;
  shadow: string;
  loadingMessages: string[];
  placeholder: string;
  hasImage: boolean;
  defaultPrompt?: string;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'prescription',
    title: 'قراءة الروشتة',
    description: 'رفع صورة أو التقاطها لفك شفرة الخط واستخراج البدائل الدقيقة.',
    icon: React.createElement(FileSearch, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/prescription_mpaorj.jpg',
    color: 'bg-white text-blue-600',
    shadow: 'shadow-blue-200',
    loadingMessages: [
      "جاري فك شفرة خط الطبيب...",
      "تحليل أسماء الأدوية والجرعات...",
      "البحث عن البدائل اليمنية المتوفرة (يدكو، شفا، سبأ...)",
      "فحص التداخلات الدوائية لضمان سلامة المريض...",
      "تجهيز جدول الأدوية والبدائل المحلية..."
    ],
    placeholder: 'أضف ملاحظات إضافية...',
    hasImage: true,
    defaultPrompt: 'حلل هذه الروشتة واستخرج الأدوية والبدائل اليمنية المتوفرة'
  },
  {
    id: 'radiology',
    title: 'قراءة الأشعة والتقارير الطبية',
    description: 'تحليل وترجمة التقارير الطبية، الأشعة (CT, MRI)، والسونار (الأشعة التلفزيونية).',
    icon: React.createElement(Scan, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/radiology_aktae8.jpg',
    color: 'bg-cyan-600 text-white',
    shadow: 'shadow-cyan-200',
    loadingMessages: [
      "جاري تحليل التقرير الطبي بدقة...",
      "فحص صور الأشعة والنتائج...",
      "ترجمة المصطلحات الطبية المعقدة...",
      "تلخيص الحالة وتقديم التوصيات...",
      "تجهيز التقرير النهائي المترجم والمبسط..."
    ],
    placeholder: 'ارفع صورة التقرير الطبي، الأشعة، أو السونار (Ultrasound) للتحليل والترجمة...',
    hasImage: true,
    defaultPrompt: 'تحليل وترجمة التقارير الطبية، الأشعة (X-ray, CT, MRI)، والسونار (الأشعة التلفزيونية).'
  },
  {
    id: 'lab',
    title: 'قراءة الفحوصات المخبرية',
    description: 'تحليل نتائج الفحوصات الطبية وشرح النسب الطبيعية والدلالات.',
    icon: React.createElement(FlaskConical, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/lab_u1u3tv.jpg',
    color: 'bg-rose-600 text-white',
    shadow: 'shadow-rose-200',
    loadingMessages: [
      "جاري قراءة نتائج الفحص المخبري...",
      "مقارنة النتائج مع النسب الطبيعية العالمية...",
      "تحليل دلالات الارتفاع والانخفاض في القيم...",
      "تجهيز تقرير مبسط وشامل للحالة..."
    ],
    placeholder: 'أدخل تفاصيل الفحص أو ارفع صورته...',
    hasImage: true,
    defaultPrompt: 'حلل نتائج هذا الفحص المخبري، قارنها بالنسب الطبيعية، ووضح الدلالات الطبية لكل نتيجة'
  },
  {
    id: 'skin',
    title: 'تشخيص جلدي',
    description: 'تحليل الصور الجلدية وتحديد الحالة والروتين المناسب.',
    icon: React.createElement(ScanFace, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/skin_nhxjxm.jpg',
    color: 'bg-emerald-600 text-white',
    shadow: 'shadow-emerald-200',
    loadingMessages: [
      "جاري فحص أنسجة الجلد بدقة...",
      "مقارنة الحالة مع قاعدة البيانات الجلدية...",
      "تحديد المواد الفعالة المناسبة...",
      "تصميم روتين العناية الأمثل لحالتك...",
      "لحظات، الخبير يراجع تفاصيل الصورة..."
    ],
    placeholder: 'صف الحالة أو الأعراض...',
    hasImage: true,
    defaultPrompt: 'حلل حالة الجلد في هذه الصورة وقدم تشخيصاً أولياً وروتين عناية مناسب'
  },
  {
    id: 'drug_id',
    title: 'كاشف الأدوية',
    description: 'التعرف على الدواء من خلال صورة العبوة أو الشريط.',
    icon: React.createElement(Box, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/drug_id_bgqyeq.jpg',
    color: 'bg-orange-600 text-white',
    shadow: 'shadow-orange-200',
    loadingMessages: [
      "جاري فحص صورة عبوة الدواء...",
      "التعرف على الاسم التجاري والمادة الفعالة...",
      "استخراج بيانات الشركة المصنعة والتركيز...",
      "البحث عن دواعي الاستعمال والجرعات المناسبة...",
      "تجهيز بطاقة معلومات الدواء الاحترافية..."
    ],
    placeholder: 'ارفع صورة العبوة أو الشريط للتعرف عليه...',
    hasImage: true,
    defaultPrompt: 'تعرف على هذا الدواء من الصورة واستخرج (الاسم، المادة الفعالة، التركيز، الشركة، ودواعي الاستعمال)'
  },
  {
    id: 'interaction',
    title: 'فحص تعارض الأدوية',
    description: 'فحص تعارض الأدوية وشرح السبب العلمي للتعارض.',
    icon: React.createElement(ArrowLeftRight, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/interaction_dba5rv.jpg',
    color: 'bg-amber-600 text-white',
    shadow: 'shadow-amber-200',
    loadingMessages: [
      "جاري فحص التداخلات بين الأدوية المختارة...",
      "تحليل مستوى الخطورة (🔴، 🟡، 🟢)...",
      "مراجعة المراجع العلمية الدوائية...",
      "تجهيز التفسير العلمي المبسط..."
    ],
    placeholder: 'أدخل أسماء الأدوية المراد فحصها...',
    hasImage: false,
    defaultPrompt: ''
  },
  {
    id: 'consultation',
    title: 'استشارة صيدلانية',
    description: 'شات طبي مفتوح مع خبير صيدلاني مخصص لك.',
    icon: React.createElement(MessageSquare, { className: "w-8 h-8" }),
    imageUrl: 'https://res.cloudinary.com/dkdqjpjwb/image/upload/consultation_ibu7bm.jpg',
    badge: 'جديد',
    color: 'bg-indigo-600 text-white',
    shadow: 'shadow-indigo-200',
    loadingMessages: [
      "جاري تحليل استفسارك الطبي...",
      "البحث في المراجع الصيدلانية الموثوقة...",
      "تجهيز إجابة دقيقة وشاملة...",
      "لحظات، الخبير الصيدلاني يراجع الرد..."
    ],
    placeholder: 'اسأل عن أي معلومة طبية أو صيدلانية...',
    hasImage: true,
    defaultPrompt: 'حلل هذه الصورة الطبية أو الاستفسار وقدم استشارة صيدلانية دقيقة وشاملة'
  },
];
