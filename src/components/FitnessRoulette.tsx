import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Play, ArrowLeft, Trophy, CheckCircle, ShieldCheck, Settings, X, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface FitnessMission {
  id: string;
  title: string;
  description: string;
  coachMessage: string;
}

const defaultFitnessMissions: FitnessMission[] = [
  { id: "squat", title: "스쿼트 15개", description: "하체 힘과 버티는 힘을 기르는 미션입니다.", coachMessage: "정확한 자세로 끝까지 해내는 힘을 보여주세요." },
  { id: "jumpingjack", title: "점핑잭 30개", description: "몸을 크게 움직이며 심박수를 올리는 미션입니다.", coachMessage: "팔과 다리를 크게 움직이며 힘차게 시작해봅시다." },
  { id: "burpee", title: "버피 5개", description: "전신 체력을 기르는 고강도 미션입니다.", coachMessage: "힘들어도 끝까지 해내는 친구가 진짜 강한 친구입니다." },
  { id: "plank", title: "플랭크 30초", description: "코어 힘과 집중력을 기르는 미션입니다.", coachMessage: "흔들리지 않고 버티는 힘을 보여주세요." },
  { id: "mountain", title: "마운틴 클라이머 20개", description: "순발력과 체력을 함께 키우는 미션입니다.", coachMessage: "빠르게 움직이되 자세는 무너지지 않게 해봅시다." },
  { id: "pushup", title: "팔굽혀펴기 5개", description: "상체 힘과 버티는 힘을 기르는 미션입니다.", coachMessage: "천천히 정확하게 내려가고 올라옵니다." },
  { id: "jump", title: "제자리 점프 20개", description: "하체 탄력과 리듬감을 키우는 미션입니다.", coachMessage: "가볍게 뛰되 끝까지 포기하지 않습니다." },
  { id: "run", title: "왕복달리기 1회", description: "순발력과 방향 전환 능력을 기르는 미션입니다.", coachMessage: "출발 신호에 집중하고 끝까지 달려봅니다." }
];

interface FitnessRouletteProps {
  onBack: () => void;
  playSfx?: (type: 'diceRoll' | 'diceResult' | 'tokenMove' | 'missionSuccess' | 'reset' | 'victory') => Promise<void>;
}

