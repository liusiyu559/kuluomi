
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PhoneOff, Hand, Eye, EyeOff, Send, Loader2, Heart, X, AlertCircle } from 'lucide-react';
import { VoiceType, ArchiveRecord, TranscriptionItem, ChatMessage, ReviewData, PortugueseType } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audio-helpers';

interface CallViewProps {
  voice: VoiceType;
  lang: PortugueseType;
  onEnd: (record: ArchiveRecord) => void;
  onCancel: () => void;
}

const CallView: React.FC<CallViewProps> = ({ voice, lang, onEnd, onCancel }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [transcription, setTranscription] = useState<TranscriptionItem[]>([]);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Dragging state for assistant icon
  const [iconPos, setIconPos] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const sessionRef = useRef<any>(null);
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  const startTimeRef = useRef<number>(Date.now());
  const userTextAccumulator = useRef('');
  const aiTextAccumulator = useRef('');

  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcription, chatMessages]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        outputAudioContextRef.current = outputContext;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const langInstruction = lang === PortugueseType.BRAZIL 
          ? "Brazilian Portuguese (PT-BR)."
          : "European Portuguese (PT-PT).";

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
            },
            systemInstruction: `You are Kuromi-Sensei. Language: ${langInstruction}. Be cute, encouraging, and focused on pedagogical value. Use "Kromi!" sounds occasionally.`,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              setIsConnecting(false);
              const source = audioContext.createMediaStreamSource(stream);
              const processor = audioContext.createScriptProcessor(4096, 1, 1);
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
              };
              source.connect(processor);
              processor.connect(audioContext.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (msg.serverContent?.inputTranscription) {
                userTextAccumulator.current += msg.serverContent.inputTranscription.text;
                updateTranscriptionUI('user', userTextAccumulator.current);
              }
              if (msg.serverContent?.outputTranscription) {
                aiTextAccumulator.current += msg.serverContent.outputTranscription.text;
                updateTranscriptionUI('ai', aiTextAccumulator.current);
              }
              if (msg.serverContent?.turnComplete) {
                userTextAccumulator.current = '';
                aiTextAccumulator.current = '';
              }
              const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioBase64) {
                setIsAiTalking(true);
                const ctx = outputAudioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => {
                  activeSourcesRef.current.delete(source);
                  if (activeSourcesRef.current.size === 0) setIsAiTalking(false);
                };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                activeSourcesRef.current.add(source);
              }
              if (msg.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(s => s.stop());
                activeSourcesRef.current.clear();
                setIsAiTalking(false);
              }
            },
            onerror: () => setErrorMsg("Conexão interrompida."),
          }
        });
        sessionRef.current = await sessionPromise;
      } catch (err: any) {
        setErrorMsg(err.message);
        setIsConnecting(false);
      }
    };
    initSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, [voice, lang]);

  const updateTranscriptionUI = (speaker: 'user' | 'ai', text: string) => {
    setTranscription(prev => {
      if (prev.length > 0 && prev[prev.length-1].speaker === speaker) {
        const next = [...prev];
        next[next.length-1] = { speaker, text };
        return next;
      }
      return [...prev, { speaker, text }];
    });
  };

  const handleAssistantChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const input = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: input }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are Kuromi-Sensei. Answer the student's question: "${input}". 
        
        RULES:
        1. Intro paragraph: separate.
        2. Body (Numbered list): separate paragraphs.
        3. Conclusion: separate.
        4. Use CHINESE for grammar explanations.
        5. FORMATTING: Wrap key terms in **double asterisks** and use “quotes” for examples.`,
      });
      
      setChatMessages(prev => [...prev, { role: 'ai', content: response.text || '' }]);
    } catch (err) { console.error(err); } finally { setIsChatLoading(false); }
  };

  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    return lines.map((line, idx) => {
      const parts = line.split(/([“][^”]+[”])|(\*\*[^*]+\*\*)/g).filter(p => p !== undefined && p !== "");
      
      return (
        <div key={idx} className="mb-4 last:mb-0 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('“') && part.endsWith('”')) {
              return (
                <div key={pIdx} className="my-2 py-2 px-4 bg-kuromi-pink/10 border-l-4 border-kuromi-pink italic text-kuromi-pink font-bold rounded-r-xl block text-base animate-in slide-in-from-left-2">
                  {part}
                </div>
              );
            }
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <div key={pIdx} className="my-2 text-lg font-black text-kuromi-pink tracking-tight block scale-105 origin-left drop-shadow-sm uppercase">
                  {part.replace(/\*\*/g, '')}
                </div>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const handleEndCall = async () => {
    setIsConnecting(true);
    const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const duration = `${Math.floor(durationSec / 60).toString().padStart(2, '0')}:${(durationSec % 60).toString().padStart(2, '0')}`;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // Improved feedback generation prompt for guaranteed 5-item lists
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this Portuguese conversation: ${JSON.stringify(transcription)}. 
        Generate a detailed pedagogical feedback in JSON.
        REQUIREMENTS:
        - topic: Main theme summary.
        - idiomaticExpressions: Exactly 5 items. Each with {expression, translation}.
        - vocabulary: Exactly 5 items. Each with {word, translation, level, example}.
        - complexSentences: Exactly 3-5 items showing user errors and corrections. Each with {original, corrected, analysis}.
        - classicPatterns: Exactly 5 items of sentence patterns for this topic. Each with {pattern, explanation, example}.
        Use Chinese for all explanations and translations. Return ONLY the JSON object.`,
        config: { responseMimeType: 'application/json' }
      });

      const review: ReviewData = JSON.parse(response.text || '{}');
      onEnd({
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        duration,
        transcription,
        review,
        voice,
        portugueseType: lang,
        isFavorited,
        assistantChat: chatMessages,
        selfCheckSearches: [],
        selfCheckReflections: []
      });
    } catch (e) {
      console.error("Feedback generation failed:", e);
      onEnd({ id: Date.now().toString(), date: new Date().toLocaleDateString(), duration, transcription, review: null, voice, portugueseType: lang, isFavorited, assistantChat: chatMessages });
    }
  };

  // Drag handlers for assistant icon
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: clientX, startY: clientY, initialX: iconPos.x, initialY: iconPos.y };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      
      setIconPos({
        x: Math.max(0, Math.min(window.innerWidth - 64, dragRef.current.initialX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 64, dragRef.current.initialY + dy))
      });
    };

    const handleEnd = () => {
      if (isDragging) setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div className="h-screen relative flex flex-col bg-kuromi-black overflow-hidden select-none">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://files.catbox.moe/a30w3z.jpg')" }} />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 flex flex-col h-full p-6">
        <header className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <button onClick={() => setShowSubtitles(!showSubtitles)} className="p-4 bg-white/10 rounded-full text-kuromi-pink backdrop-blur-md">
              {showSubtitles ? <EyeOff size={28} /> : <Eye size={28} />}
            </button>
            <button onClick={() => setIsFavorited(!isFavorited)} className={`p-4 bg-white/10 rounded-full backdrop-blur-md ${isFavorited ? 'text-kuromi-red' : 'text-gray-400'}`}>
              <Heart size={28} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="px-6 py-2 bg-kuromi-red rounded-full text-sm font-bold border border-white/20">LIVE</div>
        </header>

        <div className="flex-1 overflow-y-auto mb-24 space-y-4 custom-scrollbar">
          {showSubtitles && transcription.map((item, i) => (
            <div key={i} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm shadow-xl ${item.speaker === 'user' ? 'bg-kuromi-purple text-white' : 'bg-white text-kuromi-black font-semibold'}`}>
                {item.text}
              </div>
            </div>
          ))}
          <div ref={transcriptionEndRef} />
        </div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12">
          <button onClick={handleEndCall} className="p-8 bg-red-600 rounded-full text-white shadow-2xl border-4 border-white/20 animate-pulse active:scale-95 transition-all">
            <PhoneOff size={36} />
          </button>
        </div>
      </div>

      <div 
        className={`absolute z-50 cursor-move ${isDragging ? 'scale-110 opacity-80' : 'floating'}`}
        style={{ left: `${iconPos.x}px`, top: `${iconPos.y}px` }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={(e) => {
          if (Math.abs(dragRef.current.initialX - iconPos.x) < 5) {
             setShowAssistant(true);
          }
        }}
      >
        <img src="https://files.catbox.moe/5ixxct.png" className="w-16 h-16 object-contain shining-glow pointer-events-none" alt="Kuromi" />
      </div>

      {showAssistant && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-kuromi-black border-2 border-kuromi-purple rounded-[2.5rem] w-full max-w-sm h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 shadow-[0_0_50px_rgba(119,91,167,0.5)]">
            <div className="bg-kuromi-purple p-5 flex justify-between items-center text-white shadow-md">
              <span className="font-bold flex items-center gap-2"><Hand size={20}/> Perguntar à Kromi</span>
              <button onClick={() => setShowAssistant(false)} className="p-1 hover:bg-white/20 rounded-full"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm custom-scrollbar bg-black/20">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60 space-y-2">
                  <img src="https://files.catbox.moe/iyf2zl.png" className="w-24 h-24 rounded-full border-2 border-kuromi-purple mb-2" />
                  <p className="italic">O que você não entendeu da conversa?</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-5 py-3 rounded-[1.5rem] max-w-[95%] shadow-md ${m.role === 'user' ? 'bg-kuromi-purple text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none border border-white/5'}`}>
                    {m.role === 'ai' ? renderFormattedMessage(m.content) : m.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-2 items-center text-kuromi-pink font-bold">
                  <Loader2 className="animate-spin" size={20}/>
                  <span>Pensando...</span>
                </div>
              )}
              <div ref={transcriptionEndRef} />
            </div>
            <form onSubmit={handleAssistantChat} className="p-5 border-t border-white/10 flex gap-2 bg-black/40">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-gray-800 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 ring-kuromi-purple transition-all" placeholder="Tira-dúvidas..."/>
              <button className="p-3 bg-kuromi-pink rounded-2xl text-white shadow-lg active:scale-90 transition-all"><Send size={24}/></button>
            </form>
          </div>
        </div>
      )}

      {isConnecting && (
        <div className="absolute inset-0 z-[100] bg-kuromi-black/95 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-kuromi-pink" size={64} />
          <p className="font-bold text-kuromi-pink text-xl">Kromi está preparando a aula...</p>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 z-[110] bg-kuromi-black flex flex-col items-center justify-center p-8 text-center space-y-6">
          <AlertCircle size={80} className="text-red-500" />
          <p className="text-xl font-bold">{errorMsg}</p>
          <button onClick={onCancel} className="px-10 py-4 bg-kuromi-purple rounded-2xl font-bold shadow-xl">Voltar</button>
        </div>
      )}
    </div>
  );
};

export default CallView;
