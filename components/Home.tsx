import React from 'react';
import { Phone, History, Music, Mic2, Globe } from 'lucide-react';
import { VoiceType, PortugueseType } from '../types';

interface HomeProps {
  selectedVoice: VoiceType;
  setVoice: (v: VoiceType) => void;
  selectedLang: PortugueseType;
  setLang: (l: PortugueseType) => void;
  onStart: () => void;
  onViewArchive: () => void;
}

const Home: React.FC<HomeProps> = ({ selectedVoice, setVoice, selectedLang, setLang, onStart, onViewArchive }) => {
  return (
    <div className="h-screen relative flex flex-col p-6 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: "url('https://files.catbox.moe/w5s5fw.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      
      <div className="relative z-10 flex flex-col h-full">
        <header className="flex justify-between items-center mb-8">
          <div className="bg-kuromi-purple/80 p-3 rounded-2xl shadow-lg border border-kuromi-pink/30 flex items-center gap-2">
            <h1 className="text-2xl text-white tracking-wider">Kuromi PT</h1>
          </div>
          <button 
            onClick={onViewArchive}
            className="p-3 bg-kuromi-black/60 rounded-full hover:bg-kuromi-purple transition-all border border-kuromi-pink/20"
          >
            <History className="text-kuromi-pink" size={24} />
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-kuromi-purple via-kuromi-pink to-kuromi-red rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative bg-kuromi-black p-4 rounded-full border-4 border-kuromi-purple overflow-hidden">
               {/* Updated Avatar to the latest requested URL */}
               <img src="https://files.catbox.moe/iyf2zl.png" className="w-40 h-40 rounded-full object-cover bg-kuromi-white/10" alt="Kuromi Avatar" />
            </div>
          </div>

          <div className="text-center bg-black/40 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <p className="text-kuromi-pink font-bold text-lg mb-1">Olá! Vamos praticar?</p>
            <p className="text-gray-300 text-sm">Pratique sua fala com a Kuromi!</p>
          </div>

          <div className="w-full space-y-4">
            {/* Language Selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-kuromi-pink text-center uppercase tracking-[0.2em]">Variedade do Idioma</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setLang(PortugueseType.BRAZIL)}
                  className={`flex-1 max-w-[140px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs ${
                    selectedLang === PortugueseType.BRAZIL 
                    ? 'bg-kuromi-purple border-kuromi-pink text-white shadow-lg' 
                    : 'bg-kuromi-black/60 border-white/10 text-gray-400'
                  }`}
                >
                  <Globe size={14} /> Brasil
                </button>
                <button 
                  onClick={() => setLang(PortugueseType.PORTUGAL)}
                  className={`flex-1 max-w-[140px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs ${
                    selectedLang === PortugueseType.PORTUGAL 
                    ? 'bg-kuromi-purple border-kuromi-pink text-white shadow-lg' 
                    : 'bg-kuromi-black/60 border-white/10 text-gray-400'
                  }`}
                >
                  <Globe size={14} /> Portugal
                </button>
              </div>
            </div>

            {/* Voice Selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-kuromi-pink text-center uppercase tracking-[0.2em]">Escolha a voz</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setVoice(VoiceType.FEMALE)}
                  className={`flex-1 max-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-xs ${
                    selectedVoice === VoiceType.FEMALE 
                    ? 'bg-kuromi-purple border-kuromi-pink shadow-lg' 
                    : 'bg-kuromi-black/60 border-white/10 text-gray-400'
                  }`}
                >
                  <Music size={14} /> Feminina
                </button>
                <button 
                  onClick={() => setVoice(VoiceType.MALE)}
                  className={`flex-1 max-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all text-xs ${
                    selectedVoice === VoiceType.MALE 
                    ? 'bg-kuromi-purple border-kuromi-pink shadow-lg' 
                    : 'bg-kuromi-black/60 border-white/10 text-gray-400'
                  }`}
                >
                  <Mic2 size={14} /> Masculina
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-auto py-6">
          <button 
            onClick={onStart}
            className="w-full bg-kuromi-red hover:bg-kuromi-pink text-white py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(242,87,157,0.4)] transform active:scale-95 transition-all"
          >
            <Phone size={24} fill="currentColor" />
            Começar Chamada
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Home;