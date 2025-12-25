
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PhoneOff, Hand, Eye, EyeOff, Send, Loader2, Heart, X, AlertCircle } from 'lucide-react';
import { VoiceType, ArchiveRecord, TranscriptionItem, ChatMessage, ReviewData, PortugueseType, UserProfile } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audio-helpers';

interface CallViewProps {
  voice: VoiceType;
  lang: PortugueseType;
  userProfile: UserProfile;
  onEnd: (record: ArchiveRecord) => void;
  onCancel: () => void;
}

const CallView: React.FC<CallViewProps> = ({ voice, lang, userProfile, onEnd, onCancel }) => {
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

        const now = new Date();
        const dateTimeString = now.toLocaleString('pt-BR');
        const hour = now.getHours();
        
        // 更强大的系统指令：强化身份、时间感知、话题引导
        const instruction = `Você é a Kuromi-Sensei, uma professora de português brasileira sarcástica, fofa e muito competente.
        Idioma de ensino: ${langInstruction}.
        Data/Hora atual: ${dateTimeString}.
        Perfil do Aluno: Nome: ${userProfile.name}, Gênero: ${userProfile.gender}, Data de Nascimento: ${userProfile.birthday}.
        
        REGRAS DE IDENTIDADE:
        1. VOCÊ é a Kuromi-Sensei. 
        2. O aluno é o(a) ${userProfile.name}. NUNCA chame o aluno de "Kuromi" ou "Kromi". Chame-o pelo nome: ${userProfile.name}.
        3. Use "Kromi!" ou "Aiaiai!" como interjeições fofas.
        
        REGRAS DE COMPORTAMENTO TEMPORAL:
        - Se for tarde da noite (ex: entre 23h e 05h), pergunte ao ${userProfile.name} por que ele(a) está estudando tão tarde e se não deveria estar dormindo.
        - Se for feriado (como Natal, Ano Novo, Carnaval), puxe assunto sobre isso imediatamente.
        - Comece a conversa perguntando algo relacionado ao momento do dia (café da manhã, trabalho, cansaço da noite).
        
        ESTILO DE ENSINO:
        - Corrija erros de gramática de forma leve.
        - Incentive o aluno a falar frases completas.`;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
            },
            systemInstruction: instruction,
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
                const sourceNode = ctx.createBufferSource();
                sourceNode.buffer = buffer;
                sourceNode.connect(ctx.destination);
                sourceNode.onended = () => {
                  activeSourcesRef.current.delete(sourceNode);
                  if (activeSourcesRef.current.size === 0) setIsAiTalking(false);
                };
                sourceNode.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                activeSourcesRef.current.add(sourceNode);
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
  }, [voice, lang, userProfile]);

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
        contents: `Você é a Kuromi-Sensei. Responda à dúvida do aluno ${userProfile.name}: "${input}". 
        
        REGRAS:
        1. Explicações gramaticais em CHINÊS.
        2. O aluno é o ${userProfile.name}, NÃO a Kuromi.
        3. Formatação: **Negrito** para termos chave e “Aspas” para exemplos.
        4. Seja fofa e direta.`,
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
              return <span key={pIdx} className="text-kuromi-pink font-bold italic underline decoration-kuromi-pink/30">{part}</span>;
            }
            if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={pIdx} className="text-kuromi-pink font-black text-lg">{part.replace(/\*\*/g, '')}</span>;
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
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise a conversa entre Kuromi-Sensei e o aluno ${userProfile.name}: ${JSON.stringify(transcription)}. 
        Gere feedback pedagógico JSON.
        REQUISITOS:
        - topic: Resumo curto.
        - idiomaticExpressions: Exatamente 5 {expression, translation}.
        - vocabulary: Exatamente 5 {word, translation, level, example}.
        - complexSentences: Erros do aluno {original, corrected, analysis}.
        - classicPatterns: 5 padrões {pattern, explanation, example}.
        Use CHINÊS para explicações.`,
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
        userProfile: userProfile
      });
    } catch (e) {
      onEnd({ id: Date.now().toString(), date: new Date().toLocaleDateString(), duration, transcription, review: null, voice, portugueseType: lang, isFavorited, assistantChat: chatMessages, userProfile });
    }
  };

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
    const handleEnd = () => setIsDragging(false);
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
            <button onClick={() => setShowSubtitles(!showSubtitles)} className="p-4 bg-white/10 rounded-full text-kuromi-pink backdrop-blur-md shadow-lg">
              {showSubtitles ? <EyeOff size={28} /> : <Eye size={28} />}
            </button>
            <button onClick={() => setIsFavorited(!isFavorited)} className={`p-4 bg-white/10 rounded-full backdrop-blur-md shadow-lg ${isFavorited ? 'text-kuromi-red' : 'text-gray-400'}`}>
              <Heart size={28} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="px-6 py-2 bg-kuromi-red rounded-full text-sm font-bold border border-white/20 shadow-xl">AO VIVO</div>
        </header>

        <div className="flex-1 overflow-y-auto mb-24 space-y-4 custom-scrollbar">
          {showSubtitles && transcription.map((item, i) => (
            <div key={i} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm md:text-base shadow-2xl ${item.speaker === 'user' ? 'bg-kuromi-purple text-white rounded-tr-none' : 'bg-white text-kuromi-black font-semibold rounded-tl-none'}`}>
                {item.text}
              </div>
            </div>
          ))}
          <div ref={transcriptionEndRef} />
        </div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12">
          <button onClick={handleEndCall} className="p-8 bg-red-600 rounded-full text-white shadow-2xl border-4 border-white/20 hover:scale-105 active:scale-95 transition-all">
            <PhoneOff size={36} />
          </button>
        </div>
      </div>

      <div 
        className={`absolute z-50 cursor-move ${isDragging ? 'scale-110 opacity-80' : 'floating'}`}
        style={{ left: `${iconPos.x}px`, top: `${iconPos.y}px` }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={() => {
          if (!isDragging) setShowAssistant(true);
        }}
      >
        <img src="https://files.catbox.moe/5ixxct.png" className="w-16 h-16 object-contain shining-glow pointer-events-none" alt="Kuromi" />
      </div>

      {showAssistant && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-kuromi-black border-2 border-kuromi-purple rounded-[2.5rem] w-full max-w-sm h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 shadow-2xl">
            <div className="bg-kuromi-purple p-5 flex justify-between items-center text-white">
              <span className="font-bold flex items-center gap-2"><Hand size={20}/> Ajuda da Sensei</span>
              <button onClick={() => setShowAssistant(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm custom-scrollbar bg-black/20">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60 text-center">
                  <p className="italic">Dúvida sobre o que falamos, {userProfile.name}?</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-5 py-3 rounded-[1.5rem] max-w-[95%] shadow-md ${m.role === 'user' ? 'bg-kuromi-purple text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none border border-white/5'}`}>
                    {m.role === 'ai' ? renderFormattedMessage(m.content) : m.content}
                  </div>
                </div>
              ))}
              {isChatLoading && <Loader2 className="animate-spin text-kuromi-pink mx-auto mt-4"/>}
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
        <div className="absolute inset-0 z-[100] bg-kuromi-black flex flex-col items-center justify-center space-y-6">
          <Loader2 className="animate-spin text-kuromi-pink" size={64} />
          <p className="font-bold text-kuromi-pink text-xl tracking-tight">Sensei está vindo, {userProfile.name}...</p>
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
