
import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Star, Zap, MessageCircle, Heart, History, Search, Book, Loader2, Save, Clock, Calendar, CheckCircle2, AlertCircle, Headphones, Layout, Edit3, RefreshCcw } from 'lucide-react';
import { ArchiveRecord, SelfCheckItem, ReviewData } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface ReviewViewProps {
  record: ArchiveRecord;
  onBack: () => void;
  onToggleFavorite: () => void;
  onUpdateRecord: (record: ArchiveRecord) => void;
}

const ReviewView: React.FC<ReviewViewProps> = ({ record, onBack, onToggleFavorite, onUpdateRecord }) => {
  const { review, transcription, assistantChat = [], selfCheckSearches = [], selfCheckReflections = [], userProfile } = record;
  const [activeTab, setActiveTab] = useState<'review' | 'history' | 'assistant' | 'selfcheck'>('review');
  
  // States for search and feedback generation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SelfCheckItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Reflection state
  const [reflectionInput, setReflectionInput] = useState('');

  const handleRegenerateFeedback = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise a conversa entre Kuromi-Sensei e o aluno ${userProfile?.name}: ${JSON.stringify(transcription)}. 
        Gere um feedback pedagógico detalhado em JSON.
        REQUISITOS:
        - topic: Resumo do tema.
        - idiomaticExpressions: Exatamente 5 {expression, translation}.
        - vocabulary: Exatamente 5 {word, translation, level, example}.
        - complexSentences: Correções de erros do aluno {original, corrected, analysis}.
        - classicPatterns: 5 padrões de frases {pattern, explanation, example}.
        Use CHINES para explicações gramaticais. Retorne APENAS JSON.`,
        config: { responseMimeType: 'application/json' }
      });
      
      const newReview: ReviewData = JSON.parse(response.text || '{}');
      onUpdateRecord({ ...record, review: newReview });
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // 优化搜索 Prompt：只要翻译和例句
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Traduza e exemplifique o termo "${searchQuery}" em português (${record.portugueseType}). 
        Seja extremamente breve. Retorne um JSON com a tradução em chinês e um exemplo em português. Sem explicações longas.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ['translation', 'example']
          }
        }
      });
      
      const resData = JSON.parse(response.text || '{}');
      setSearchResult({ 
        query: searchQuery, 
        answer: resData.translation,
        translation: resData.translation,
        example: resData.example
      });
    } catch (e) { 
      console.error(e); 
      setSearchResult({ query: searchQuery, answer: "Erro ao buscar significado." });
    } finally { 
      setIsSearching(false); 
    }
  };

  const confirmSaveSearch = () => {
    if (!searchResult) return;
    onUpdateRecord({
      ...record,
      selfCheckSearches: [...selfCheckSearches, searchResult]
    });
    setSearchResult(null);
    setSearchQuery('');
  };

  const handleSaveReflection = () => {
    if (!reflectionInput.trim()) return;
    onUpdateRecord({
      ...record,
      selfCheckReflections: [...selfCheckReflections, reflectionInput]
    });
    setReflectionInput('');
  };

  return (
    <div className="h-screen relative flex flex-col bg-kuromi-black overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://files.catbox.moe/x93ey9.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-kuromi-black/60 to-kuromi-black/95 backdrop-blur-sm" />
      
      <header className="relative z-20 p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/10 rounded-full text-kuromi-pink active:scale-90 transition-all"><ArrowLeft size={24} /></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white tracking-tight">Estudos de Hoje</h2>
            <span className="text-[10px] text-kuromi-pink font-bold uppercase tracking-widest">Aluno: {userProfile?.name}</span>
          </div>
        </div>
        <button onClick={onToggleFavorite} className={`p-3 rounded-full border border-white/5 transition-colors ${record.isFavorited ? 'text-kuromi-red bg-white/10' : 'text-gray-400'}`}>
          <Heart size={28} fill={record.isFavorited ? "currentColor" : "none"} />
        </button>
      </header>

      <nav className="relative z-20 flex p-1 bg-black/40 mx-4 mt-4 rounded-2xl border border-white/10 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('review')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'review' ? 'bg-kuromi-purple text-white shadow-lg' : 'text-gray-400'}`}><Star size={14} /> RELATÓRIO</button>
        <button onClick={() => setActiveTab('history')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'history' ? 'bg-kuromi-purple text-white shadow-lg' : 'text-gray-400'}`}><History size={14} /> DIÁLOGO</button>
        <button onClick={() => setActiveTab('assistant')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'assistant' ? 'bg-kuromi-purple text-white shadow-lg' : 'text-gray-400'}`}><Headphones size={14} /> AJUDA</button>
        <button onClick={() => setActiveTab('selfcheck')} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeTab === 'selfcheck' ? 'bg-kuromi-purple text-white shadow-lg' : 'text-gray-400'}`}><Edit3 size={14} /> ESTUDO</button>
      </nav>

      <div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-8 pb-32 custom-scrollbar">
        {activeTab === 'review' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {review ? (
              <>
                <div className="flex justify-between items-center">
                  <section className="bg-gradient-to-br from-kuromi-purple/40 to-black/60 p-6 rounded-3xl border border-kuromi-purple/20 shadow-xl flex-1 mr-3">
                    <h3 className="text-kuromi-pink font-bold flex items-center gap-3 text-sm tracking-widest mb-4"><Star size={20} fill="currentColor"/> TEMA: {review.topic}</h3>
                    <div className="flex gap-4 text-[10px] text-white/50 font-bold">
                      <div className="flex items-center gap-2"><Calendar size={14}/> {record.date}</div>
                      <div className="flex items-center gap-2"><Clock size={14}/> {record.duration}</div>
                    </div>
                  </section>
                  <button 
                    onClick={handleRegenerateFeedback} 
                    disabled={isRegenerating}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl text-kuromi-pink hover:bg-kuromi-purple/20 transition-all flex flex-col items-center gap-1 shadow-lg"
                  >
                    {isRegenerating ? <Loader2 className="animate-spin" size={24}/> : <RefreshCcw size={24}/>}
                    <span className="text-[9px] font-black uppercase">Refazer</span>
                  </button>
                </div>

                <section className="space-y-4">
                  <h3 className="text-kuromi-pink font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><Zap size={16}/> Expressões de Hoje</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {review.idiomaticExpressions?.map((e, i) => (
                      <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-sm">
                        <span className="text-sm font-bold text-white tracking-tight">{e.expression}</span>
                        <span className="text-xs text-kuromi-pink/70 italic font-medium">{e.translation}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-kuromi-pink font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><BookOpen size={16}/> Vocabulário</h3>
                  <div className="space-y-3">
                    {review.vocabulary?.map((v, i) => (
                      <div key={i} className="bg-black/30 p-4 rounded-2xl border-l-4 border-kuromi-purple shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-bold text-white text-md tracking-tight">{v.word}</p>
                          <span className="text-[9px] bg-kuromi-purple/30 px-2 py-0.5 rounded-full text-white uppercase font-black">{v.level}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2 font-medium">{v.translation}</p>
                        <p className="text-[11px] italic text-kuromi-pink/70 bg-black/20 p-2 rounded-lg">Ex: {v.example}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                   <h3 className="text-blue-400 font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><Layout size={16}/> Estruturas Clássicas</h3>
                   <div className="space-y-3">
                     {review.classicPatterns?.map((p, i) => (
                       <div key={i} className="bg-blue-900/10 p-5 rounded-2xl border border-blue-400/10 shadow-inner">
                          <p className="font-black text-blue-400 mb-2 leading-tight text-sm">{p.pattern}</p>
                          <p className="text-xs text-gray-300 mb-2 leading-relaxed font-medium">{p.explanation}</p>
                          <p className="text-[10px] text-blue-300/60 font-medium italic p-2 bg-black/20 rounded-lg">Ex: {p.example}</p>
                       </div>
                     ))}
                   </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-red-400 font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><MessageCircle size={16}/> Sugestões de Melhoria</h3>
                  <div className="space-y-4">
                    {review.complexSentences && review.complexSentences.length > 0 ? review.complexSentences.map((s, i) => (
                      <div key={i} className="bg-black/40 p-5 rounded-2xl border border-red-500/10 space-y-3 shadow-md">
                        <div className="space-y-1">
                          <p className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">O que foi dito:</p>
                          <p className="text-sm text-gray-400 line-through decoration-red-500/50 italic">"{s.original}"</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-green-400 font-bold uppercase tracking-tighter">Como dizer:</p>
                          <p className="text-sm text-white font-bold italic">"{s.corrected}"</p>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl italic border border-white/5">{s.analysis}</p>
                      </div>
                    )) : <p className="text-center text-gray-500 py-10 text-xs italic">Você mandou muito bem, {userProfile?.name}!</p>}
                  </div>
                </section>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center space-y-4 bg-black/40 rounded-[2rem] border border-dashed border-white/10 mx-auto w-full">
                {isRegenerating ? (
                  <>
                    <Loader2 className="animate-spin text-kuromi-pink" size={48}/>
                    <p className="font-bold text-xs text-kuromi-pink">Kromi está analisando sua fala...</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-gray-600" size={48} />
                    <p className="text-gray-400 text-xs text-center px-10">O relatório não pôde ser gerado automaticamente. Clique abaixo para tentar agora.</p>
                    <button 
                      onClick={handleRegenerateFeedback}
                      className="px-8 py-3 bg-kuromi-purple text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-kuromi-pink transition-all"
                    >
                      <RefreshCcw size={18}/> Gerar Relatório
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            {transcription?.map((item, i) => (
              <div key={i} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-md ${item.speaker === 'user' ? 'bg-kuromi-purple text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5'}`}>{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            {assistantChat.length > 0 ? assistantChat.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs whitespace-pre-line leading-relaxed shadow-lg ${m.role === 'user' ? 'bg-kuromi-purple text-white rounded-tr-none' : 'bg-gray-800 text-kuromi-pink border border-white/5 rounded-tl-none'}`}>{m.content}</div>
              </div>
            )) : <p className="text-center text-xs text-gray-500 py-10 italic">Sem registros de ajuda nesta sessão.</p>}
          </div>
        )}

        {activeTab === 'selfcheck' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6">
            <section className="bg-black/40 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-3 tracking-tight"><Search size={22} className="text-kuromi-pink"/> Dicionário do {userProfile?.name}</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 bg-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none border border-white/5 focus:ring-2 ring-kuromi-pink transition-all" 
                  placeholder="Pesquisar termo..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="p-3 bg-kuromi-purple text-white rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={22}/> : <Search size={22}/>}
                </button>
              </div>
              
              {searchResult && (
                <div className="mt-4 p-5 bg-kuromi-pink/10 rounded-2xl border border-kuromi-pink/20 space-y-4 animate-in zoom-in-95">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-kuromi-pink uppercase">Tradução:</p>
                      <p className="text-base text-gray-100 font-bold">{searchResult.translation}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black text-kuromi-pink uppercase">Exemplo:</p>
                      <p className="text-sm italic text-gray-300 p-3 bg-black/40 rounded-xl border border-white/5">{searchResult.example}</p>
                    </div>
                  </div>
                  <button onClick={confirmSaveSearch} className="w-full py-4 bg-kuromi-pink text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <Save size={16}/> Adicionar ao Feedback
                  </button>
                </div>
              )}

              {selfCheckSearches.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Glossário da Aula</p>
                   {selfCheckSearches.map((item, idx) => (
                     <details key={idx} className="group bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all">
                       <summary className="list-none p-4 text-sm font-bold text-kuromi-pink cursor-pointer flex justify-between items-center group-open:bg-kuromi-purple/20">
                         {item.query}
                         <span className="text-xs transition-transform group-open:rotate-180">▼</span>
                       </summary>
                       <div className="p-4 text-xs text-gray-300 leading-relaxed border-t border-white/5 space-y-2">
                         <p className="font-bold text-gray-100">{item.translation}</p>
                         <p className="italic text-gray-500 border-l-2 border-kuromi-pink pl-3">{item.example}</p>
                       </div>
                     </details>
                   ))}
                </div>
              )}
            </section>

            <section className="bg-black/40 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-3 tracking-tight"><Book size={22} className="text-blue-400"/> Reflexões de {userProfile?.name}</h3>
              <div className="space-y-4 mb-6">
                {selfCheckReflections.length === 0 ? (
                  <p className="text-xs text-gray-500 italic text-center py-4">O que você aprendeu com a Sensei hoje?</p>
                ) : (
                  selfCheckReflections.map((ref, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-blue-400/10 text-sm text-gray-300 italic shadow-inner">
                      "{ref}"
                    </div>
                  ))
                )}
              </div>
              <textarea 
                className="w-full bg-gray-800 rounded-2xl p-5 text-sm text-white min-h-[140px] outline-none border border-white/5 focus:ring-2 ring-blue-400 transition-all resize-none shadow-inner" 
                placeholder="Hoje eu descobri que..." 
                value={reflectionInput} 
                onChange={(e) => setReflectionInput(e.target.value)} 
              />
              <button onClick={handleSaveReflection} className="w-full mt-4 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Fixar Insight
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewView;
