import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Search, Trash2, ChevronLeft, FileText, Sparkles, Pill, MessageSquare } from 'lucide-react';
import { db, auth, storage } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { ToolType, HistoryItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

interface HistoryVaultProps {
  onBack: () => void;
  userId: string;
}

export default function HistoryVault({ onBack, userId }: HistoryVaultProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ToolType | 'all'>('all');

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    const path = 'history';
    try {
      const q = query(
        collection(db, path),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate().toISOString() || new Date().toISOString()
      })) as HistoryItem[];
      setItems(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    setLoading(false);
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToDelete = items.find(item => item.id === id);
    const path = `history/${id}`;
    
    try {
      // Delete from Storage if image_path exists
      if (itemToDelete?.image_path) {
        try {
          const imageRef = ref(storage, itemToDelete.image_path);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.error("Error deleting storage object:", storageErr);
        }
      }

      await deleteDoc(doc(db, 'history', id));
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || item.tool_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const toolTypes: { id: ToolType | 'all', label: string, icon: React.ReactNode }[] = [
    { id: 'all', label: 'الكل', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'prescription', label: 'روشتات', icon: <FileText className="w-4 h-4" /> },
    { id: 'skin', label: 'بشرة', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'interaction', label: 'تداخلات', icon: <Pill className="w-4 h-4" /> },
    { id: 'consultation', label: 'استشارات', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'prescription': return <FileText className="w-5 h-5" />;
      case 'skin': return <Sparkles className="w-5 h-5" />;
      case 'interaction': return <Pill className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getToolName = (type: string) => {
    switch (type) {
      case 'prescription': return 'تحليل روشتة';
      case 'skin': return 'فحص بشرة';
      case 'interaction': return 'تداخل أدوية';
      default: return 'استشارة';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" dir="rtl">
      <div className="flex items-center gap-4">
        <button onClick={selectedItem ? () => setSelectedItem(null) : onBack} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
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
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {getToolIcon(selectedItem.tool_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{getToolName(selectedItem.tool_type)}</h3>
                    <p className="text-xs text-slate-400">{new Date(selectedItem.created_at).toLocaleDateString('ar-YE')}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteItem(selectedItem.id, e)}
                  className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {selectedItem.image_url && (
                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-100">
                  <img src={selectedItem.image_url} alt="Input" className="w-full h-full object-cover" />
                </div>
              )}

              {selectedItem.input_text && (
                <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 italic">
                  "{selectedItem.input_text}"
                </div>
              )}

              <div className="prose prose-slate max-w-none prose-headings:text-blue-900 prose-strong:text-blue-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedItem.response}</ReactMarkdown>
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
              {toolTypes.map((type) => (
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
                {filteredItems.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    onClick={() => setSelectedItem(item)}
                    className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-right group"
                  >
                    <div className="shrink-0 w-12 h-12 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors">
                      {getToolIcon(item.tool_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {getToolName(item.tool_type)}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(item.created_at?.seconds ? item.created_at.toDate() : item.created_at).toLocaleDateString('ar-YE')}
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
    </div>
  );
}
