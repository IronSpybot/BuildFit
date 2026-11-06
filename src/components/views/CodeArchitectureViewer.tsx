import React, { useState } from 'react';
import {
  FileCode2,
  FolderTree,
  Copy,
  Check,
  Download,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  SWIFT_CODE_FILES,
  SWIFT_PROJECT_STRUCTURE,
  type SwiftFile,
} from '../../data/swiftCodebase';
import { haptic } from '../../utils/haptics';

export const CodeArchitectureViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    SWIFT_CODE_FILES[0].id
  );
  const [copied, setCopied] = useState(false);
  const [showTreeModal, setShowTreeModal] = useState(false);

  const activeFile =
    SWIFT_CODE_FILES.find((f) => f.id === selectedFileId) || SWIFT_CODE_FILES[0];

  const handleCopyCode = () => {
    haptic.trigger('success');
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllFiles = () => {
    haptic.trigger('success');
    const fullProjectBundle = SWIFT_CODE_FILES.map(
      (f) => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n\n${f.code}\n`
    ).join('\n\n');

    navigator.clipboard.writeText(fullProjectBundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f12] text-white border-l border-white/10 overflow-hidden">
      {/* Top Header */}
      <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              SwiftUI & SwiftData Architecture Studio
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                iPhone 16 / iOS 27
              </span>
            </h2>
            <p className="text-[11px] text-white/50">
              MVVM · HealthKit · 3-Slot Nutrition · True Black OLED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptic.trigger('light');
              setShowTreeModal(!showTreeModal);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 transition-all"
          >
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Tree</span>
          </button>

          <button
            onClick={handleCopyAllFiles}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Copied All Swift Files!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Copy Entire Project</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Navigator (Xcode-like sidebar) */}
        <div className="w-64 border-r border-white/10 bg-[#090b0d] p-3 flex flex-col gap-3 overflow-y-auto">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2">
            PulseTrack Xcode Workspace
          </div>

          <div className="flex flex-col gap-1">
            {SWIFT_CODE_FILES.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => {
                    haptic.trigger('light');
                    setSelectedFileId(file.id);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-all border ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 font-semibold shadow-sm'
                      : 'border-transparent text-white/70 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-cyan-400' : 'text-orange-400/70'
                      }`}
                    />
                    <span className="truncate">{file.filename}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Architecture Note Card */}
          <div className="mt-auto p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>iOS 27 Native Highlights</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              • SwiftData <code className="text-white">@Model</code> & <code className="text-white">@Query</code>
              <br />• Apple HealthKit background query
              <br />• True OLED black & <code className="text-white">.ultraThinMaterial</code>
              <br />• 3 strictly enforced meal slots
            </p>
          </div>
        </div>

        {/* Right Code Inspector Pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#07090b]">
          {/* File Tab Header */}
          <div className="h-10 px-4 border-b border-white/10 flex items-center justify-between bg-black/60">
            <div className="flex items-center gap-2 text-xs font-mono text-white/80">
              <span className="text-white/40">PulseTrack /</span>
              <span className="text-cyan-400 font-semibold">{activeFile.path}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Viewer with Syntax Formatting */}
          <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-relaxed select-text">
            <pre className="text-neutral-300">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Modal: Project Structure Tree */}
      {showTreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <FolderTree className="w-4 h-4" />
                <span>Xcode Project File Hierarchy</span>
              </div>
              <button
                onClick={() => setShowTreeModal(false)}
                className="text-xs text-white/50 hover:text-white"
              >
                Close
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-black border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto">
              {SWIFT_PROJECT_STRUCTURE}
            </pre>

            <button
              onClick={() => {
                navigator.clipboard.writeText(SWIFT_PROJECT_STRUCTURE);
                setShowTreeModal(false);
              }}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs text-center"
            >
              Copy Structure Tree
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
