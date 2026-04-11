import React from 'react';
import { ToolType } from '../types';
import { motion } from 'framer-motion';
import { TOOLS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { ToolCover } from './ToolCover';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { PullToRefresh } from './PullToRefresh';
import { AdPlaceholder } from './AdPlaceholder';

export default function Dashboard() {
  const navigate = useNavigate();
  const { config } = useConfig();

  const handleSelectTool = (toolId: ToolType) => {
    navigate(`/tool/${toolId}`);
  };

  const handleRefresh = async () => {
    // Simulate a network request or state refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, you might re-fetch user data or config here
    window.location.reload();
  };

  const gridTools = TOOLS.filter(t => t.id !== 'consultation');
  const consultationTool = TOOLS.find(t => t.id === 'consultation');

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-2 gap-4">
        {gridTools.map((tool) => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectTool(tool.id)}
            className="group flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-right overflow-hidden"
          >
            {/* Image & Icon */}
            <div className="w-full h-32 relative">
              <ToolCover toolId={tool.id} imageUrl={tool.imageUrl} />
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1 relative">
              <div className="absolute top-4 left-4 text-black/20 group-hover:text-black/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div className="pl-5">
                <h3 className="font-black text-slate-900 text-sm mb-1">{tool.title}</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{tool.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Consultation Card */}
      {consultationTool && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSelectTool(consultationTool.id)}
          className="flex items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-right p-4"
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 relative">
            <ToolCover toolId={consultationTool.id} imageUrl={consultationTool.imageUrl} />
            <div className="absolute bottom-1 left-1 p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm text-indigo-600">
              {React.cloneElement(consultationTool.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-black text-slate-900 text-lg">{consultationTool.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{consultationTool.description}</p>
          </div>
        </motion.button>
      )}

      {/* Fixed Ad Space - Dashboard */}
      <AdPlaceholder id="Banner_Android" className="mt-4" />
    </div>
    </PullToRefresh>
  );
}
