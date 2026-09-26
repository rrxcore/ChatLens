import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  Palette,
} from 'lucide-react';

interface DropZoneProps {
  onFileLoaded: (text: string, fileName: string) => void;
  onLoadDemo: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileLoaded, onLoadDemo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = event => {
      const text = event.target?.result as string;
      onFileLoaded(text, file.name);
      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert('Failed to read file. Please ensure it is a valid text export.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto overscroll-contain flex flex-col items-center justify-center p-4 sm:p-8 select-none">
      <div className="max-w-2xl w-full my-auto space-y-8 text-center animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-2xl border border-white/15 p-1 bg-black/60 ring-2 ring-emerald-500/20 hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="ChatLens Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ios-glass bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Conversation Reader</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-500">
            ChatLens
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Turn raw, exported WhatsApp <code className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 font-mono text-xs border border-white/10">.txt</code> &amp; <code className="px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 font-mono text-xs border border-white/10">.md</code> files into a gorgeous, iOS-glassmorphic, interactive reading experience.
          </p>
        </div>

        {/* Glassmorphic Drop Container */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 sm:p-12 rounded-3xl ios-glass border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? 'bg-emerald-500/20 border-emerald-400 shadow-2xl scale-[1.01]'
              : 'bg-slate-900/60 hover:bg-slate-900/80 border-white/15 hover:border-emerald-500/40 shadow-xl'
          }`}
        >
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleFileChange}
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={isProcessing}
          />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isDragging ? 'Drop your WhatsApp .txt or .md file here' : 'Drop your chat export here (.txt / .md)'}
            </h3>
            <p className="text-xs text-slate-400">
              or click anywhere to browse from your device
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supports .txt &amp; .md files (Android &amp; iOS)</span>
            </span>
          </div>
        </div>

        {/* Quick 1-Click Demo Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onLoadDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Explore Demo Chat (1-Click)</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
          <div className="p-3.5 rounded-2xl ios-glass bg-white/5 border border-white/10 space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-xs font-bold text-white">100% In-Browser</div>
            <div className="text-[11px] text-slate-400">Your chat never leaves your device. Total privacy.</div>
          </div>

          <div className="p-3.5 rounded-2xl ios-glass bg-white/5 border border-white/10 space-y-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <div className="text-xs font-bold text-white">60fps Smooth</div>
            <div className="text-[11px] text-slate-400">Virtualized engine scrolls 50,000+ messages easily.</div>
          </div>

          <div className="p-3.5 rounded-2xl ios-glass bg-white/5 border border-white/10 space-y-1">
            <Palette className="w-4 h-4 text-purple-400" />
            <div className="text-xs font-bold text-white">3 Glass Themes</div>
            <div className="text-[11px] text-slate-400">WhatsApp Dark Green, Classic Light, & AMOLED Black.</div>
          </div>

          <div className="p-3.5 rounded-2xl ios-glass bg-white/5 border border-white/10 space-y-1">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <div className="text-xs font-bold text-white">Novel Reader Mode</div>
            <div className="text-[11px] text-slate-400">Binge-read old memories like a book or journal.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
