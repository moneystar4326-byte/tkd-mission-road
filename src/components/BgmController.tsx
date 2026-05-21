import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Upload, Trash2, Volume2, X, SkipForward, SkipBack, Shuffle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface Track {
  id: string;
  name: string;
  url: string;
}

interface BgmControllerProps {
  isSfxEnabled: boolean;
  setIsSfxEnabled: (v: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  playSfx: (type: 'diceRoll' | 'diceResult' | 'tokenMove' | 'missionSuccess' | 'reset' | 'victory') => void;
}

export default function BgmController({ isSfxEnabled, setIsSfxEnabled, sfxVolume, setSfxVolume, playSfx }: BgmControllerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;
    
    return () => {
      audio.pause();
      audioRef.current = null;
      // Cleanup all object URLs when component completely unmounts
      objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];
    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        objectUrls.current.add(url);
        newTracks.push({
          id: crypto.randomUUID(),
          name: file.name,
          url
        });
      }
    });

    if (newTracks.length === 0) {
      alert('오디오 파일만 추가 가능합니다.');
      return;
    }

    setPlaylist(prev => [...prev, ...newTracks]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const playTrack = async (index: number) => {
    const safePlaylist = Array.isArray(playlist) ? playlist : [];
    if (safePlaylist.length === 0) return;
    const safeIndex = Math.max(0, Math.min(index, safePlaylist.length - 1));
    const track = safePlaylist[safeIndex];
    if (!track || !audioRef.current) return;
    
    if (audioRef.current.src !== track.url) {
      audioRef.current.src = track.url;
    }
    
    try {
      await audioRef.current.play().catch(err => {
        console.warn('BGM 자동재생이 차단되었거나 실패했습니다.', err);
      });
      setIsPlaying(true);
      setCurrentTrackIndex(safeIndex);
    } catch (err) {
      console.warn('BGM 재생 오류:', err);
    }
  };

  const handlePlayPause = () => {
    const safePlaylist = Array.isArray(playlist) ? playlist : [];
    if (safePlaylist.length === 0 || !audioRef.current) {
      alert('먼저 음악을 추가해주세요.');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const safeIndex = Math.max(0, Math.min(currentTrackIndex, safePlaylist.length - 1));
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        audioRef.current.src = safePlaylist[safeIndex].url;
      }
      audioRef.current.play().catch(err => console.warn("오디오 재생 실패:", err));
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    const safePlaylist = Array.isArray(playlist) ? playlist : [];
    if (safePlaylist.length === 0) return;
    if (safePlaylist.length === 1) {
      void playTrack(0);
      return;
    }
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * safePlaylist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % safePlaylist.length;
    }
    void playTrack(nextIndex);
  };

  const playPrev = () => {
    const safePlaylist = Array.isArray(playlist) ? playlist : [];
    if (safePlaylist.length === 0) return;
    if (safePlaylist.length === 1) {
      void playTrack(0);
      return;
    }
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = safePlaylist.length - 1;
    void playTrack(prevIndex);
  };

  // Update onEnded handler with latest state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = playNext;
    }
  }); // Runs every render to ensure playNext closure is fresh

  const removeTrack = (trackId: string, trackUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setPlaylist(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const targetIndex = safePrev.findIndex(t => t.id === trackId);
      const newPlaylist = safePrev.filter(t => t.id !== trackId);
      
      try {
        URL.revokeObjectURL(trackUrl);
        objectUrls.current.delete(trackUrl);
      } catch (err) {
        console.warn("ObjectURL cleanup error", err);
      }

      if (newPlaylist.length === 0) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
        setCurrentTrackIndex(0);
      } else if (targetIndex === currentTrackIndex) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        const nextSafeIndex = Math.max(0, Math.min(targetIndex, newPlaylist.length - 1));
        setCurrentTrackIndex(nextSafeIndex);
        if (audioRef.current) {
          audioRef.current.src = newPlaylist[nextSafeIndex].url;
        }
      } else if (targetIndex < currentTrackIndex) {
        setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1));
      }
      
      return newPlaylist;
    });
  };

  const removeAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const safePlaylist = Array.isArray(playlist) ? playlist : [];
    safePlaylist.forEach(t => {
      try {
        URL.revokeObjectURL(t.url);
      } catch (err) {}
    });
    objectUrls.current.clear();
    setPlaylist([]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
  };

  const safePlaylistData = Array.isArray(playlist) ? playlist : [];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
          isPlaying 
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
            : 'bg-slate-800/40 text-slate-300 border-slate-700 hover:bg-slate-700/50 hover:text-white'
        }`}
        title="배경음악 플레이리스트"
      >
        {isPlaying ? <Music className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <Music className="w-3.5 h-3.5" />}
        <span>{isPlaying ? '음악 재생 중' : '음악 설정'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-80 md:w-96 bg-[#0a0f1d] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="p-3 bg-slate-900/80 border-b border-gray-800 flex justify-between items-center shrink-0">
              <h4 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-tkd-gold" /> 배경음악 플레이리스트
              </h4>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              {/* Add Music Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Upload className="w-3.5 h-3.5" /> 음악 추가
              </button>
              <input
                type="file"
                accept="audio/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Now Playing Info */}
              {safePlaylistData.length > 0 && (
                <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 shrink-0">
                  <p className="text-[10px] text-gray-500 font-bold mb-1">현재 재생 중:</p>
                  <p className="text-xs text-tkd-gold truncate font-semibold">
                    {safePlaylistData[Math.max(0, Math.min(currentTrackIndex, safePlaylistData.length - 1))]?.name || '선택된 음악 없음'}
                  </p>
                </div>
              )}

              {/* Playlist */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] text-gray-500 font-bold px-1">플레이리스트:</p>
                {safePlaylistData.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500">등록된 음악이 없습니다.<br/>음악을 추가해주세요.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {safePlaylistData.map((track, idx) => {
                      const isCurrent = idx === currentTrackIndex;
                      return (
                        <div 
                          key={track?.id ?? idx}
                          onClick={() => playTrack(idx)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                            isCurrent 
                              ? 'bg-blue-950/30 border-[#00D4FF]/40 shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                              : 'bg-slate-900/40 border-transparent hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className={`text-[10px] font-mono ${isCurrent ? 'text-[#00D4FF]' : 'text-gray-600'}`}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <span className={`text-xs truncate ${isCurrent ? 'text-tkd-gold font-bold' : 'text-gray-300'}`}>
                              {track.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {isCurrent && <span className="text-[8px] bg-[#00D4FF]/20 text-[#00D4FF] px-1 rounded font-black border border-[#00D4FF]/30">NOW</span>}
                            <button
                              onClick={(e) => removeTrack(track.id, track.url, e)}
                              className="text-gray-600 hover:text-red-400 p-0.5 transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Main Controls */}
              <div className="flex flex-col gap-3 shrink-0 mt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={playPrev}
                    disabled={safePlaylistData.length === 0}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <SkipBack className="w-3.5 h-3.5" /> 이전
                  </button>
                  <button
                    onClick={handlePlayPause}
                    disabled={safePlaylistData.length === 0}
                    className={`flex-[1.5] py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                      safePlaylistData.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isPlaying
                          ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? '일시정지' : '재생'}
                  </button>
                  <button
                    onClick={playNext}
                    disabled={safePlaylistData.length === 0}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    다음 <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Secondary Controls (Shuffle + Volume) */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded ${
                      isShuffle ? 'text-tkd-gold bg-tkd-gold/10' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Shuffle className="w-3 h-3" /> 셔플 {isShuffle ? 'ON' : 'OFF'}
                  </button>
                  
                  <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                    <Volume2 className="w-3 h-3 text-gray-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-tkd-gold"
                    />
                    <span className="text-[9px] text-gray-400 font-mono w-6 text-right">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>

                {/* SFX Settings Panel */}
                <div className="flex flex-col gap-2 bg-slate-900/30 p-2 rounded-lg border border-slate-800/80 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400">게임 효과음</span>
                    <button
                      onClick={() => setIsSfxEnabled(!isSfxEnabled)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors ${
                        isSfxEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {isSfxEnabled ? '🔊 효과음 ON' : '🔇 효과음 OFF'}
                    </button>
                  </div>
                  
                  {isSfxEnabled && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 w-10">볼륨 {Math.round(sfxVolume * 100)}%</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={sfxVolume}
                          onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                          className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <button
                        onClick={() => playSfx('diceRoll')}
                        className="w-full py-1 bg-slate-800/50 hover:bg-slate-700 text-[10px] font-bold text-gray-400 rounded transition-colors"
                      >
                        효과음 테스트
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear All */}
              {safePlaylistData.length > 0 && (
                <button
                  onClick={removeAll}
                  className="w-full mt-1 py-1.5 text-[10px] font-bold text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center justify-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3 h-3" /> 전체 음악 제거
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
