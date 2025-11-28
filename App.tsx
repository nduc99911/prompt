import React, { useState, useEffect } from 'react';
import { VideoProcessor } from './components/VideoProcessor';
import { ResultsDisplay } from './components/ResultsDisplay';
import { analyzeVideoFrames, regenerateScenes } from './services/geminiService';
import { AppState, ExtractedFrame, AnalysisResult, Scene } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UseEffect to reset error after 5 seconds
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
      setErrorMsg("Failed to analyze video with Gemini. Please try again.");
    }
  };

  const handleRegenerateScenes = async (count: number) => {
    if (!result || frames.length === 0) return;
    
    // We keep state as COMPLETED but maybe show a loading indicator in the UI component
    // OR we can toggle a temporary loading state. 
    // For simplicity, we'll let ResultsDisplay handle the 'loading' feedback visually
    // or we can use a local state wrapper here.
    
    try {
      const frameData = frames.map(f => f.dataUrl);
      const newScenes = await regenerateScenes(frameData, count);
      
      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          scenes: newScenes
        };
      });
    } catch (error) {
      console.error("Failed to regenerate scenes", error);
      setErrorMsg("Failed to update scenes. Please try again.");
    }
  };

  const handleError = (msg: string) => {
    setAppState(AppState.ERROR);
    setErrorMsg(msg);
    // Reset to idle so user can try again after a moment if they want
    setTimeout(() => setAppState(AppState.IDLE), 2000);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setFrames([]);
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">VeoScripter</h1>
          </div>
          <div className="text-sm text-zinc-400">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        
        {/* Intro */}
        {appState === AppState.IDLE && (
           <div className="text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                Turn Video into Prompt
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Upload any video to extract its script and generate a professional 
                <span className="text-blue-400 font-medium"> Veo3</span> prompt instantly.
              </p>
           </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div className="fixed bottom-6 right-6 bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-xl z-50 animate-bounce-in">
            <div className="flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               {errorMsg}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full">
          {appState === AppState.IDLE && (
            <VideoProcessor 
              onFramesExtracted={handleFramesExtracted}
              onProcessingStart={handleProcessingStart}
              onError={handleError}
            />
          )}

          {(appState === AppState.PROCESSING_VIDEO || appState === AppState.ANALYZING_AI) && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative w-24 h-24">
                 <div className="absolute inset-0 rounded-full border-4 border-zinc-800"></div>
                 <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                 </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  {appState === AppState.PROCESSING_VIDEO ? "Extracting Keyframes..." : "Gemini is Thinking..."}
                </h3>
                <p className="text-zinc-500 text-sm">
                  {appState === AppState.PROCESSING_VIDEO 
                    ? "Scanning video for visual context" 
                    : "Analyzing scenes, generating script, and crafting Veo prompt"}
                </p>
              </div>
            </div>
          )}

          {appState === AppState.COMPLETED && result && (
            <ResultsDisplay 
              result={result} 
              frames={frames}
              onReset={handleReset}
              onRegenerateScenes={handleRegenerateScenes}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;