import React, { useState } from 'react';
import { AnalysisResult, ExtractedFrame } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
  frames: ExtractedFrame[];
  onReset: () => void;
  onRegenerateScenes: (count: number) => Promise<void>;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, frames, onReset, onRegenerateScenes }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [regeneratingScenes, setRegeneratingScenes] = useState<number | null>(null);

  const copyToClipboard = async (text: string, isScript: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isScript) {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      } else {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSceneClick = async (count: number) => {
    if (regeneratingScenes !== null) return;
    setRegeneratingScenes(count);
    await onRegenerateScenes(count);
    setRegeneratingScenes(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* Frames Preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          Extracted Keyframes
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {frames.map((frame) => (
            <div key={frame.id} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700/50 group">
              <img src={frame.dataUrl} alt={`Frame ${frame.id}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1">
                {frame.timestamp.toFixed(1)}s
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Extracted Script */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
             <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Video Script
             </h3>
             <button 
                onClick={() => copyToClipboard(result.script, true)}
                className="text-xs px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
             >
               {copiedScript ? "Copied!" : "Copy"}
             </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 text-zinc-300 whitespace-pre-line leading-relaxed font-mono text-sm">
            {result.script}
          </div>
        </div>

        {/* Global Veo Prompt */}
        <div className="flex flex-col gap-6 h-[500px]">
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl overflow-hidden flex flex-col flex-1">
            <div className="p-4 border-b border-blue-500/20 bg-blue-900/10 flex justify-between items-center">
              <h3 className="font-semibold text-blue-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                Veo3 Global Prompt
              </h3>
              <button 
                  onClick={() => copyToClipboard(result.veoPrompt, false)}
                  className="text-xs px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                {copiedPrompt ? "Copied!" : "Copy Prompt"}
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-blue-100/90 text-lg leading-relaxed font-medium">
                {result.veoPrompt}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shrink-0">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Detected Visual Style</h4>
            <p className="text-zinc-300 italic">
              "{result.visualStyle}"
            </p>
          </div>
        </div>
      </div>

      {/* Scene Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
              Scene Breakdown
            </h3>
            <span className="text-xs text-zinc-500 px-2 py-0.5 rounded border border-zinc-700">
              {result.scenes?.length || 0} Scenes Detected
            </span>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-xs text-zinc-400 uppercase font-semibold">Regenerate Scenes:</span>
             <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
               {[1, 2, 3, 4, 5].map(num => (
                 <button
                   key={num}
                   onClick={() => handleSceneClick(num)}
                   disabled={regeneratingScenes !== null}
                   className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                     regeneratingScenes === num 
                       ? 'bg-blue-600 text-white animate-pulse'
                       : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                   }`}
                 >
                   {regeneratingScenes === num ? (
                     <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   ) : num}
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {(!result.scenes || result.scenes.length === 0) && (
            <div className="p-8 text-center text-zinc-500">
              No scenes detected. Try regenerating with a specific scene count.
            </div>
          )}
          
          {result.scenes?.map((scene, index) => (
            <div key={index} className="p-6 hover:bg-zinc-800/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-zinc-700">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-medium text-zinc-300">Scene Description</h4>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed pl-8">
                    {scene.description}
                  </p>
                </div>
                
                <div className="md:w-2/3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Veo Prompt</h4>
                     <button 
                       onClick={() => navigator.clipboard.writeText(scene.veoPrompt)}
                       className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-zinc-800 hover:bg-blue-600 text-white px-2 py-1 rounded"
                     >
                       Copy Prompt
                     </button>
                  </div>
                  <p className="text-zinc-300 text-sm font-mono leading-relaxed">
                    {scene.veoPrompt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onReset}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-700"
        >
          Analyze Another Video
        </button>
      </div>
    </div>
  );
};