export default function FitnessRoulette({ onBack, playSfx }: FitnessRouletteProps) {
  const [rouletteMissions, setRouletteMissions] = useState<FitnessMission[]>(defaultFitnessMissions);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedMission, setSelectedMission] = useState<FitnessMission | null>(null);
  const [history, setHistory] = useState<{ id: string; time: string; mission: FitnessMission }[]>([]);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempMissions, setTempMissions] = useState<FitnessMission[]>(defaultFitnessMissions);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedMission(null);
    
    try {
      void playSfx?.('diceRoll');

      // Randomly select a mission
      const targetIndex = Math.floor(Math.random() * rouletteMissions.length);
      const mission = rouletteMissions[targetIndex];

      // Calculate rotation to stop at the specific slice
      const sliceAngle = 360 / rouletteMissions.length;
      
      // Calculate the exact angle where the center of the target slice is located
      const targetAngle = (targetIndex * sliceAngle) + (sliceAngle / 2);
      
      // Determine how many full 360 spins we've done so far to ensure it keeps rotating forward
      const currentFullSpins = Math.floor(rotation / 360);
      const spins = 5;
      const baseRotation = (currentFullSpins + spins) * 360;
      
      // Add a small random offset within the slice to make it feel natural, but stay safely inside
      const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.7);
      
      // Calculate the exact next rotation required
      const nextRotation = baseRotation + (360 - targetAngle) + randomOffset;
      
      setRotation(nextRotation);

      setTimeout(() => {
        try {
          setSelectedMission(mission);
          void playSfx?.('diceResult');
        } catch (innerError) {
          console.error("Roulette result failed safely:", innerError);
        } finally {
          setIsSpinning(false);
        }
      }, 10000);
    } catch (error) {
      console.error("Roulette spin failed safely:", error);
      setIsSpinning(false);
    }
  };

  const handleMissionComplete = () => {
    try {
      if (!selectedMission) return;
      void playSfx?.('missionSuccess');

      const time = new Date();
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      setHistory(prev => [
        { id: Math.random().toString(), time: timeStr, mission: selectedMission },
        ...prev
      ].slice(0, 5)); // Keep only last 5
      
      setSelectedMission(null);
    } catch (error) {
      console.error("Mission complete failed safely:", error);
    }
  };

  // Settings Handlers
  const handleOpenSettings = () => {
    setTempMissions([...rouletteMissions]);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    const hasEmpty = tempMissions.some(m => !m.title || m.title.trim() === '');
    if (hasEmpty) {
      alert("비어 있는 미션이 있습니다. 모든 미션을 입력해주세요.");
      return;
    }

    const updated = tempMissions.map(m => ({
      ...m,
      title: m.title.trim(),
      description: m.description || "오늘 선택된 체력 미션입니다. 정확한 자세로 안전하게 수행해보세요.",
      coachMessage: m.coachMessage || "끝까지 포기하지 않고 도전하는 모습을 보여주세요."
    }));

    setRouletteMissions(updated);
    setIsSettingsOpen(false);
    void playSfx?.('missionSuccess');
    
    // If the currently selected mission was modified, update its card display
    if (selectedMission) {
      const updatedCurrent = updated.find(u => u.id === selectedMission.id);
      if (updatedCurrent) {
        setSelectedMission(updatedCurrent);
      }
    }
  };

  const handleResetSettings = () => {
    setTempMissions([...defaultFitnessMissions]);
    setRouletteMissions([...defaultFitnessMissions]);
    setIsSettingsOpen(false);
    void playSfx?.('reset');
    
    if (selectedMission) {
      const defaultMatch = defaultFitnessMissions.find(d => d.id === selectedMission.id);
      if (defaultMatch) setSelectedMission(defaultMatch);
    }
  };

  const updateTempMission = (index: number, newTitle: string) => {
    const arr = [...tempMissions];
    arr[index] = { ...arr[index], title: newTitle.substring(0, 20) };
    setTempMissions(arr);
  };

  const handleAddMission = () => {
    if (tempMissions.length >= 30) {
      alert("미션은 최대 30개까지 추가할 수 있습니다.");
      return;
    }
    setTempMissions([...tempMissions, { id: `m-${Date.now()}`, title: "", description: "", coachMessage: "" }]);
  };

  const handleRemoveMission = (idToRemove: string) => {
    if (tempMissions.length <= 2) {
      alert("미션은 최소 2개 이상 필요합니다.");
      return;
    }
    setTempMissions(tempMissions.filter(m => m.id !== idToRemove));
  };

  // Safe fallback if data is somehow empty
  const safeMissions = rouletteMissions.length > 0 ? rouletteMissions : [
    { id: "fallback", title: "기본 미션", description: "미션 데이터를 불러오지 못했습니다.", coachMessage: "화이팅!" }
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 relative selection:bg-blue-500/30">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-10 relative z-10 bg-slate-900/40 p-4 md:p-6 rounded-2xl border border-slate-800/60 backdrop-blur-sm shadow-xl">
        <div>
          <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-widest flex items-center gap-3">
            <RefreshCw className={`w-8 h-8 md:w-12 md:h-12 text-blue-400 ${isSpinning ? 'animate-spin' : ''}`} />
            체력 룰렛
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-sm md:text-lg">오늘의 체력 미션을 룰렛으로 뽑아보세요!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenSettings}
            className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold transition-all flex items-center gap-2 border border-amber-500/30 shadow-md whitespace-nowrap"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden md:inline">미션 설정</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-md whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden md:inline">허브로 돌아가기</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">
        
        {/* Roulette Area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative w-full max-w-[400px] aspect-square flex items-center justify-center">
            
            {/* Pointer */}
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 w-10 h-12 z-20 pointer-events-none drop-shadow-2xl flex flex-col items-center">
              <div className="w-8 h-8 bg-gradient-to-b from-tkd-energy to-red-600 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)] border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-600 -mt-1" />
            </div>

            {/* Wheel */}
            <div 
              className="w-full h-full rounded-full border-8 border-slate-800 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden bg-slate-900 transition-transform duration-[10000ms] ease-[cubic-bezier(0.12,0.82,0.22,1)]"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {safeMissions.map((mission, idx) => {
                const total = safeMissions.length;
                const sliceAngle = 360 / total;
                const sliceCenterAngle = idx * sliceAngle + sliceAngle / 2;
                
                let fontSize = 'text-xs md:text-sm';
                let maxWidth = 'max-w-[120px]';
                let padding = 'pt-8 px-4';
                
                if (total > 8 && total <= 12) {
                  fontSize = 'text-[11px] md:text-xs';
                  maxWidth = 'max-w-[100px]';
                  padding = 'pt-6 px-3';
                } else if (total > 12 && total <= 20) {
                  fontSize = 'text-[10px] md:text-[11px]';
                  maxWidth = 'max-w-[70px]';
                  padding = 'pt-5 px-2';
                } else if (total > 20) {
                  fontSize = 'text-[9px] md:text-[10px]';
                  maxWidth = 'max-w-[50px]';
                  padding = 'pt-4 px-1';
                }
                
                return (
                  <div 
                    key={mission.id}
                    className="absolute inset-0 flex items-start justify-center origin-center"
                    style={{
                      transform: `rotate(${sliceCenterAngle}deg)`,
                    }}
                  >
                    <div className={`${padding} text-center font-bold text-gray-200 tracking-wider font-display ${maxWidth} break-keep leading-tight ${fontSize}`}>
                      {mission.title}
                    </div>
                  </div>
                );
              })}
              
              {/* Actual slice backgrounds using conic gradient */}
              <div className="absolute inset-0 z-[-1]" style={{
                background: `conic-gradient(from 0deg, ${safeMissions.map((_, i) => {
                  const start = i * (360 / safeMissions.length);
                  const end = (i + 1) * (360 / safeMissions.length);
                  const color = i % 2 === 0 ? '#1e293b' : '#0f172a'; // slate-800 vs slate-900
                  return `${color} ${start}deg ${end}deg`;
                }).join(', ')})`
              }} />
              
              {/* Inner Circle / Hub */}
              <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-700 shadow-inner flex items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tkd-gold to-yellow-600 flex items-center justify-center shadow-lg shadow-tkd-gold/20">
                  <span className="font-display font-black text-slate-900 text-sm">SPIN</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || !!selectedMission}
            className={`mt-12 md:mt-16 w-full max-w-md py-4 md:py-5 rounded-2xl font-display font-black text-xl tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
              isSpinning || selectedMission
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400 shadow-blue-900/50 cursor-pointer'
            }`}
          >
            {isSpinning ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
            {isSpinning ? '두구두구... 결과를 기다려주세요!' : '룰렛 돌리기'}
          </button>
        </div>

        {/* Mission Card & History Area */}
        <div className="flex-1 flex flex-col gap-6 w-full max-w-xl mx-auto lg:mx-0">
          
          {/* Current Mission Card */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-6 md:p-8 rounded-3xl border border-gray-800 shadow-2xl min-h-[300px] flex flex-col relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-sm font-black tracking-widest text-tkd-gold uppercase mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              MISSION SELECTED
            </h2>

            <AnimatePresence mode="wait">
              {selectedMission ? (
                <motion.div
                  key="mission-active"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="flex-1 flex flex-col items-center justify-center text-center mt-2"
                >
                  <h3 className="text-5xl md:text-6xl font-black font-display text-white mb-auto mt-4 drop-shadow-lg break-keep leading-tight">
                    {selectedMission.title}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
                    <button
                      onClick={handleMissionComplete}
                      className="flex-1 py-4 rounded-xl bg-tkd-energy hover:bg-emerald-400 text-slate-900 font-black text-lg shadow-lg shadow-tkd-energy/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-6 h-6" />
                      미션 완료
                    </button>
                    <button
                      onClick={() => setSelectedMission(null)}
                      className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 font-black text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <RefreshCw className="w-5 h-5" />
                      다시 돌리기
                    </button>
                  </div>
                </motion.div>
              ) : isSpinning ? (
                <motion.div
                  key="mission-spinning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center opacity-90"
                >
                  <RefreshCw className="w-16 h-16 text-blue-500 mb-6 animate-spin" />
                  <p className="text-2xl md:text-3xl font-black font-display text-blue-400 animate-pulse tracking-widest">오늘의 미션을 뽑는 중...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="mission-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center opacity-50"
                >
                  <Trophy className="w-16 h-16 text-slate-700 mb-4" />
                  <p className="text-xl font-bold text-slate-500">룰렛을 돌려 미션을 뽑아주세요</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400">최근 완료 기록</h3>
              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-tkd-gold">
                총 {history.length}회 완료
              </span>
            </div>
            
            {history.length > 0 ? (
              <ul className="space-y-3">
                <AnimatePresence>
                  {history.map((item, index) => (
                    <motion.li 
                      key={item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-tkd-energy/20 text-tkd-energy flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="font-bold text-gray-200">{item.mission.title}</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500">{item.time}</span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div className="text-center py-6 text-slate-600 text-sm font-medium">
                아직 완료된 미션이 없습니다.
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black font-display tracking-widest text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-tkd-gold" />
                    체력 룰렛 미션 설정
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">오늘 수업에 맞게 룰렛 미션을 직접 수정할 수 있습니다.</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {tempMissions.map((mission, index) => (
                  <div key={mission.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-gray-400 shrink-0">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={mission.title}
                      onChange={(e) => updateTempMission(index, e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-tkd-gold focus:ring-1 focus:ring-tkd-gold transition-colors font-medium"
                      placeholder={`${index + 1}번 미션을 입력하세요`}
                    />
                    <button
                      onClick={() => handleRemoveMission(mission.id)}
                      className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0 border border-red-500/20"
                      title="미션 삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                {tempMissions.length < 30 && (
                  <button
                    onClick={handleAddMission}
                    className="w-full py-4 mt-2 rounded-xl border-2 border-dashed border-slate-700 hover:border-tkd-gold hover:bg-tkd-gold/5 text-slate-400 hover:text-tkd-gold transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    미션 추가하기 ({tempMissions.length}/30)
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-3.5 bg-tkd-energy hover:bg-emerald-400 text-slate-900 font-black rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  저장하기
                </button>
                <button
                  onClick={handleResetSettings}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl border border-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  기본값으로 되돌리기
                </button>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-gray-400 font-bold rounded-xl border border-slate-800 transition-all active:scale-[0.98]"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
