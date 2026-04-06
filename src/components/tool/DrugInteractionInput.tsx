import React from 'react';
import { Plus, X, Loader2, Send } from 'lucide-react';
import { motion } from 'framer-motion';

import { Drug } from '../../types';

interface DrugInteractionInputProps {
  drugs: Drug[];
  currentDrug: string;
  setCurrentDrug: (val: string) => void;
  addDrug: () => void;
  removeDrug: (id: string) => void;
  loading: boolean;
  loadingMessage: string;
}

export default function DrugInteractionInput({
  drugs,
  currentDrug,
  setCurrentDrug,
  addDrug,
  removeDrug,
  loading,
  loadingMessage
}: DrugInteractionInputProps) {
  return (
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
          {drugs.map((drug) => (
            <motion.div
              key={drug.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 shadow-sm"
            >
              {drug.name}
              <button
                type="button"
                onClick={() => removeDrug(drug.id)}
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
            {loadingMessage}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            بدء فحص التداخلات
          </>
        )}
      </button>
    </div>
  );
}
