import React, { useState, useRef, useCallback } from 'react';
import { ExtractedFrame } from '../types';

interface VideoProcessorProps {
  onFramesExtracted: (frames: ExtractedFrame[]) => void;
  onProcessingStart: () => void;
  onError: (msg: string) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({ 
  onFramesExtracted, 
  onProcessingStart, 
  onError 
}) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        onError("Invalid file type. Please upload a video.");
        return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
  };

  const processVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    onProcessingStart();

    const duration = video.duration;
    if (!duration || duration === Infinity) {
        onError("Unable to determine video duration.");
        return;
    }

    const frameCount = 8;
    const interval = duration / (frameCount + 1);
    const frames: ExtractedFrame[] = [];
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        onError("Browser canvas not supported.");
        return;
    }

    const maxDim = 512; 
    let scale = 1;
    if (video.videoWidth > maxDim || video.videoHeight > maxDim) {
        scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight);
    }
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    try {
        for (let i = 1; i <= frameCount; i++) {
            const time = interval * i;
            video.currentTime = time;
            
            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push({
                id: i,
                timestamp: time,
                dataUrl: canvas.toDataURL('image/jpeg', 0.7)
            });
        }
        onFramesExtracted(frames);
    } catch (err) {
        console.error(err);
        onError("Failed to process video frames.");
    }
  }, [onFramesExtracted, onProcessingStart, onError]);

  const onLoadedMetadata = () => {
      if(videoSrc) processVideo();
  };

  return (
    <div className="w-full group">
      <video 
        ref={videoRef} 
        src={videoSrc || undefined} 
        onLoadedMetadata={onLoadedMetadata}
        className="hidden" 
        muted playsInline crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full">
        {/* Decorative background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
        
        <label className="relative flex flex-col items-center justify-center w-full h-64 border border-zinc-800 bg-zinc-900/90 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all duration-300 overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
            
            <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                <div className="w-16 h-16 mb-4 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-zinc-700 group-hover:border-blue-500/50">
                   <svg className="w-8 h-8 text-zinc-400 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                   </svg>
                </div>
                <p className="mb-2 text-lg text-zinc-300 font-medium">Drop your video here</p>
                <p className="text-sm text-zinc-500">or click to browse files</p>
                <div className="mt-4 px-3 py-1 bg-zinc-800 rounded-md text-xs text-zinc-400 border border-zinc-700">
                    MP4, MOV, WebM
                </div>
            </div>
            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
        </label>
      </div>
      
      <p className="mt-6 text-sm text-center text-zinc-500">
        To analyze YouTube/TikTok, please download the video first.
      </p>
    </div>
  );
};