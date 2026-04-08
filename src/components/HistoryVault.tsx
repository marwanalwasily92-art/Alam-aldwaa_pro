import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, Calendar, Search, Trash2, ChevronLeft, MessageSquare, Share2, Copy, FileDown, CheckCircle2 } from 'lucide-react';
import { ToolType, HistoryItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { rehypeTableLabels } from '../utils/rehypeTableLabels';
import { TOOLS } from '../constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLocalHistory, deleteFromLocalHistory, performGlobalCleanup } from '../lib/localHistory';

export default function HistoryVault() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedId = searchParams.get('historyId');
  const selectedItem = items.find(item => item.id === selectedId) || null;
  
  const setSelectedItem = (item: HistoryItem | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (item) {
      newParams.set('historyId', item.id);
    } else {
      newParams.delete('historyId');
    }
    setSearchParams(newParams);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ToolType | 'all'>('all');
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
    if (user) {
      performGlobalCleanup(user);
    }
  }, [user]);

  const loadHistory = () => {
    setLoading(true);
    const data = getLocalHistory();
    setItems(data);
    setLoading(false);
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteFromLocalHistory(id, user);
    setItems(items.filter(item => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const getToolInfo = (type: string) => {
    return TOOLS.find(t => t.id === type) || { title: 'استشارة', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-indigo-600' };
  };

  const formatForSharing = (text: string) => {
    let formatted = text.replace(/\[SUGGEST_TOOL:[\w-]+\]/g, '').trim();
    const lines = formatted.split('\n');
    const newLines: string[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (line.includes('---')) {
          inTable = true;
          continue;
        }
        if (!inTable) {
          tableHeaders = cells;
          inTable = true;
          newLines.push('');
        } else {
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
        if (line.startsWith('#')) {
          const cleanHeader = line.replace(/#+/g, '').trim();
          newLines.push(`\n*${cleanHeader}*\n`);
        } else {
          if (line !== '') newLines.push(line);
        }
      }
    }
    formatted = newLines.join('\n');
    formatted = formatted
      .replace(/\*\*\*(.*?)\*\*\*/g, '*$1*')
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/__(.*?)__/g, '_$1_')
      .replace(/`(.*?)`/g, '`$1`');
    return formatted.trim();
  };

  const handleShare = () => {
    if (!selectedItem) return;
    const cleanText = formatForSharing(selectedItem.response);
    const toolTitle = getToolInfo(selectedItem.tool_type).title;
    const shareText = `*نتائج تحليل ${toolTitle} - عالم الدواء*\n\n${cleanText}\n\n--- \nتم التحليل بواسطة تطبيق *عالم الدواء الذكي* 💊`;
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleCopy = async () => {
    if (!selectedItem) return;
    const textToCopy = formatForSharing(selectedItem.response);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.tool_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Debugging: Check for duplicate IDs
  useEffect(() => {
    const ids = items.map(item => item.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error('Duplicate IDs found in history:', ids.filter((id, index) => ids.indexOf(id) !== index));
    }
  }, [items]);

  const toolFilters = React.useMemo(() => {
    const filters: { id: ToolType | 'all'; label: string; icon: React.ReactNode }[] = [
      { id: 'all' as const, label: 'الكل', icon: <MessageSquare className="w-4 h-4" /> }
    ];
    
    const seen = new Set(['all']);
    TOOLS.forEach(t => {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        filters.push({ 
          id: t.id, 
          label: t.title.split(' ')[0], 
          icon: React.cloneElement(t.icon as React.ReactElement, { className: "w-4 h-4" } as any) 
        });
      }
    });
    return filters;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" dir="rtl">
      <div className="flex items-center gap-4">
        <button onClick={selectedItem ? () => setSelectedItem(null) : () => navigate('/')} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">سجل الطبيب</h2>
      </div>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div id="printable-report">
                <div className="pdf-header-container hidden print:flex">
                  <div>
                    <h1 className="pdf-header-title">استشارة صيدلانية</h1>
                    <p className="pdf-header-date">{new Date(selectedItem.created_at).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="pdf-header-badge">
                    {TOOLS.find(t => t.id === selectedItem.tool_type)?.title || 'تحليل'}
                  </div>
                </div>
                <div ref={responseRef}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        {getToolInfo(selectedItem.tool_type).icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{getToolInfo(selectedItem.tool_type).title}</h3>
                        <p className="text-xs text-slate-400">{new Date(selectedItem.created_at).toLocaleDateString('ar-YE')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteItem(selectedItem.id, e)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors no-print"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedItem.image_url && (
                    <div className="aspect-video rounded-2xl overflow-hidden border border-slate-100 my-4">
                      <img src={selectedItem.image_url} alt="Input" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {selectedItem.input_text && (
                    <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 italic my-4">
                      "{selectedItem.input_text}"
                    </div>
                  )}

                  <div className="prose prose-slate max-w-none prose-headings:text-blue-900 prose-strong:text-blue-700">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeTableLabels]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="w-full my-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                            <table {...props} className="min-w-full border-collapse" />
                          </div>
                        ),
                        td: ({node, ...props}) => {
                          const dataLabel = (node?.properties as any)?.dataLabel;
                          return <td {...props} data-label={dataLabel} className="p-4 border-b border-slate-100" />;
                        },
                        th: ({node, ...props}) => <th {...props} className="p-4 font-bold bg-slate-50 border-b border-slate-200" />
                      }}
                    >
                      {selectedItem.response.replace(/\[SUGGEST_TOOL:[\w-]+\]/g, '').trim()}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 no-print">
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center gap-1 p-3 bg-green-50 text-green-700 rounded-2xl font-bold text-[10px] hover:bg-green-100 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  واتساب
                </button>
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-2xl font-bold text-[10px] hover:bg-blue-100 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  نسخ النص
                </button>
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-[10px] hover:bg-slate-200 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  تحميل PDF
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في السجل..."
                className="w-full bg-white border-2 border-slate-100 rounded-2xl pr-12 pl-4 py-3 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Horizontal Tool Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
              {toolFilters.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveFilter(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${
                    activeFilter === type.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-bold">لا توجد سجلات سابقة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-right group"
                  >
                    <div className="shrink-0 w-12 h-12 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors">
                      {getToolInfo(item.tool_type).icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {getToolInfo(item.tool_type).title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('ar-YE')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {item.input_text || (item.tool_type === 'prescription' ? 'تحليل روشتة' : 'استشارة ذكية')}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 opacity-70">
                        {item.response.substring(0, 60)}...
                      </p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay for PDF */}
      {loadingMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="text-white font-bold">{loadingMessage}</p>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-24 left-4 right-4 bg-red-600 text-white p-4 rounded-2xl shadow-xl z-50 flex items-center justify-between">
          <p className="text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">إغلاق</button>
        </div>
      )}

      {/* Copy Success Toast */}
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

