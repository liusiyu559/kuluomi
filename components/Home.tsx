
import React, { useState } from 'react';
import { Phone, History, Music, Mic2, Globe, User, Cake, UserCircle, Save, Edit3 } from 'lucide-react';
import { VoiceType, PortugueseType, UserProfile } from '../types';

interface HomeProps {
  selectedVoice: VoiceType;
  setVoice: (v: VoiceType) => void;
  selectedLang: PortugueseType;
  setLang: (l: PortugueseType) => void;
  userProfile: UserProfile | null;
  onSaveProfile: (p: UserProfile) => void;
  onStart: () => void;
  onViewArchive: () => void;
}

const Home: React.FC<HomeProps> = ({ 
  selectedVoice, 
  setVoice, 
  selectedLang, 
  setLang, 
  userProfile, 
  onSaveProfile, 
  onStart, 
  onViewArchive 
}) => {
  const [showProfileForm, setShowProfileForm] = useState(!userProfile);
  const [formData, setFormData] = useState<UserProfile>(userProfile || { name: '', gender: 'Other', birthday: '' });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSaveProfile(formData);
    setShowProfileForm(false);
  };

  return (
    <div className="h-screen relative flex flex-col p-6 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: "url('https://files.catbox.moe/w5s5fw.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      
      <div className="relative z-10 flex flex-col h-full">
        <header className="flex justify-between items-center mb-6">
          <div className="bg-kuromi-purple/80 p-3 rounded-2xl shadow-lg border border-kuromi-pink/30 flex items-center gap-2">
            <h1 className="text-2xl text-white tracking-wider">Kuromi PT</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowProfileForm(true)}
              className="p-3 bg-kuromi-black/60 rounded-full hover:bg-kuromi-purple transition-all border border-kuromi-pink/20"
            >
              <UserCircle className="text-kuromi-pink" size={24} />
            </button>
            <button 
              onClick={onViewArchive}
              className="p-3 bg-kuromi-black/60 rounded-full hover:bg-kuromi-purple transition-all border border-kuromi-pink/20"
            >
              <History className="text-kuromi-pink" size={24} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-kuromi-purple via-kuromi-pink to-kuromi-red rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative bg-kuromi-black p-4 rounded-full border-4 border-kuromi-purple overflow-hidden">
               <img src="https://files.catbox.moe/iyf2zl.png" className="w-40 h-40 rounded-full object-cover bg-kuromi-white/10" alt="Kuromi Avatar" />
            </div>
          </div>

          <div className="text-center bg-black/40 p-4 rounded-2xl backdrop-blur-sm border border-white/10 w-full">
            {userProfile ? (
              <>
                <p className="text-kuromi-pink font-bold text-lg mb-1">Olá, {userProfile.name}! 👋</p>
                <p className="text-gray-300 text-sm italic">Eu sou a Kuromi-Sensei. Vamos conversar?</p>
              </>
            ) : (
              <p className="text-kuromi-pink font-bold text-lg">Bem-vindo aluno!</p>
            )}
          </div>

          {!showProfileForm ? (
            <div className="w-full space-y-4">
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

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-kuromi-pink text-center uppercase tracking-[0.2em]">Escolha a voz da Sensei</p>
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
          ) : (
            <div className="w-full bg-kuromi-black/80 p-6 rounded-[2.5rem] border-2 border-kuromi-purple animate-in zoom-in-95">
              <h3 className="text-lg text-kuromi-pink mb-4 text-center">Registro do Aluno</h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2"><User size={12}/> Nome</label>
                  <input 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-800 rounded-xl px-4 py-2 text-sm outline-none border border-white/5 focus:ring-1 ring-kuromi-pink"
                    placeholder="Seu nome..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2"><Edit3 size={12}/> Gênero</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="w-full bg-gray-800 rounded-xl px-4 py-2 text-sm outline-none border border-white/5"
                    >
                      <option value="Male">Masculino</option>
                      <option value="Female">Feminino</option>
                      <option value="Other">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2"><Cake size={12}/> Aniversário</label>
                    <input 
                      type="date"
                      value={formData.birthday}
                      onChange={e => setFormData({...formData, birthday: e.target.value})}
                      className="w-full bg-gray-800 rounded-xl px-4 py-2 text-sm outline-none border border-white/5"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-kuromi-purple text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2">
                  <Save size={18}/> Salvar Perfil
                </button>
              </form>
            </div>
          )}
        </main>

        <footer className="mt-auto py-6">
          <button 
            disabled={!userProfile}
            onClick={onStart}
            className={`w-full py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(242,87,157,0.4)] transform active:scale-95 transition-all ${
              userProfile ? 'bg-kuromi-red hover:bg-kuromi-pink text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Phone size={24} fill="currentColor" />
            Começar Chamada
          </button>
          {!userProfile && <p className="text-[10px] text-center mt-2 text-gray-500">Por favor, complete seu perfil antes de começar.</p>}
        </footer>
      </div>
    </div>
  );
};

export default Home;
