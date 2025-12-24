import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, ChevronRight, Heart, Filter, Tag } from 'lucide-react';
import { ArchiveRecord } from '../types';

interface ArchiveViewProps {
  archives: ArchiveRecord[];
  onBack: () => void;
  onViewReview: (record: ArchiveRecord) => void;
  onToggleFavorite: (id: string) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ archives, onBack, onViewReview, onToggleFavorite }) => {
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const filteredArchives = showOnlyFavorites 
    ? archives.filter(a => a.isFavorited) 
    : archives;

  return (
    <div className="h-screen bg-kuromi-black flex flex-col">
      <header className="p-6 border-b border-kuromi-purple/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-gray-800 rounded-full text-kuromi-pink hover:bg-kuromi-purple transition-all">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">Histórico de Sessões</h2>
        </div>
        <button 
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className={`p-2 rounded-xl border transition-all ${showOnlyFavorites ? 'bg-kuromi-red border-transparent text-white' : 'bg-gray-800 border-white/10 text-gray-400'}`}
        >
          <Filter size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {filteredArchives.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4">
            <Heart size={48} />
            <p className="text-sm">{showOnlyFavorites ? 'Nenhum favorito.' : 'Nenhuma conversa ainda.'}</p>
          </div>
        ) : (
          filteredArchives.map((archive) => (
            <div key={archive.id} className="relative group">
              <button 
                onClick={() => onViewReview(archive)}
                className="w-full bg-gray-800/40 p-5 pr-12 rounded-3xl border border-white/5 hover:border-kuromi-pink/40 hover:bg-gray-800/60 transition-all flex items-center justify-between"
              >
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-kuromi-pink font-bold uppercase tracking-wider">
                    <Calendar size={10} />
                    {archive.date}
                  </div>
                  <div className="text-sm font-bold text-white group-hover:text-kuromi-pink transition-colors line-clamp-1">
                    {archive.review?.topic || `Sessão ${archive.portugueseType}`}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1 font-bold"><Tag size={10}/> {archive.portugueseType}</span>
                    <span className="flex items-center gap-1 font-bold"><User size={10} /> {archive.duration}</span>
                  </div>
                </div>
                <ChevronRight className="text-gray-700 group-hover:text-kuromi-pink" size={20} />
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(archive.id);
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${archive.isFavorited ? 'text-kuromi-red opacity-100' : 'text-gray-600 opacity-40 hover:opacity-100'}`}
              >
                <Heart size={18} fill={archive.isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArchiveView;