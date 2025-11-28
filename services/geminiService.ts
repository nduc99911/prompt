import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Scene } from "../types";

// Initialize Gemini
// NOTE: In a real production app, handle API keys via a secure backend proxy.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoFrames = async (base64Frames: string[]): Promise<AnalysisResult> => {
  try {
    // Prepare image parts
    const imageParts = base64Frames.map(frame => {
        // Remove data:image/jpeg;base64, prefix
        const base64Data = frame.split(',')[1];
        return {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
            }
        };
    });

    const promptText = `
      You are an expert video director and AI prompt engineer.
      I have provided ${imageParts.length} keyframes extracted from a video, in chronological order.

      Your task is to:
      1. Analyze the visual narrative, characters, setting, and action flow.
      2. Reconstruct a probable "Script" or "Screenplay" that describes what is happening in the video.
      3. Create a highly detailed "Veo Prompt". This prompt will be used in Google's Veo video generation model to recreate a video with this exact style, composition, and movement.
      4. Describe the "Visual Style" (lighting, camera angles, color palette, mood).
      5. Break the video down into key "Scenes" (automatically detect the number of scenes). For each scene, provide a specific Veo prompt.

      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            ...imageParts,
            { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                script: { type: Type.STRING, description: "The reconstructed script/narrative of the video." },
                veoPrompt: { type: Type.STRING, description: "A detailed prompt optimized for Veo3 video generation (entire video)." },
                visualStyle: { type: Type.STRING, description: "Description of aesthetics, lighting, and camera work." },
                scenes: {
                  type: Type.ARRAY,
                  description: "List of distinct scenes detected in the video.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      description: { type: Type.STRING, description: "Brief description of the action in this scene." },
                      veoPrompt: { type: Type.STRING, description: "Specific Veo prompt for this scene." }
                    },
                    required: ["id", "description", "veoPrompt"]
                  }
                }
            },
            required: ["script", "veoPrompt", "visualStyle", "scenes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const regenerateScenes = async (base64Frames: string[], sceneCount: number): Promise<Scene[]> => {
  try {
    const imageParts = base64Frames.map(frame => {
        const base64Data = frame.split(',')[1];
        return {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
            }
        };
    });

    const promptText = `
      Analyze the provided keyframes. 
      Break the video narrative down into EXACTLY ${sceneCount} distinct scene(s).
      
      For each scene:
      1. Provide a brief description.
      2. Write a specific "Veo Prompt" that captures the visual details and action of that segment.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            ...imageParts,
            { text: promptText }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      description: { type: Type.STRING },
                      veoPrompt: { type: Type.STRING }
                    },
                    required: ["id", "description", "veoPrompt"]
                  }
                }
            },
            required: ["scenes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text);
    return data.scenes;
  } catch (error) {
    console.error("Gemini Scene Regeneration Error:", error);
    throw error;
  }
};
