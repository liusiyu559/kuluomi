
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import CallView from './components/CallView';
import ReviewView from './components/ReviewView';
import ArchiveView from './components/ArchiveView';
import { VoiceType, ArchiveRecord, ReviewData, PortugueseType } from './types';

type Screen = 'home' | 'call' | 'review' | 'archive';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>(VoiceType.FEMALE);
  const [selectedLang, setSelectedLang] = useState<PortugueseType>(PortugueseType.BRAZIL);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<ArchiveRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('kuromi_archives');
    if (stored) {
      setArchives(JSON.parse(stored));
    }
  }, []);

  const saveArchives = (updated: ArchiveRecord[]) => {
    setArchives(updated);
    localStorage.setItem('kuromi_archives', JSON.stringify(updated));
  };

  const saveToArchive = (record: ArchiveRecord) => {
    saveArchives([record, ...archives]);
  };

  const updateArchiveRecord = (updatedRecord: ArchiveRecord) => {
    const updated = archives.map(a => a.id === updatedRecord.id ? updatedRecord : a);
    saveArchives(updated);
    if (currentSession?.id === updatedRecord.id) {
      setCurrentSession(updatedRecord);
    }
  };

  const toggleFavorite = (id: string) => {
    const record = archives.find(a => a.id === id);
    if (record) {
      updateArchiveRecord({ ...record, isFavorited: !record.isFavorited });
    }
  };

  const startNewCall = () => {
    setCurrentScreen('call');
  };

  const finishCall = (record: ArchiveRecord) => {
    setCurrentSession(record);
    saveToArchive(record);
    setCurrentScreen('review');
  };

  const viewReview = (record: ArchiveRecord) => {
    setCurrentSession(record);
    setCurrentScreen('review');
  };

  return (
    <div className="min-h-screen md:max-w-none max-w-md mx-auto relative overflow-hidden bg-kuromi-black text-white shadow-2xl">
      {currentScreen === 'home' && (
        <Home 
          selectedVoice={selectedVoice} 
          setVoice={setSelectedVoice}
          selectedLang={selectedLang}
          setLang={setSelectedLang}
          onStart={startNewCall}
          onViewArchive={() => setCurrentScreen('archive')}
        />
      )}
      
      {currentScreen === 'call' && (
        <CallView 
          voice={selectedVoice} 
          lang={selectedLang}
          onEnd={finishCall}
          onCancel={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'review' && currentSession && (
        <ReviewView 
          record={currentSession} 
          onBack={() => setCurrentScreen('home')}
          onToggleFavorite={() => toggleFavorite(currentSession.id)}
          onUpdateRecord={updateArchiveRecord}
        />
      )}

      {currentScreen === 'archive' && (
        <ArchiveView 
          archives={archives} 
          onBack={() => setCurrentScreen('home')} 
          onViewReview={viewReview}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default App;
