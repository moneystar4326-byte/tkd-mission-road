import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Sparkles, Trophy, Settings, RefreshCw, Swords, 
  ChevronRight, ArrowRight, RotateCcw, AlertTriangle, ShieldCheck, 
  Users, Info, Flame, Eye, EyeOff, Dices, Home
} from 'lucide-react';
import { 
  Team, GameState, DiceResult, GameHistoryEntry, 
  DEFAULT_MISSIONS, DICE_DETAILS, MissionData
} from './types';
import Board from './components/Board';
import DiceRoller from './components/DiceRoller';
import MissionInput from './components/MissionInput';
import HistoryLog from './components/HistoryLog';
import BgmController from './components/BgmController';
import TeamNameEditor from './components/TeamNameEditor';
import GameHub from './components/GameHub';
import FitnessRoulette from './components/FitnessRoulette';

const safeParse = (value: string | null, fallback: any) => {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    console.warn("Invalid saved data. Using fallback.", error);
    return fallback;
  }
};

const normalizeMissions = (missions: any) => {
  if (!Array.isArray(missions) || missions.length === 0) {
    return [...DEFAULT_MISSIONS];
  }

  return missions.map((mission: any, index: number) => ({
    id: mission?.id ?? index + 1,
    title: mission?.title ?? mission?.name ?? "미션 준비 중",
    type: mission?.type ?? "mission"
  }));
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("ErrorBoundary caught an error", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">앱 실행 중 오류가 발생했습니다.</h1>
          <p className="text-gray-400 mb-6">일시적인 오류이거나 사운드 재생 중 문제가 발생했을 수 있습니다.</p>
          <button onClick={() => {
            try {
              Object.keys(localStorage).forEach((key) => {
                if (
                  key.includes("tkd") ||
                  key.includes("mission") ||
                  key.includes("roulette") ||
                  key.includes("history") ||
                  key.includes("fitness")
                ) {
                  localStorage.removeItem(key);
                }
              });
            } catch (error) {
              console.warn("Storage reset failed:", error);
            }
            window.location.href = "/";
          }} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors">
            게임 초기화 / 다시 시작
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // Navigation State
  const [gameState, setGameState] = useState<GameState>('HOME');

  // Dynamic Team Names
  const [teamNames, setTeamNames] = useState<Record<Team, string>>({ HONG: '홍팀', CHEONG: '청팀' });
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // SFX State
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const [sfxVolume, setSfxVolume] = useState(0.6);

  const playSfx = async (type: 'diceRoll' | 'diceResult' | 'tokenMove' | 'missionSuccess' | 'reset' | 'victory') => {
    if (!isSfxEnabled) return;

    const soundMap = {
      diceRoll: "/sounds/dice-roll.wav",
      diceResult: "/sounds/dice-result.wav",
      tokenMove: "/sounds/token-move.wav",
      missionSuccess: "/sounds/mission-success.wav",
      reset: "/sounds/reset.wav",
      victory: "/sounds/victory.wav"
    };

    const src = soundMap[type];
    if (!src) return;

    try {
      const audio = new Audio(src);
      audio.volume = sfxVolume ?? 0.6;
      audio.currentTime = 0;
      await audio.play();
      console.info("SFX play success:", type, src);
    } catch (error) {
      console.warn("SFX playback failed:", type, src, error);
    }
  };

  // Mission list (20 cells)
  const [missions, setMissions] = useState<MissionData[]>(() => {
    try {
      const saved = localStorage.getItem('tkd_missions');
      const parsed = safeParse(saved, DEFAULT_MISSIONS);
      if (!Array.isArray(parsed)) return [...DEFAULT_MISSIONS];
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        // legacy map
        return parsed.map((m: string, i: number) => ({
          id: i + 1,
          title: m,
          type: m.startsWith('쉼터') || m.startsWith('REST') ? 'rest' : (i === 19 ? 'goal' : 'mission')
        }));
      }
      return normalizeMissions(parsed);
    } catch (error) {
      console.warn("Saved state load failed. Resetting to defaults.", error);
      localStorage.removeItem("tkd_missions");
      return [...DEFAULT_MISSIONS];
    }
  });

  // Game Engine State
  const [hongPosition, setHongPosition] = useState<number>(0); // 0 = start, 1-20 = board cells
  const [cheongPosition, setCheongPosition] = useState<number>(0);
  const [currentTurn, setCurrentTurn] = useState<Team>('HONG');
  const [startingTeam, setStartingTeam] = useState<Team>('HONG');
  const [winner, setWinner] = useState<Team | null>(null);

  // Administrative / Helper options
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminTargetTeam, setAdminTargetTeam] = useState<Team>('HONG');

  // Active Throw feedback state
  const [currentRoll, setCurrentRoll] = useState<DiceResult | null>(null);
  const [isRollPending, setIsRollPending] = useState<boolean>(false); // while rolling
  const [isMoving, setIsMoving] = useState<boolean>(false); // token moving step-by-step
  const [movingStep, setMovingStep] = useState<number>(0);
  const [isMissionActive, setIsMissionActive] = useState<boolean>(false); // lands on cell, waiting for complete
  const [isMissionCompleted, setIsMissionCompleted] = useState<boolean>(false); // complete click triggered

  // Roll Extra (Bonus) tracker
  const [hasBonusThrow, setHasBonusThrow] = useState<boolean>(false);

  // Capture message state
  const [captureMessage, setCaptureMessage] = useState<string>("");

  // Ledger history log
  const [historyLogs, setHistoryLogs] = useState<GameHistoryEntry[]>([]);

  // Helper trigger - auto load defaults or start
  const handleSaveMissions = (updatedMissions: MissionData[]) => {
    setMissions(updatedMissions);
    localStorage.setItem('tkd_missions', JSON.stringify(updatedMissions));
    // Reset positions and go straight to game
    handleRestartAll();
    setGameState('GAME');
  };

  const handleStartRightAway = () => {
    // Start with whatever missions are loaded (defaults by standard)
    handleRestartAll();
    setGameState('GAME');
  };

  const handleRestartAll = () => {
    setHongPosition(0);
    setCheongPosition(0);
    setCurrentTurn(startingTeam);
    setWinner(null);
    setCurrentRoll(null);
    setIsMissionActive(false);
    setIsMissionCompleted(false);
    setIsMoving(false);
    setMovingStep(0);
    setHasBonusThrow(false);
    setCaptureMessage("");
    setHistoryLogs([]);
    playSfx('reset');
  };

  const handleSelectStartingTeam = (team: Team) => {
    setStartingTeam(team);
    setCurrentTurn(team);
    void playSfx('missionSuccess');
  };

  // Turn management flow
  const handleDiceRollResult = async (result: DiceResult) => {
    try {
      const steps = DICE_DETAILS[result]?.steps ?? 0;
      if (steps === 0) {
        setIsRollPending(false);
        return;
      }
      
      const activeTeam = currentTurn ?? 'HONG';
      const startPos = activeTeam === 'HONG' ? (hongPosition ?? 0) : (cheongPosition ?? 0);
      
      setIsRollPending(false);
      setCurrentRoll(result);
      void playSfx('diceResult');
      
      setIsMoving(true);
      setMovingStep(0);
      
      let currentPosition = startPos;
      
      // Step by step movement
      for (let step = 1; step <= steps; step++) {
        await new Promise(resolve => setTimeout(resolve, 450));
        
        currentPosition += 1;
        if (currentPosition > 20) {
          currentPosition = 20;
        }
        
        if (activeTeam === 'HONG') {
          setHongPosition(currentPosition);
        } else {
          setCheongPosition(currentPosition);
        }
        
        setMovingStep(step);
        void playSfx('tokenMove');
        
        if (currentPosition === 20) break;
      }
      
      setIsMoving(false);

      // Check if team passed cell 20 (WIN immediately)
      if (currentPosition >= 20) {
        // Log victory jump
        logHistory(activeTeam, result, steps, startPos, 20, "최종 골인 점령! 무등 수련 대승리!");
        
        // Delay slightly for dramatic epic score
        setTimeout(() => {
          setWinner(activeTeam);
          setGameState('WIN');
          void playSfx('victory');
        }, 800);
        return;
      }

      // Checking bonus criteria
      const isBonus = result === 6;
      setHasBonusThrow(isBonus);

      // Trigger mission card
      setIsMissionActive(true);
      setIsMissionCompleted(false);
      
      const safeMissions = Array.isArray(missions) ? missions : DEFAULT_MISSIONS;
      const safeMissionData = safeMissions?.[currentPosition - 1];
      const safeMission = safeMissionData?.title ?? "미션 준비 중";

      // Check capture logic
      let capturedTeamName = undefined;
      let captureMsg = "";
      if (currentPosition > 0 && currentPosition < 20) {
        if (activeTeam === 'HONG' && cheongPosition === currentPosition) {
          setCheongPosition(0);
          capturedTeamName = teamNames.CHEONG;
          captureMsg = `${teamNames.HONG}이(가) ${teamNames.CHEONG}을(를) 잡았습니다!`;
          setCaptureMessage(captureMsg);
          void playSfx('missionSuccess');
        } else if (activeTeam === 'CHEONG' && hongPosition === currentPosition) {
          setHongPosition(0);
          capturedTeamName = teamNames.HONG;
          captureMsg = `${teamNames.CHEONG}이(가) ${teamNames.HONG}을(를) 잡았습니다!`;
          setCaptureMessage(captureMsg);
          void playSfx('missionSuccess');
        } else {
          setCaptureMessage("");
        }
      } else {
        setCaptureMessage("");
      }

      logHistory(activeTeam, result, steps, startPos, currentPosition, safeMission, capturedTeamName, captureMsg);

    } catch (error) {
      console.error("dice roll failed safely:", error);
      setIsRollPending(false);
      setIsMoving(false);
    }
  };

  const switchTurn = () => {
    setCurrentTurn(prev => prev === 'HONG' ? 'CHEONG' : 'HONG');
  };

  const handleMissionCompleted = () => {
    try {
      if (!currentRoll) return;
      
      void playSfx('missionSuccess');
      
      // Log work
      const activeTeam = currentTurn ?? 'HONG';
      const currentPos = activeTeam === 'HONG' ? (hongPosition ?? 0) : (cheongPosition ?? 0);
      
      // If landed exactly on 20, they must complete the mission. Once completed, they win!
      if (currentPos >= 20) {
        setTimeout(() => {
          setWinner(activeTeam);
          setGameState('WIN');
          void playSfx('victory');
        }, 700);
        return;
      }

      setIsMissionActive(false);
      setIsMissionCompleted(false);
      setCurrentRoll(null);
      setHasBonusThrow(false);
      switchTurn();
    } catch (error) {
      console.warn("mission update failed safely:", error);
    }
  };

  const logHistory = (team: Team, roll: DiceResult, steps: number, from: number, to: number, missionName: string, capturedTeamName?: string, captureMessage?: string) => {
    const time = new Date();
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    
    const entry: GameHistoryEntry = {
      team,
      roll,
      steps,
      from,
      to,
      missionName,
      timestamp: timeStr,
      capturedTeamName,
      captureMessage
    };
    
    setHistoryLogs(prev => [entry, ...prev]);
  };

  // Administrative clickable positions trigger on Board
  const handleAdminSetPosition = (id: number) => {
    if (!isAdminMode) return;
    if (adminTargetTeam === 'HONG') {
      setHongPosition(id);
    } else {
      setCheongPosition(id);
    }
    // Log admin intervention
    logHistory(
      adminTargetTeam, 
      6, 
      0, 
      0, 
      id, 
      `🥋 [지도교사 개입] 말을 CELL ${id}으로 강제 배치하였습니다.`
    );
  };

  return (
    <div className="min-h-screen bg-tkd-navy text-gray-100 flex flex-col justify-between selection:bg-tkd-energy selection:text-tkd-navy font-sans relative">
      {/* Immersive UI top decorative brand gradient line */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-red-600 via-[#D4AF37] to-blue-600 z-55 pointer-events-none" />
      
      {/* GLOBAL HEADER */}
      <header className="border-b border-gray-800/80 bg-tkd-dark/90 sticky top-0 z-50 backdrop-blur-md px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-tkd-gold via-yellow-500 to-amber-600 p-0.5 shadow-lg shadow-amber-950/20">
            <div className="w-full h-full bg-[#020617] rounded-lg flex items-center justify-center font-display font-black text-tkd-gold text-sm tracking-tighter">
              TKD
            </div>
          </div>
          <div className="flex-shrink-0">
            {(gameState === 'HOME' || gameState === 'HUB') ? (
              <>
                <h1 className="text-base sm:text-lg font-black font-display tracking-widest text-white flex items-center gap-1.5 whitespace-nowrap">
                  태권스토리 게임천국
                </h1>
                <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block whitespace-nowrap">TAEKWON STORY GAME HEAVEN</p>
              </>
            ) : (
              <>
                <h1 className="text-base sm:text-lg font-black font-display tracking-widest text-white flex items-center gap-1.5 whitespace-nowrap">
                  TKD MISSION ROAD <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">PRO</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:block whitespace-nowrap">태권도 수업을 게임처럼 바꾸는 프리미엄 주사위 미션 보드게임</p>
              </>
            )}
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setGameState('HOME')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20 hover:text-blue-200"
            title="앱의 첫 화면으로 이동합니다"
          >
            <Home className="w-3.5 h-3.5" />
            <span>홈으로</span>
          </button>

          <button
            onClick={() => setGameState('HUB')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-200"
            title="게임 허브로 이동합니다"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>게임 허브</span>
          </button>

          {gameState === 'GAME' && (
            <>
              <button
                onClick={() => setGameState('MISSION_INPUT')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300"
                title="체력 미션을 커스텀합니다"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>미션 설정</span>
              </button>
              
              <button
                onClick={() => {
                  if (confirm("현재 게임을 초기화하시겠습니까?")) {
                    handleRestartAll();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:text-red-300"
                title="모든 미션과 훈련 기록을 초기화합니다"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>게임 초기화</span>
              </button>
            </>
          )}

          {/* Music Settings Panel */}
          <BgmController 
            isSfxEnabled={isSfxEnabled}
            setIsSfxEnabled={setIsSfxEnabled}
            sfxVolume={sfxVolume}
            setSfxVolume={setSfxVolume}
            playSfx={playSfx}
          />

          {gameState === 'GAME' && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isAdminMode 
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' 
                  : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:border-slate-850'
              }`}
              title="도장 관장님 특별 개입 모드"
            >
              {isAdminMode ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{isAdminMode ? '관장 모드 작동중' : '관장 수동모드'}</span>
            </button>
          )}
        </div>
      </header>

      {/* CORE CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col justify-center select-none relative pb-4 pt-4">
        
        <AnimatePresence mode="wait">
          
          {/* 1. HOME SCREEN */}
          {gameState === 'HOME' && (
            <motion.div
              key="screen-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto text-center px-6 py-12 flex flex-col items-center"
            >
              {/* Animated Giant Badge */}
              <motion.div 
                animate={{ rotateY: [0, 180, 360] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-tkd-gold via-amber-400 to-yellow-600 p-1 shadow-2xl shadow-yellow-500/10 mb-8 relative"
              >
                <div className="w-full h-full bg-[#020617] rounded-full flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <Dices className="w-10 h-10 text-tkd-gold animate-pulse mb-1" />
                  <span className="font-display font-black text-[10px] tracking-widest text-gray-300">DICE</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-tkd-energy/10 text-tkd-energy border border-tkd-energy/30 mb-4 font-display whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 text-tkd-energy animate-bounce shrink-0" />
                  PREMIUM MARTIAL ARTS EDUCATION GAME
                </span>
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black font-display text-white tracking-widest leading-[1.1] drop-shadow-xl break-keep break-words w-full">
                  태권스토리 게임천국
                </h2>
                <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-300 font-medium mt-4 max-w-2xl mx-auto leading-relaxed break-keep break-words">
                  태권도 수업을 게임처럼 바꾸는 프리미엄 수업 미니게임 플랫폼
                </p>
                <p className="text-sm text-gray-400 max-w-md mx-auto mt-3 leading-relaxed break-keep break-words">
                  체력훈련, 발차기, 품새, 줄넘기, 인성교육까지 빔프로젝터로 바로 진행하는 수업용 게임 콘텐츠
                </p>
              </motion.div>

              {/* Action Buttons Box */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-xl mx-auto">
                <button
                  onClick={() => setGameState('HUB')}
                  id="btn-enter-hub"
                  className="flex-1 py-4 px-6 min-w-[240px] whitespace-nowrap rounded-xl font-display font-black text-base md:text-lg tracking-wider bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-xl shadow-indigo-950/40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  게임천국 입장하기
                </button>
                <button
                  onClick={handleStartRightAway}
                  id="btn-direct-start"
                  className="flex-1 py-4 px-6 min-w-[240px] whitespace-nowrap rounded-xl font-display font-black text-base md:text-lg tracking-wider bg-slate-950 hover:bg-slate-900 text-tkd-gold border border-tkd-gold/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Dices className="w-5 h-5 shrink-0 text-tkd-gold animate-bounce" />
                  대표 게임 바로 시작
                </button>
              </div>

              {/* Home mini info logs preview */}
              <div className="mt-12 p-4 bg-tkd-dark/40 border border-gray-800 rounded-xl max-w-2xl mx-auto w-full flex items-start gap-3 text-left">
                <Info className="w-6 h-6 text-tkd-energy shrink-0 mt-0.5" />
                <div className="text-xs text-gray-400 leading-relaxed break-keep break-words w-full">
                  <span className="font-bold text-gray-200">수업 진행 팁:</span> 넓은 수련관 빔프로젝터나 태블릿 PC를 세워 놓고 진행하면 참관하시는 학부모님께 철저한 미션 체력 교사 프로그램을 직관적으로 어필할 수 있습니다.
                </div>
              </div>
            </motion.div>
          )}

          {/* 1.5 HUB SCREEN */}
          {gameState === 'HUB' && (
            <motion.div
              key="screen-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex-1 flex flex-col items-center justify-start py-8 h-full min-h-[70vh]"
            >
              <GameHub onStartGame={(id) => {
                if (id === 'mission-road') {
                  handleStartRightAway();
                } else if (id === 'fitness-roulette') {
                  setGameState('FITNESS_ROULETTE');
                }
              }} />
            </motion.div>
          )}

          {/* 1.6 FITNESS ROULETTE SCREEN */}
          {gameState === 'FITNESS_ROULETTE' && (
            <motion.div
              key="screen-fitness"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex-1 flex flex-col h-full"
            >
              <FitnessRoulette 
                onBack={() => setGameState('HUB')} 
                playSfx={playSfx as any} 
              />
            </motion.div>
          )}

          {/* 2. MISSION CONFIG SCREEN */}
          {gameState === 'MISSION_INPUT' && (
            <motion.div
              key="screen-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MissionInput 
                initialMissions={missions}
                onSave={handleSaveMissions}
                onBack={() => setGameState('HOME')}
              />
            </motion.div>
          )}

          {/* 3. GAME RUNTIME DASHBOARD */}
          {gameState === 'GAME' && (
            <motion.div
              key="screen-game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 pt-16 pb-6"
            >
              {/* Admin Quick Options alert box */}
              {isAdminMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/20 max-w-xl mx-auto rounded-xl p-3.5 mb-5 flex flex-col gap-2 text-red-300 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-bold font-display uppercase tracking-widest text-[11px]">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    관장님 직접 조작 패널 (아레나 치트 도구)
                  </div>
                  <p className="text-gray-400 leading-tight">
                    현장에서 불가피한 사정(넘어짐, 대결 결과 재조정) 발생시 아래 셀렉터를 사용하세요. 보드판 위의 임의의 칸을 터치하면 해당 팀의 말이 그 칸으로 순간 이동합니다.
                  </p>
                  <div className="flex items-center gap-3 border-t border-red-950/50 pt-2 mt-1">
                    <span className="font-bold text-gray-300">조종 목표 팀:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="admin-target-team"
                        checked={adminTargetTeam === 'HONG'}
                        onChange={() => setAdminTargetTeam('HONG')}
                        className="text-red-500 focus:ring-red-500 bg-slate-900 border-slate-800"
                      />
                      <span className={`px-1.5 py-0.5 rounded ${adminTargetTeam === 'HONG' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-gray-500'}`}>홍팀말</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="admin-target-team"
                        checked={adminTargetTeam === 'CHEONG'}
                        onChange={() => setAdminTargetTeam('CHEONG')}
                        className="text-blue-500 focus:ring-blue-500 bg-slate-900 border-slate-800"
                      />
                      <span className={`px-1.5 py-0.5 rounded ${adminTargetTeam === 'CHEONG' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-gray-500'}`}>청팀말</span>
                    </label>

                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => {
                          if (adminTargetTeam === 'HONG') setHongPosition(0);
                          else setCheongPosition(0);
                        }}
                        className="bg-[#020617] border border-slate-800 hover:bg-slate-900 px-2.5 py-1 rounded text-[10px]"
                      >
                        대기실 무효 복귀
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* THREE COLUMN GRID LAYOUT (Board, Dice, Mission) */}
              <div className="flex flex-col lg:grid lg:grid-cols-[46%_31%_23%] gap-4 xl:gap-6 items-start">
                
                {/* COLUMN 1: BATTLE GRID ARENA (46%) */}
                <div className="w-full flex flex-col items-center">
                  
                  {/* Quick HUD for Positions (Hong vs Cheong status banner) & Starting Team Selection */}
                  <div className="w-full max-w-xl flex flex-col gap-2 mb-4.5">
                    {/* Race Status Banner */}
                    <div className="bg-tkd-dark/60 border border-gray-800/80 p-3 rounded-2xl flex justify-between items-center px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-tkd-energy" />
                          <span className="text-xs font-bold text-gray-300">레이스 현황판</span>
                        </div>
                        <button
                          onClick={() => setIsTeamModalOpen(true)}
                          className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-2 py-1 rounded text-[10px] font-bold border border-slate-700 transition-colors flex items-center gap-1"
                        >
                          ✏️ 팀명 수정
                        </button>
                      </div>

                      <div className="flex items-center gap-6 text-sm font-bold font-mono">
                        {/* Hong indicators */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-950" />
                          <span className="text-red-400 font-bold max-w-[80px] truncate">{teamNames.HONG}</span>
                          <span className="text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800 animate-pulse">
                            {hongPosition === 0 ? '대기' : `${hongPosition}번`}
                          </span>
                        </div>

                        <div className="text-slate-700 select-none">VS</div>

                        {/* Cheong indicators */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-950" />
                          <span className="text-blue-400 font-bold max-w-[80px] truncate">{teamNames.CHEONG}</span>
                          <span className="text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800 animate-pulse">
                            {cheongPosition === 0 ? '대기' : `${cheongPosition}번`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Starting Team Selector */}
                    <div className="bg-tkd-dark/40 border border-gray-800/60 p-3 rounded-2xl flex justify-between items-center px-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-tkd-gold" />
                        <span className="text-xs font-bold text-gray-300">선공 차례 설정</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectStartingTeam('HONG')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            startingTeam === 'HONG'
                              ? 'bg-red-500/20 text-red-300 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                              : 'bg-slate-900 text-gray-500 border-gray-800 hover:bg-slate-800'
                          }`}
                        >
                          {teamNames.HONG} 선공
                        </button>
                        <button
                          onClick={() => handleSelectStartingTeam('CHEONG')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            startingTeam === 'CHEONG'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                              : 'bg-slate-900 text-gray-500 border-gray-800 hover:bg-slate-800'
                          }`}
                        >
                          {teamNames.CHEONG} 선공
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Intercept cell action clicks for Admin Mode */}
                  <div 
                    onClick={(e) => {
                      if (!isAdminMode) return;
                      // Walk up tree to find cell
                      const target = e.target as HTMLElement;
                      const cellElement = target.closest('[style*="grid-row-start"]');
                      if (cellElement) {
                        const cellIdText = cellElement.querySelector('span')?.textContent;
                        if (cellIdText) {
                          const id = parseInt(cellIdText, 10);
                          if (!isNaN(id)) {
                            handleAdminSetPosition(id);
                          }
                        }
                      }
                    }}
                    className={`w-full ${isAdminMode ? 'cursor-crosshair ring-2 ring-red-500 rounded-3xl' : ''}`}
                  >
                    <Board 
                      missions={Array.isArray(missions) ? missions : DEFAULT_MISSIONS}
                      hongPosition={hongPosition ?? 0}
                      cheongPosition={cheongPosition ?? 0}
                      currentTurn={currentTurn ?? 'HONG'}
                      teamNames={teamNames ?? {HONG: '홍팀', CHEONG: '청팀'}}
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 mt-3 text-center">
                    {isAdminMode 
                      ? "⚠️ 관장/수동모드가 활성화되었습니다. 보드판의 임의의 칸을 탭하여 말을 강제배정하세요!" 
                      : "경로는 1번칸(좌측상단) ➡️ 6번칸(우측상단) ➡️ 11번칸(우측하단) ➡️ 16번칸(좌측하단) ➡️ 20번 최종지로 회전합니다."}
                  </p>
                </div>


                {/* COLUMN 2: CENTRAL DICE HANGER (31%) */}
                <div className="w-full flex items-center justify-center">
                  <DiceRoller 
                    disabled={isRollPending || isMissionActive || isMoving}
                    isMoving={isMoving}
                    currentTeam={currentTurn ?? 'HONG'}
                    teamNames={teamNames ?? {HONG: '홍팀', CHEONG: '청팀'}}
                    playSfx={playSfx}
                    onRoll={(res) => {
                      setIsRollPending(true);
                      handleDiceRollResult(res);
                    }}
                  />
                </div>


                {/* COLUMN 3: RIGHT PANEL (CURRENT MISSION) (23%) */}
                <div className="w-full flex flex-col justify-center">
                  {/* CURRENT MISSION PANEL */}
                  <AnimatePresence mode="wait">
                    {isMissionActive ? (
                      <motion.div
                        key="active-mission-hud"
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -15 }}
                        className="p-6 rounded-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] glow-gold min-h-[360px]"
                      >
                        {/* Golden Trophy Icon floating */}
                        <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                          <Trophy className="w-32 h-32 text-tkd-gold" />
                        </div>

                        {/* Top Indicator */}
                        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                          <span className="text-xs font-black tracking-wider uppercase text-tkd-energy">
                            현재 미션 진행현황
                          </span>
                          <span className="text-sm font-display font-black text-tkd-gold">
                            CELL {currentTurn === 'HONG' ? hongPosition : cheongPosition} / 20
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-3.5 my-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-medium">현재 칸 번호</span>
                            <span className="font-mono text-white font-black bg-slate-950 px-2.5 py-1 rounded border border-gray-800 shadow-md">
                              CELL {currentTurn === 'HONG' ? hongPosition : cheongPosition}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-gray-900 shadow-inner">
                            {(() => {
                              const safeMissionsArray = Array.isArray(missions) ? missions : DEFAULT_MISSIONS;
                              const currentSafePos = currentTurn === 'HONG' ? (hongPosition ?? 0) : (cheongPosition ?? 0);
                              const safeMissionForRender = safeMissionsArray[currentSafePos - 1];
                              return safeMissionForRender?.type === 'rest' ? (
                                <>
                                  <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-black tracking-wider mb-1">REST ZONE</span>
                                  <span className="text-sm md:text-base font-black text-emerald-300 leading-tight block mt-0.5 transition-colors duration-250">
                                    {safeMissionForRender?.title?.replace(/^쉼터[:\s]*/, '') || '쉼터'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-gray-500 font-mono block">현재 미션명</span>
                                  <span className="text-sm md:text-base font-black text-white leading-tight block mt-1.5 transition-colors duration-250">
                                    {safeMissionForRender?.title || '지정 미션'}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                          
                          {captureMessage && (
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-center text-center shadow-lg shadow-amber-900/20"
                            >
                              <span className="text-[11px] font-black text-amber-300 tracking-wide">{captureMessage}</span>
                            </motion.div>
                          )}

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-slate-950/70 p-3 rounded-xl border border-gray-900 flex flex-col items-center justify-center">
                              <span className="text-[10px] text-gray-500">주사위 결과</span>
                              <div className="flex items-center gap-1.5 mt-1.5 text-tkd-gold">
                                <span className="text-lg font-black font-display">{currentRoll}</span>
                                <span className="text-base">🎲</span>
                              </div>
                            </div>
                            <div className="bg-slate-950/70 p-3 rounded-xl border border-gray-900 flex flex-col items-center justify-center font-display">
                              <span className="text-[10px] text-gray-500">이동 결과</span>
                              <span className="text-xs font-black text-tkd-energy mt-2">{currentRoll}칸 이동</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs border-t border-gray-900 pt-3">
                            <span className="text-gray-400">도착 칸</span>
                            <span className="font-mono font-black text-tkd-energy">
                              CELL {currentTurn === 'HONG' ? hongPosition : cheongPosition}
                            </span>
                          </div>
                        </div>

                        {/* Instruction Guide on complete state */}
                        <div className="my-3 p-3.5 rounded-lg bg-black/40 border border-gray-900 flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isMissionCompleted ? 'bg-green-400' : 'bg-amber-450 animate-ping bg-amber-500'}`} />
                          <p className="text-[11px] text-gray-400 leading-normal">
                            {isMissionCompleted 
                              ? "미션을 완료했습니다! 다음 팀 차례로 넘겨주세요." 
                              : "안내 문구: 미션을 수행한 뒤 다음 팀 차례로 넘겨주세요."}
                          </p>
                        </div>

                        {/* Decision controller buttons */}
                        <div className="mt-4">
                            <button
                              onClick={handleMissionCompleted}
                              id="btn-mission-complete"
                              className={`w-full py-3.5 rounded-xl font-display font-black text-sm tracking-widest text-[#020617] cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                currentTurn === 'HONG'
                                  ? 'bg-gradient-to-r from-red-500 to-amber-500 border border-red-300 shadow-lg shadow-red-950/25'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-400 border border-blue-300 shadow-lg shadow-blue-950/25'
                              }`}
                            >
                              <ShieldCheck className="w-5 h-5" />
                              미션 완료
                            </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="standby-mission-hud"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-6 rounded-2xl flex flex-col justify-between shadow-2xl border border-gray-800/80 bg-gradient-to-br from-[#0f172a] to-[#020617] min-h-[360px]"
                      >
                        <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                          <span className="text-xs font-black tracking-wider uppercase text-slate-500">
                            현재 미션 진행현황
                          </span>
                          <span className="text-sm font-display font-black text-slate-700">
                            CELL - / 20
                          </span>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-75">
                          <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-tkd-energy mb-4 shadow-lg shadow-black/50">
                            <Award className="w-6 h-6 animate-pulse" />
                          </div>
                          <p className="text-sm text-gray-200 font-black tracking-wide">미션 대기 중</p>
                          <div className="mt-3 bg-black/40 border border-gray-800 rounded-lg p-3 max-w-[220px]">
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                              <span className="text-tkd-gold font-bold">주사위를 굴려주세요!</span><br/>
                              말이 보드판에 도착하면<br/>해당 칸의 미션이 활성화됩니다.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ROW 3: FULL WIDTH HISTORY ARCHIVE */}
              <div className="mt-4 w-full">
                <HistoryLog 
                  logs={Array.isArray(historyLogs) ? historyLogs : []}
                  onClear={() => setHistoryLogs([])}
                  teamNames={teamNames ?? {HONG: '홍팀', CHEONG: '청팀'}}
                />
              </div>

            </motion.div>
          )}

          {/* 4. VICTORY TRIUMPH SCREEN */}
          {gameState === 'WIN' && (
            <motion.div
              key="screen-win"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto text-center px-6 py-12 flex flex-col items-center justify-center relative overflow-hidden"
            >
              {/* Confetti ambient decor loops background */}
              <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-gradient-to-b from-tkd-gold/10 to-transparent blur-3xl rounded-full" />

              {/* Giant Trophy Badge */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className={`w-32 h-32 rounded-full p-1 shadow-2xl relative z-10 font-display flex items-center justify-center ${
                  winner === 'HONG'
                    ? 'bg-gradient-to-br from-red-600 via-amber-500 to-red-700 shadow-red-500/20'
                    : 'bg-gradient-to-br from-blue-600 via-cyan-400 to-indigo-700 shadow-blue-500/20'
                }`}
              >
                <div className="w-full h-full bg-[#020617] rounded-full flex flex-col items-center justify-center p-3 animate-pulse">
                  <Trophy className={`w-14 h-14 ${winner === 'HONG' ? 'text-red-400' : 'text-blue-400'} animate-bounce`} />
                </div>
              </motion.div>

              <div className="mt-8 relative z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider border mb-4 font-display uppercase ${
                  winner === 'HONG'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  🏆 MISSION ROAD ROYAL CHAMPION
                </span>
                
                <h1 className="text-4xl md:text-6xl font-black font-display tracking-widest text-white leading-tight">
                  {winner === 'HONG' ? `🔥 ${teamNames.HONG} 대승리! 🔥` : `💎 ${teamNames.CHEONG} 대승리! 💎`}
                </h1>

                <p className="text-[clamp(1rem,2vw,1.125rem)] text-gray-300 font-medium mt-4 max-w-xl mx-auto leading-relaxed break-keep break-words">
                  축하합니다! 수많은 체력 단련과 발차기 역경을 극복하고, 태권도 {winner === 'HONG' ? `${teamNames.HONG}이(가)` : `${teamNames.CHEONG}이(가)`} 최종 고지를 완벽하게 선점하였습니다!
                </p>

                <p className="text-sm text-gray-400 mt-3 max-w-md mx-auto leading-relaxed break-keep break-words">
                  오늘의 미션로드 완료! 친구들의 훌륭한 헌신과 단인 정신에 힘찬 칭찬을 나눠주세요!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm relative z-10">
                <button
                  onClick={() => {
                    handleRestartAll();
                    setGameState('GAME');
                  }}
                  id="btn-win-restart"
                  className="flex-1 py-4.5 px-6 rounded-xl font-display font-black text-sm md:text-base tracking-widest bg-gradient-to-r from-tkd-gold to-amber-500 text-[#020617] border border-yellow-300 hover:from-tkd-gold hover:to-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-950/20"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  한판 더 리매치!
                </button>
                <button
                  onClick={() => {
                    handleRestartAll();
                    setGameState('HOME');
                  }}
                  id="btn-win-home"
                  className="flex-1 py-4.5 px-6 rounded-xl font-display font-black text-sm md:text-base tracking-widest bg-slate-950 hover:bg-slate-900 text-gray-400 border border-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  홈으로 이동
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="py-5 px-4 text-center text-xs text-gray-500 border-t border-gray-900/60 bg-[#020617]/95 shrink-0 select-none break-keep break-words">
        <p className="font-display tracking-widest font-medium">TKD MISSION ROAD &copy; 2026 PREMIUM STUDIO ARENA SYSTEM</p>
        <p className="text-gray-600 mt-1 max-w-lg mx-auto">상상 속 체력 수업을 완벽한 오프라인 협동 게임으로 전환합니다.</p>
      </footer>

      {/* MODALS */}
      <TeamNameEditor 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)}
        teamNames={teamNames}
        onSave={(newNames) => setTeamNames(newNames)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
