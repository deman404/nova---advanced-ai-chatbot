
import React, { useState, useRef, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onAudioReady: (base64: string, mimeType: string) => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onAudioReady, disabled, isDarkMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognizer.onerror = () => setIsListening(false);
      recognizer.onend = () => setIsListening(false);

      setRecognition(recognizer);
    }
  }, [onTranscript]);

  const startRecognition = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition error", e);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Browsers vary in what they support; let the browser choose but we'll normalize on stop
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Fallback for mimeType if the recorder property is empty (happens in some browsers/versions)
        const finalMimeType = recorder.mimeType && recorder.mimeType.length > 0 
          ? recorder.mimeType 
          : 'audio/webm'; // Most common fallback

        const audioBlob = new Blob(audioChunks.current, { type: finalMimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          onAudioReady(base64, finalMimeType);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Transcribe Button (Standard) */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-25"></span>
        )}
        <button
          onClick={startRecognition}
          disabled={disabled || isRecording}
          className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
            isListening 
              ? 'bg-indigo-500 text-white shadow-lg' 
              : isDarkMode 
                ? 'text-slate-400 hover:bg-slate-700' 
                : 'text-slate-500 hover:bg-indigo-50'
          } ${disabled || isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Voice to Text"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      {/* Record Audio Button (Native Audio) */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-25"></span>
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isListening}
          className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 text-white shadow-lg scale-110' 
              : isDarkMode 
                ? 'text-slate-400 hover:bg-slate-700 hover:text-red-400' 
                : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
          } ${disabled || isListening ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? "Stop Recording" : "Send Voice Message"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isRecording ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};
