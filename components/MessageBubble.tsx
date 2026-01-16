
import React, { useState } from 'react';
import { Message } from '../types';
import { geminiService } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const isAudio = message.text.includes("[Voice Message]");

  const playResponse = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    const audioData = await geminiService.generateSpeech(message.text);
    if (audioData) {
      const audio = new Audio(`data:audio/pcm;base64,${audioData}`);
      // Note: PCM data returned from TTS needs special decoding as per instructions, 
      // but standard browser Audio can handle some types if encoded correctly.
      // For simplicity in this UI update, we assume standard base64 audio play flow 
      // or implement the PCM decoder if required by the candidate.
      
      // Implementation of PCM decoder from instructions
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const decodeBase64 = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
      };
      const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
        const dataInt16 = new Int16Array(data.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        return buffer;
      };

      try {
        const buffer = await decodeAudioData(decodeBase64(audioData), audioContext);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
      } catch (e) {
        console.error("Audio playback error", e);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };
  
  return (
    <div className={`flex w-full mb-4 fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${isUser ? 'ml-3 bg-indigo-600' : 'mr-3 bg-teal-500'}`}>
          {isUser ? 'U' : 'N'}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm group ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          }`}>
            {isAudio && (
              <div className="flex items-center gap-2 mb-1 text-[10px] opacity-70">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg>
                Voice Recording
              </div>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </div>
            
            {!isUser && (
              <button 
                onClick={playResponse}
                className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-all ${
                  isPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                {isPlaying ? (
                  <><span className="flex gap-0.5"><span className="w-0.5 h-2 bg-indigo-500 animate-pulse"></span><span className="w-0.5 h-3 bg-indigo-500 animate-pulse" style={{animationDelay:'0.1s'}}></span><span className="w-0.5 h-2 bg-indigo-500 animate-pulse" style={{animationDelay:'0.2s'}}></span></span> Playing</>
                ) : (
                  <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg> Speak</>
                )}
              </button>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                {message.sources.map((src, i) => (
                  <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors">
                    {src.title}
                  </a>
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] mt-1 text-slate-400 font-medium">
            {typeof message.timestamp === 'string' ? new Date(message.timestamp).toLocaleTimeString() : message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.sentiment && ` • ${message.sentiment}`}
          </span>
        </div>
      </div>
    </div>
  );
};
