
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, AnalyticsData, Role, ChatSession, UserPlan, AppSettings } from './types';
import { geminiService } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { AnalyticsView } from './components/AnalyticsView';
import { VoiceInput } from './components/VoiceInput';
import { BillingView } from './components/BillingView';
import { SettingsView } from './components/SettingsView';
import { INITIAL_ANALYTICS, FAQ_DATA } from './constants';

const HISTORY_KEY = 'nova_chat_history';
const SETTINGS_KEY = 'nova_settings';
const BILLING_KEY = 'nova_billing_plan';

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  streaming: true,
  modelName: 'gemini-3-flash-preview',
  language: 'en'
};

const App: React.FC = () => {
  const initialMessage: Message = {
    id: '1',
    role: 'model',
    text: 'Hello! I am Nova, your AI companion. How can I assist you today?',
    timestamp: new Date(),
  };

  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [view, setView] = useState<'chat' | 'analytics' | 'billing' | 'settings'>('chat');
  const [analytics, setAnalytics] = useState<AnalyticsData>(INITIAL_ANALYTICS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [plan, setPlan] = useState<UserPlan>('free');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistence layer on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((s: any) => ({
          ...s,
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
          lastUpdated: new Date(s.lastUpdated)
        })));
      } catch (e) { console.error("History load error", e); }
    }
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error("Settings load error", e); }
    }
    const savedPlan = localStorage.getItem(BILLING_KEY);
    if (savedPlan) { setPlan(savedPlan as UserPlan); }
  }, []);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(BILLING_KEY, plan);
  }, [plan]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (view === 'chat') scrollToBottom();
  }, [messages, view, scrollToBottom]);

  const saveCurrentToHistory = useCallback((currentMessages: Message[]) => {
    if (currentMessages.length <= 1) return;
    setHistory(prev => {
      const existingIdx = prev.findIndex(s => s.id === currentSessionId);
      const firstUserMsg = currentMessages.find(m => m.role === 'user');
      const title = firstUserMsg ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "")) : "New Conversation";
      const session: ChatSession = {
        id: currentSessionId,
        title,
        messages: currentMessages,
        lastUpdated: new Date()
      };
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = session;
        return updated.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      } else {
        return [session, ...prev];
      }
    });
  }, [currentSessionId]);

  const handleNewChat = () => {
    saveCurrentToHistory(messages);
    geminiService.resetChat();
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMessages([{ ...initialMessage, id: Date.now().toString(), timestamp: new Date() }]);
    setView('chat');
  };

  const loadSession = (session: ChatSession) => {
    saveCurrentToHistory(messages);
    geminiService.resetChat();
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setView('chat');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) handleNewChat();
  };

  const handleSend = async (overrideText?: string, audioData?: { data: string; mimeType: string }) => {
    const text = overrideText || inputText;
    if (!text.trim() && !audioData) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: audioData ? `[Voice Message] ${text}` : text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    const startTime = Date.now();

    const sentimentPromise = text ? geminiService.analyzeSentiment(text) : Promise.resolve('neutral' as const);

    try {
      let responseText = '';
      let responseSources: any[] = [];
      const modelMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: new Date() }]);

      const stream = geminiService.sendMessageStream(text, audioData);
      for await (const chunk of stream) {
        responseText += chunk.text;
        responseSources = [...responseSources, ...chunk.sources];
        setMessages(prev => {
          const newMsgs = prev.map(m => m.id === modelMsgId ? { ...m, text: responseText, sources: Array.from(new Set(responseSources.map(s => JSON.stringify(s)))).map(s => JSON.parse(s)) } : m);
          if (responseText.length % 50 === 0) saveCurrentToHistory(newMsgs);
          return newMsgs;
        });
      }

      const endTime = Date.now();
      const sentiment = await sentimentPromise;
      
      setMessages(prev => {
        const finalMsgs = prev.map(m => m.id === modelMsgId ? { ...m, sentiment } : m);
        saveCurrentToHistory(finalMsgs);
        return finalMsgs;
      });

      // Auto-play response if it was an audio message
      if (audioData) {
        const ttsData = await geminiService.generateSpeech(responseText);
        if (ttsData) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          const bytes = atob(ttsData);
          const uint8 = new Uint8Array(bytes.length);
          for(let i=0; i<bytes.length; i++) uint8[i] = bytes.charCodeAt(i);
          const int16 = new Int16Array(uint8.buffer);
          const buffer = audioContext.createBuffer(1, int16.length, 24000);
          const chan = buffer.getChannelData(0);
          for(let i=0; i<int16.length; i++) chan[i] = int16[i] / 32768.0;
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
        }
      }

      setAnalytics(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 2,
        avgResponseTime: Math.round((prev.avgResponseTime * prev.totalMessages + (endTime - startTime)) / (prev.totalMessages + 2))
      }));

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: 'error-' + Date.now(), role: 'model', text: "I'm sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden transition-colors duration-500 ${settings.darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 border-r flex flex-col p-4 z-10 shadow-sm transition-colors ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
          </div>
          <h1 className={`text-xl font-black tracking-tight ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>NOVA</h1>
        </div>
        <button onClick={handleNewChat} className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95 group"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>New Chat</button>
        <nav className="space-y-1 mb-6">
          <button onClick={() => setView('chat')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'chat' ? (settings.darkMode ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold') : 'text-slate-500 hover:bg-slate-50/50'}`}>Active Chat</button>
          <button onClick={() => setView('analytics')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'analytics' ? (settings.darkMode ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold') : 'text-slate-500 hover:bg-slate-50/50'}`}>Insights</button>
          <button onClick={() => setView('billing')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'billing' ? (settings.darkMode ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold') : 'text-slate-500 hover:bg-slate-50/50'}`}>Billing</button>
          <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${view === 'settings' ? (settings.darkMode ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold') : 'text-slate-500 hover:bg-slate-50/50'}`}>Settings</button>
        </nav>
        <div className="flex-grow flex flex-col min-h-0">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Recent Chats</h4>
          <div className="flex-grow overflow-y-auto space-y-1 px-2 custom-scrollbar">
            {history.length === 0 ? <p className="px-4 py-2 text-[11px] text-slate-400 italic">No history yet</p> : history.map((session) => (
              <div key={session.id} onClick={() => loadSession(session)} className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? (settings.darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-200 shadow-sm') : 'text-slate-500 hover:bg-slate-50/10'} border border-transparent`}>
                <div className="flex flex-col min-w-0"><span className="text-xs font-semibold truncate pr-2">{session.title}</span><span className="text-[9px] text-slate-400 uppercase">{new Date(session.lastUpdated).toLocaleDateString()}</span></div>
                <button onClick={(e) => deleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"><svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden">
        {view === 'analytics' && <AnalyticsView data={analytics} />}
        {view === 'billing' && <BillingView currentPlan={plan} onUpgrade={(p) => setPlan(p)} />}
        {view === 'settings' && <SettingsView settings={settings} onUpdate={(u) => setSettings(prev => ({ ...prev, ...u }))} />}
        
        {view === 'chat' && (
          <>
            <header className={`backdrop-blur-md border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors ${settings.darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="relative"><div className="h-10 w-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">N</div><div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div></div>
                <div><h3 className={`text-sm font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>Nova Assistant</h3><div className="flex items-center gap-1.5"><span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Online</span></div></div>
              </div>
            </header>

            <div className="flex-grow overflow-y-auto px-4 md:px-8 py-6 space-y-2 custom-scrollbar">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isTyping && <div className="flex gap-2 items-center p-2 fade-in"><div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div></div><span className="text-[10px] text-slate-400 font-medium">Nova is thinking...</span></div>}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 md:p-6 border-t transition-colors ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`max-w-4xl mx-auto flex items-end gap-3 rounded-2xl p-2 border shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all ${settings.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <VoiceInput 
                  onTranscript={(t) => setInputText(prev => prev ? `${prev} ${t}` : t)} 
                  onAudioReady={(data, mimeType) => handleSend(inputText, { data, mimeType })}
                  disabled={isTyping} 
                  isDarkMode={settings.darkMode} 
                />
                <textarea rows={1} value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Message Nova..." className={`flex-grow bg-transparent border-none focus:ring-0 text-sm py-2 px-1 max-h-32 resize-none ${settings.darkMode ? 'text-white placeholder-slate-500' : 'text-slate-900'}`} />
                <button onClick={() => handleSend()} disabled={!inputText.trim() || isTyping} className={`p-2.5 rounded-xl transition-all shadow-md ${inputText.trim() && !isTyping ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><svg className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
              </div>
            </div>
          </>
        )}
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
