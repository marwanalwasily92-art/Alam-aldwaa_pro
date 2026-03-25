import React from 'react';
import { Camera, Sparkles, Pill, MessageSquare, ArrowLeft } from 'lucide-react';
import { ToolType } from '../types';
import { motion } from 'framer-motion';

interface DashboardProps {
  onSelectTool: (tool: ToolType) => void;
}

export default function Dashboard({ onSelectTool }: DashboardProps) {
  const tools = [
    {
      id: 'prescription' as ToolType,
      title: 'تحليل الروشتة',
      description: 'رفع صورة أو التقاطها لفك شفرة الخط واستخراج البدائل اليمنية.',
      icon: <Camera className="w-8 h-8" />,
      color: 'bg-blue-600',
      shadow: 'shadow-blue-200',
    },
    {
      id: 'skin' as ToolType,
      title: 'فحص البشرة',
      description: 'تحليل الصور الجلدية وتحديد الحالة والروتين المناسب.',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'bg-emerald-600',
      shadow: 'shadow-emerald-200',
    },
    {
      id: 'interaction' as ToolType,
      title: 'كاشف التداخلات',
      description: 'فحص تعارض الأدوية وشرح السبب العلمي للتعارض.',
      icon: <Pill className="w-8 h-8" />,
      color: 'bg-amber-600',
      shadow: 'shadow-amber-200',
    },
    {
      id: 'consultation' as ToolType,
      title: 'استشارة خبير',
      description: 'شات طبي مفتوح مع خبير صيدلاني يمني رقمي.',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'bg-indigo-600',
      shadow: 'shadow-indigo-200',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">أهلاً بك يا دكتور</h2>
        <p className="text-slate-500">اختر الأداة التي تحتاجها لمساعدتك في الصيدلية اليوم.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTool(tool.id)}
            className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-right group"
          >
            <div className={`shrink-0 w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center text-white shadow-lg ${tool.shadow} group-hover:rotate-3 transition-transform`}>
              {tool.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">{tool.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-blue-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-4">
          <h3 className="text-xl font-bold">نصيحة اليوم</h3>
          <p className="text-blue-100 text-sm leading-relaxed">
            تأكد دائماً من مراجعة الجرعات للأطفال وكبار السن بناءً على الوزن والحالة الصحية العامة. الذكاء الاصطناعي أداة مساعدة، وقرارك المهني هو الأهم.
          </p>
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-800 rounded-full opacity-50"></div>
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-700 rounded-full opacity-30"></div>
      </div>
    </div>
  );
}
