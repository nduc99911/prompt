import React, { useState } from 'react';
import { AnalysisResult, ExtractedFrame } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
  frames: ExtractedFrame[];
  onReset: () => void;
  onRegenerateScenes: (count: number) => Promise<void>;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, frames, onReset, onRegenerateScenes }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'script'>('overview');
  const [regenerating, setRegenerating] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSceneUpdate = async (count: number) => {
    if (regenerating) return;
    setRegenerating(count);
    await onRegenerateScenes(count);
    setRegenerating(null);
  };

  return (
    <div className="w-full space-y-8 pb-20">
      
      {/* Visual Context Bar */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Visual Context</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {frames.map((frame) => (
            <div key={frame.id} className="relative h-20 aspect-video rounded-md overflow-hidden border border-zinc-800 shrink-0 hover:border-blue-500 transition-colors">
              <img src={frame.dataUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg w-fit border border-white/5">
        {[
          { id: 'overview', label: 'Overview & Prompt' },
          { id: 'scenes', label: 'Scene Breakdown' },
          { id: 'script', label: 'Full Script' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
                    <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                            <span className="ml-2 text-xs text-zinc-500 font-mono">veo_prompt.txt</span>
                        </div>
                        <button 
                            onClick={() => copy(result.veoPrompt, 'main-prompt')}
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                            {copiedId === 'main-prompt' ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                    <div className="p-6 bg-black/50 flex-1 overflow-auto">
                        <pre className="font-mono text-sm text-blue-100 whitespace-pre-wrap leading-relaxed">
                            {result.veoPrompt}
                        </pre>
                    </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Aesthetic Style</h4>
                    <div className="text-zinc-300 text-sm italic border-l-2 border-purple-500 pl-4 py-1">
                        "{result.visualStyle}"
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-blue-300 font-semibold mb-2">Ready to Create?</h4>
                        <p className="text-sm text-blue-200/70 mb-4">Paste the code on the left into Google Veo.</p>
                        <button onClick={() => copy(result.veoPrompt, 'cta-copy')} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                            {copiedId === 'cta-copy' ? 'Copied!' : 'Copy Prompt'}
                        </button>
                    </div>
                </div>
             </div>
          </div>
        )}

        {/* SCENES TAB */}
        {activeTab === 'scenes' && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-white/5">
                 <span className="text-zinc-400 text-sm">Detected: <span className="text-white font-semibold">{result.scenes?.length || 0} Scenes</span></span>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 mr-2">Force Split:</span>
                    {[1,2,3,4,5].map(n => (
                        <button
                            key={n}
                            onClick={() => handleSceneUpdate(n)}
                            disabled={regenerating !== null}
                            className={`w-8 h-8 rounded flex items-center justify-center text-sm font-mono border ${
                                regenerating === n 
                                ? 'border-blue-500 text-blue-500 bg-blue-500/10' 
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                            }`}
                        >
                            {regenerating === n ? '...' : n}
                        </button>
                    ))}
                 </div>
              </div>

              <div className="grid gap-4">
                 {result.scenes?.map((scene, idx) => (
                     <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/4">
                                <div className="text-xs font-mono text-zinc-500 mb-1">SCENE {String(idx + 1).padStart(2, '0')}</div>
                                <div className="text-sm text-zinc-300 font-medium">{scene.description}</div>
                            </div>
                            <div className="md:w-3/4 relative">
                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => copy(scene.veoPrompt, `scene-${idx}`)} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded hover:bg-zinc-700">
                                        {copiedId === `scene-${idx}` ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-black/30 rounded p-3 font-mono text-xs text-blue-200/80 leading-relaxed border border-white/5">
                                    {scene.veoPrompt}
                                </div>
                            </div>
                        </div>
                     </div>
                 ))}
              </div>
           </div>
        )}

        {/* SCRIPT TAB */}
        {activeTab === 'script' && (
            <div className="animate-fade-in h-[600px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <span className="text-sm font-semibold text-zinc-300">Screenplay Format</span>
                    <button onClick={() => copy(result.script, 'script')} className="text-xs text-blue-400 hover:text-blue-300">
                         {copiedId === 'script' ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto font-mono text-sm text-zinc-300 whitespace-pre-line leading-loose max-w-4xl mx-auto w-full">
                    {result.script}
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-center pt-8 border-t border-white/5">
        <button 
          onClick={onReset}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium border border-zinc-700"
        >
          Analyze New Video
        </button>
      </div>
    </div>
  );
};