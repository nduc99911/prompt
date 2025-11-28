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

    // Basic validation
    if (!file.type.startsWith('video/')) {
        onError("Please upload a valid video file.");
        return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    // Reset process handled by loadedmetadata
  };

  const processVideo = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    onProcessingStart();

    const duration = video.duration;
    if (!duration || duration === Infinity) {
        onError("Could not determine video duration.");
        return;
    }

    // We will extract 8 frames evenly distributed
    const frameCount = 8;
    const interval = duration / (frameCount + 1);
    const frames: ExtractedFrame[] = [];
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        onError("Could not initialize canvas context.");
        return;
    }

    // Set canvas dimensions to match video (capped for performance)
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
            
            // Seek
            video.currentTime = time;
            
            // Wait for seek to complete
            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });

            // Draw
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Extract
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality to save tokens
            frames.push({
                id: i,
                timestamp: time,
                dataUrl
            });
        }
        
        onFramesExtracted(frames);

    } catch (err) {
        console.error(err);
        onError("Error processing video frames.");
    }
  }, [onFramesExtracted, onProcessingStart, onError]);

  // Trigger processing once metadata is loaded and we know duration
  const onLoadedMetadata = () => {
      // Just ready to process, user will click process or auto-start? 
      // Let's auto-start for smoother UX if file is selected
      if(videoSrc) {
        processVideo();
      }
  };

  return (
    <div className="w-full">
      {/* Hidden processing elements */}
      <video 
        ref={videoRef} 
        src={videoSrc || undefined} 
        onLoadedMetadata={onLoadedMetadata}
        className="hidden" 
        muted 
        playsInline 
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload UI */}
      <div className="flex flex-col items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 bg-zinc-900 border-zinc-700 hover:border-blue-500 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-4 text-zinc-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-zinc-200">Click to upload video</span> or drag and drop</p>
                <p className="text-xs text-zinc-500">MP4, MOV, WebM (Max 50MB recommended)</p>
            </div>
            <input id="dropzone-file" type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
        </label>
        <p className="mt-4 text-xs text-center text-zinc-500 max-w-lg">
          Note: To analyze videos from YouTube or TikTok, please download them first. Browser security prevents direct URL frame extraction.
        </p>
      </div>
    </div>
  );
};