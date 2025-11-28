import React, { useState, useEffect } from 'react';
import { VideoProcessor } from './components/VideoProcessor';
import { ResultsDisplay } from './components/ResultsDisplay';
import { analyzeVideoFrames, regenerateScenes } from './services/geminiService';
import { AppState, ExtractedFrame, AnalysisResult } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-dismiss error
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleProcessingStart = () => {
    setAppState(AppState.PROCESSING_VIDEO);
    setErrorMsg(null);
  };

  const handleFramesExtracted = async (extractedFrames: ExtractedFrame[]) => {
    setFrames(extractedFrames);
    setAppState(AppState.ANALYZING_AI);
    
    try {
      const frameData = extractedFrames.map(f => f.dataUrl);
      const aiResult = await analyzeVideoFrames(frameData);
      setResult(aiResult);
      setAppState(AppState.COMPLETED);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg("Unable to analyze video. Please check your internet connection or try a shorter video.");
    }
  };

  const handleRegenerateScenes = async (count: number) => {
    if (!result || frames.length === 0) return;
    
    try {
      const frameData = frames.map(f => f.dataUrl);
      // Optimistic UI update could go here, but we'll wait for result
      const newScenes = await regenerateScenes(frameData, count);
      
      setResult(prev => {
        if (!prev) return null;
        return { ...prev, scenes: newScenes };
      });
    } catch (error) {
      console.error("Failed to regenerate scenes", error);
      setErrorMsg("Failed to split scenes. Please try again.");
    }
  };

  const handleError = (msg: string) => {
    setAppState(AppState.ERROR);
    setErrorMsg(msg);
    setTimeout(() => setAppState(AppState.IDLE), 2500);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setFrames([]);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-lg overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 group-hover:scale-110 transition-transform duration-500"></div>
               <svg className="w-4 h-4 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8z"/></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">Veo<span className="text-blue-500">Scripter</span></h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Gemini 2.5 Flash Active
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Intro Hero */}
        {appState === AppState.IDLE && (
           <div className="text-center mb-16 space-y-6 animate-fade-in mt-10">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-600">
                Video to Veo Prompt
              </h2>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-light">
                Analyze video structure, extract scripts, and generate professional production prompts specifically for Google Veo.
              </p>
           </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div className="fixed top-24 right-6 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-md shadow-2xl z-50 animate-fade-in flex items-center gap-3">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
             {errorMsg}
          </div>
        )}

        {/* Main Interface */}
        <div className="w-full transition-all duration-500">
          {appState === AppState.IDLE && (
            <div className="max-w-3xl mx-auto animate-slide-up">
              <VideoProcessor 
                onFramesExtracted={handleFramesExtracted}
                onProcessingStart={handleProcessingStart}
                onError={handleError}
              />
            </div>
          )}

          {(appState === AppState.PROCESSING_VIDEO || appState === AppState.ANALYZING_AI) && (
            <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-fade-in">
              <div className="relative">
                 <div className="w-24 h-24 rounded-full border border-blue-500/20 border-t-blue-500 animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full animate-pulse"></div>
                 </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  {appState === AppState.PROCESSING_VIDEO ? "Processing Video Input" : "Generating Analysis"}
                </h3>
                <p className="text-zinc-500">
                  {appState === AppState.PROCESSING_VIDEO 
                    ? "Extracting high-quality keyframes..." 
                    : "Gemini is writing the script and prompts..."}
                </p>
              </div>
            </div>
          )}

          {appState === AppState.COMPLETED && result && (
            <div className="animate-fade-in">
              <ResultsDisplay 
                result={result} 
                frames={frames}
                onReset={handleReset}
                onRegenerateScenes={handleRegenerateScenes}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;