export interface ExtractedFrame {
  id: number;
  dataUrl: string; // Base64 data
  timestamp: number;
}

export interface Scene {
  id: number;
  description: string;
  veoPrompt: string;
}

export interface AnalysisResult {
  script: string;
  veoPrompt: string;
  visualStyle: string;
  scenes: Scene[];
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_VIDEO = 'PROCESSING_VIDEO',
  ANALYZING_AI = 'ANALYZING_AI',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}