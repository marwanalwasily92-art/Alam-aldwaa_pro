import React, { forwardRef } from 'react';
import { Share2, Copy, Plus, ArrowRight, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { motion } from 'framer-motion';
import { ToolType } from '../../types';
import { TOOLS } from '../../constants';
import { rehypeTableLabels } from '../../utils/rehypeTableLabels';

interface ResultDisplayProps {
  tool: ToolType;
  response: string;
  isChatMode: boolean;
  onShare: () => void;
  onCopy: () => void;
  onExport: () => void;
  onReset: () => void;
  onSelectTool?: (tool: ToolType) => void;
}

const ResultDisplay = forwardRef<HTMLDivElement, ResultDisplayProps>(({
  tool,
  response,
  isChatMode,
  onShare,
  onCopy,
  onExport,
  onReset,
  onSelectTool
}, ref) => {
  const getSuggestedTool = (text: string | null) => {
    if (!text) return null;
    const match = text.match(/\[SUGGEST_TOOL:(\w+)\]/);
    if (match) {
      return match[1] as ToolType;
    }
    return null;
  };

  const cleanResponse = (text: string | null) => {
    if (!text) return '';
    return text.replace(/\[SUGGEST_TOOL:[\w-]+\]/g, '').trim();
  };

  const suggestedTool = getSuggestedTool(response);

  return (
    <motion.div 
      key="response-content"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div id="pdf-content-wrapper" ref={ref} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-blue-600"></div>
        <div className={`prose prose-slate max-w-none prose-hr:my-10 ${tool === 'radiology' ? 'space-y-6' : 'space-y-10'}`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeTableLabels]}
            components={{
              h1: ({node, ...props}) => <h1 {...props} className="text-blue-600" />,
              h2: ({node, ...props}) => <h2 {...props} className="text-blue-600" />,
              h3: ({node, ...props}) => <h3 {...props} className="text-blue-600" />,
              p: ({node, ...props}) => <p {...props} className="text-slate-700" />,
              li: ({node, ...props}) => <li {...props} className="text-slate-700" />,
              ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside mb-6 space-y-3" />,
              ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside mb-6 space-y-3" />,
              strong: ({node, ...props}) => <strong {...props} className="font-bold text-blue-700" />,
              table: ({node, ...props}) => (
                <div className="w-full my-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-x-auto">
                  <table {...props} className="min-w-full border-collapse bg-white" />
                </div>
              ),
              td: ({node, ...props}) => {
                const dataLabel = (node?.properties as any)?.dataLabel;
                return <td {...props} data-label={dataLabel} className="p-4 border-b border-slate-100" />;
              },
              th: ({node, ...props}) => <th {...props} className="p-4 font-bold bg-slate-50 border-b border-slate-200" />
            }}
          >
            {cleanResponse(response)}
          </ReactMarkdown>

          {suggestedTool && suggestedTool !== tool && tool !== 'consultation' && onSelectTool && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3"
            >
              <p className="text-xs font-bold text-slate-500">هل تريد الانتقال للقسم الصحيح؟</p>
              <button
                onClick={() => onSelectTool(suggestedTool)}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                {TOOLS.find(t => t.id === suggestedTool)?.icon}
                <span>الانتقال إلى {TOOLS.find(t => t.id === suggestedTool)?.title}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 no-print">
        <button
          onClick={onShare}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-green-50 text-green-700 rounded-2xl font-bold text-[10px] hover:bg-green-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          واتساب
        </button>
        <button
          onClick={onCopy}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-2xl font-bold text-[10px] hover:bg-blue-100 transition-colors"
        >
          <Copy className="w-4 h-4" />
          نسخ النص
        </button>
        <button
          onClick={onExport}
          className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-[10px] hover:bg-slate-200 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          تحميل PDF
        </button>
      </div>

      {!isChatMode && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-4 no-print"
        >
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>تحليل جديد بصورة أخرى</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
});

ResultDisplay.displayName = 'ResultDisplay';

export default ResultDisplay;
