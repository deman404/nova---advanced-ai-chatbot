
import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export class GeminiService {
  private chat: Chat;

  constructor() {
    this.chat = this.createNewChat();
  }

  private createNewChat(): Chat {
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
  }

  resetChat() {
    this.chat = this.createNewChat();
  }

  async *sendMessageStream(text: string, audioData?: { data: string; mimeType: string }) {
    try {
      const parts: any[] = [];
      if (audioData) {
        // Ensure we never send an empty or invalid MIME type string
        const finalMimeType = audioData.mimeType && audioData.mimeType.length > 0 
          ? audioData.mimeType 
          : 'audio/webm'; // Sensible default for most browsers

        parts.push({
          inlineData: {
            data: audioData.data,
            mimeType: finalMimeType
          }
        });
      }
      parts.push({ text: text || "Please analyze this audio and respond." });

      const responseStream = await this.chat.sendMessageStream({ 
        message: { parts } 
      });

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        yield {
          text: c.text,
          sources: c.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Source',
            uri: chunk.web?.uri || '#'
          })).filter((s: any) => s.uri !== '#') || []
        };
      }
    } catch (error) {
      console.error("Gemini stream error:", error);
      throw error;
    }
  }

  async generateSpeech(text: string): Promise<string | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("Speech generation error:", error);
      return undefined;
    }
  }

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the sentiment of this user message and return ONLY one word: "positive", "neutral", or "negative".\n\nMessage: "${text}"`,
      });
      const result = response.text.toLowerCase().trim();
      if (result.includes('positive')) return 'positive';
      if (result.includes('negative')) return 'negative';
      return 'neutral';
    } catch {
      return 'neutral';
    }
  }
}

export const geminiService = new GeminiService();
