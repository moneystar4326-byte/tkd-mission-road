import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCw, ChevronRight, Dices, HelpCircle } from 'lucide-react';
import { DiceResult, DICE_DETAILS } from '../types';

interface DiceRollerProps {
  onRoll: (result: DiceResult) => void;
  disabled: boolean;
  currentTeam: 'HONG' | 'CHEONG';
  teamNames: Record<'HONG' | 'CHEONG', string>;
}

export default function DiceRoller({ onRoll, disabled, currentTeam, teamNames }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceResult | null>(null);
  const [isAutoRoll, setIsAutoRoll] = useState(false);

  // Custom rotation angles for landing on each face with an isometric 3D tilt
  // Face 1 (Front), Face 2 (Back), Face 3 (Right), Face 4 (Left), Face 5 (Top), Face 6 (Bottom)
  // We apply a consistent X: -20, Y: 25 offset so we always see a beautiful 3D view of the cube.
  const faceRotations: Record<number, { x: number; y: number }> = {
    1: { x: -12, y: 15 },       // Front (1)
    2: { x: -12, y: 195 },      // Back (2)
    3: { x: -12, y: -75 },      // Right (3)
    4: { x: -12, y: 105 },      // Left (4)
    5: { x: -102, y: 15 },      // Top (5)
    6: { x: 78, y: 15 },        // Bottom (6)
  };

  const [cubeRotation, setCubeRotation] = useState<{ x: number; y: number }>({ x: -12, y: 15 });

  // Reset last result and trigger auto-roll if enabled when the turn shifts (disabled becomes false)
  useEffect(() => {
    if (!disabled) {
      setLastResult(null);
    }
  }, [disabled]);

  // Auto-roll handler
  useEffect(() => {
    if (isAutoRoll && !disabled && !isRolling && !lastResult) {
      const timer = setTimeout(() => {
        handleRoll();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAutoRoll, disabled, isRolling, lastResult]);

  const handleRoll = () => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    setLastResult(null);

    // Dynamic chaotic rolling rotations
    let spinCount = 0;
    const spinInterval = setInterval(() => {
      setCubeRotation({
        x: Math.random() * 360,
        y: Math.random() * 360
      });
      spinCount++;
    }, 70);

    // Roll result: random integer from 1 to 6
    const rolledValue = (Math.floor(Math.random() * 6) + 1) as DiceResult;

    setTimeout(() => {
      clearInterval(spinInterval);
      
      const finalRot = faceRotations[rolledValue];
      // Snap to target angle with spin multiplier for speed
      setCubeRotation({
        x: finalRot.x + 720,
        y: finalRot.y + 720
      });

      setTimeout(() => {
        setIsRolling(false);
        setLastResult(rolledValue);
        onRoll(rolledValue);
      }, 400);

    }, 1300);
  };

  // Helper function to render a dice face with traditional pip positions
  const renderPips = (faceNumber: number) => {
    // 3x3 Grid mappings (0 to 8 index)
    // 0: TL, 1: TC, 2: TR
    // 3: ML, 4: MC, 5: MR
    // 6: BL, 7: BC, 8: BR
    const activeIndices: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const indices = activeIndices[faceNumber] || [];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-6 box-border">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isActive = indices.includes(idx);
          if (!isActive) return <div key={idx} />;

          const isRed = faceNumber === 1; // Korean traditional red dot for '1'
          return (
            <div
              key={idx}
              className={`rounded-full self-center justify-self-center transition-all duration-300 ${
                isRed
                  ? 'w-12 h-12 bg-[#e11d48] shadow-[inset_0_4px_6px_rgba(0,0,0,0.55),_0_2px_0px_rgba(255,255,255,0.45)]'
                  : 'w-7 h-7 bg-slate-900 shadow-[inset_0_3px_5px_rgba(0,0,0,0.65),_0_1px_0px_rgba(255,255,255,0.35)]'
              }`}
            />
          );
        })}
      </div>
    );
  };

  // Dice bounce translation animation mapping
  const diceBounceVariants = {
    idle: { y: 0 },
    rolling: {
      y: [-25, 12, -35, 18, -15, 6, 0],
      transition: {
        duration: 1.3,
        ease: "easeInOut"
      }
    }
  };

  // Hologram shadow scaling mapping
  const shadowVariants = {
    idle: { scale: 1, opacity: 0.6 },
    rolling: {
      scale: [0.55, 1.25, 0.45, 1.15, 0.75, 1.05, 1],
      opacity: [0.2, 0.85, 0.1, 0.75, 0.35, 0.65, 0.6],
      transition: {
        duration: 1.3,
        ease: "easeInOut"
      }
    }
  };

  const currentTeamColor = currentTeam === 'HONG' ? 'red' : 'blue';

  return (
    <div className={`bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 w-full h-full min-h-[500px] max-h-[85vh] ${
      disabled 
        ? 'border-gray-800/80 opacity-90 shadow-none' 
        : currentTeam === 'HONG'
          ? 'border-red-500/30 shadow-red-950/10'
          : 'border-blue-500/30 shadow-blue-950/10'
    }`}>
      
      {/* Top Banner Indicator */}
      <div className="w-full text-center z-10">
        <div className="flex items-center justify-center gap-1.5 mb-2.5">
          <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest font-display uppercase border ${
            currentTeam === 'HONG'
              ? 'bg-red-500/10 text-red-400 border-red-500/25'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
          }`}>
            {currentTeam === 'HONG' ? `${teamNames.HONG} 차례` : `${teamNames.CHEONG} 차례`}
          </span>
        </div>
        
        <span className="text-sm font-black tracking-widest text-slate-500 font-display block mt-1">DICE</span>
        <h2 className="text-3xl font-black text-white tracking-wide mt-1.5">주사위 롤</h2>
      </div>

      {/* 3D Dice Stage */}
      <div className="my-6 relative flex items-center justify-center w-full h-52 select-none z-10">
        
        {/* Hologram Base Grid & Rings */}
        <div className="absolute bottom-5 flex flex-col items-center justify-center pointer-events-none">
          {/* Outer glowing border ring */}
          <div className={`w-72 h-14 rounded-full border bg-[#020617]/40 shadow-2xl transition-all duration-500 transform rotateX-60 ${
            isRolling
              ? 'border-cyan-400/50 shadow-cyan-500/25'
              : currentTeam === 'HONG'
                ? 'border-red-500/30 shadow-red-500/15'
                : 'border-blue-500/30 shadow-blue-500/15'
          }`}>
            {/* Dashed spinning border */}
            <div className={`absolute inset-0.5 rounded-full border border-dashed animate-[spin_12s_linear_infinite] ${
              isRolling 
                ? 'border-cyan-400/60' 
                : currentTeam === 'HONG' 
                  ? 'border-red-400/30' 
                  : 'border-blue-400/30'
            }`} />
            {/* Core glowing orb */}
            <div className={`absolute inset-2.5 rounded-full blur-md opacity-70 ${
              isRolling 
                ? 'bg-cyan-500/30 animate-pulse' 
                : currentTeam === 'HONG' 
                  ? 'bg-red-500/25' 
                  : 'bg-blue-500/25'
            }`} />
          </div>

          {/* Upward projection gradient flare */}
          <div className={`absolute bottom-4 w-32 h-20 bg-gradient-to-t from-transparent blur-md rounded-t-full transform scale-x-75 transition-all duration-700 ${
            isRolling 
              ? 'from-cyan-400/20' 
              : currentTeam === 'HONG' 
                ? 'from-red-400/15' 
                : 'from-blue-400/15'
          }`} />
        </div>

        {/* Dynamic Hologram Shadow directly under the cube */}
        <motion.div
          variants={shadowVariants}
          animate={isRolling ? 'rolling' : 'idle'}
          className={`absolute w-32 h-5 rounded-full blur-sm bottom-6 bg-black/60 z-0`}
        />

        {/* Floating particles rising up */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                isRolling 
                  ? 'bg-cyan-400/60' 
                  : currentTeam === 'HONG' 
                    ? 'bg-red-400/40' 
                    : 'bg-blue-400/40'
              }`}
              initial={{ 
                x: 80 + Math.random() * 80, 
                y: 140 + Math.random() * 30, 
                opacity: 0,
                scale: 0.5 
              }}
              animate={{ 
                y: [140 + Math.random() * 30, 30], 
                opacity: [0, 0.75, 0],
                scale: [0.5, 1.2, 0.5]
              }}
              transition={{ 
                duration: 1.8 + Math.random() * 1.5, 
                repeat: Infinity, 
                delay: i * 0.35,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* 3D Perspective Scene Container */}
        <div className="w-48 h-48 flex items-center justify-center mt-8 mb-4" style={{ perspective: '1200px' }}>
          <motion.div
            variants={diceBounceVariants}
            animate={isRolling ? 'rolling' : 'idle'}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-48 h-48 relative"
          >
            <motion.div
              animate={{
                rotateX: cubeRotation.x,
                rotateY: cubeRotation.y,
              }}
              transition={{
                type: 'spring',
                stiffness: isRolling ? 140 : 90,
                damping: isRolling ? 14 : 13
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full relative cursor-pointer"
              onClick={handleRoll}
            >
              {/* Cube Face 1 (Front) */}
              <div 
                style={{ 
                  transform: 'rotateY(0deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(1)}
              </div>

              {/* Cube Face 2 (Back) */}
              <div 
                style={{ 
                  transform: 'rotateY(180deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(2)}
              </div>

              {/* Cube Face 3 (Right) */}
              <div 
                style={{ 
                  transform: 'rotateY(90deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(3)}
              </div>

              {/* Cube Face 4 (Left) */}
              <div 
                style={{ 
                  transform: 'rotateY(-90deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(4)}
              </div>

              {/* Cube Face 5 (Top) */}
              <div 
                style={{ 
                  transform: 'rotateX(90deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(5)}
              </div>

              {/* Cube Face 6 (Bottom) */}
              <div 
                style={{ 
                  transform: 'rotateX(-90deg) translateZ(96px)', 
                  position: 'absolute',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }} 
                className="w-48 h-48 bg-gradient-to-br from-white via-slate-50 to-slate-200 border border-slate-300/40 rounded-3xl shadow-[inset_0_0_16px_rgba(0,0,0,0.08),_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center box-border"
              >
                {renderPips(6)}
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>

      {/* Results & Status Message */}
      <div className="w-full text-center z-10 min-h-16 flex flex-col items-center justify-center bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 shadow-inner">
        {isRolling ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="text-tkd-energy font-display font-black text-sm tracking-widest flex items-center gap-2"
          >
            <RotateCw className="w-5 h-5 animate-spin text-tkd-energy" />
            아레나 연산 중...
          </motion.div>
        ) : lastResult ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-black font-display bg-slate-900 text-white py-1.5 px-6 border border-white/5 rounded-xl shadow-lg ${
                currentTeam === 'HONG' ? 'text-red-400 border-red-500/20 shadow-red-900/20' : 'text-blue-400 border-blue-500/20 shadow-blue-900/20'
              }`}>
                DICE {lastResult}
              </span>
              <span className="text-xl font-black text-tkd-gold bg-black/30 px-4 py-2 rounded-lg border border-tkd-gold/20">
                (+{lastResult}칸 이동)
              </span>
            </div>
            
            <p className="text-gray-300 text-sm mt-3.5 font-bold tracking-wide">
              {DICE_DETAILS[lastResult].desc}
            </p>

            {lastResult === 6 && (
              <span className="text-[10px] font-black text-tkd-energy mt-1 animate-bounce tracking-wider font-display uppercase">
                ★ BONUS ROLL! 한 번 더 굴림 기회 획득 ★
              </span>
            )}
          </motion.div>
        ) : (
          <div className="text-gray-400 text-xs font-semibold leading-relaxed">
            주사위를 굴려 이동하세요!
          </div>
        )}
      </div>

      {/* Control Tools Container */}
      <div className="w-full mt-3 z-10 flex flex-col gap-3">
        {/* Core CTA Roll Button */}
        <button
          onClick={handleRoll}
          disabled={disabled || isRolling}
          id="btn-roll-dice"
          className={`w-full py-5 rounded-2xl font-display font-black text-xl tracking-widest border-2 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3 cursor-pointer ${
            disabled 
              ? 'bg-slate-950 text-slate-500 border-slate-900'
              : currentTeam === 'HONG'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 border-red-400 hover:border-red-300 text-white shadow-xl shadow-red-950/40 glow-red'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 border-blue-400 hover:border-blue-300 text-white shadow-xl shadow-blue-950/40 glow-blue'
          }`}
        >
          {isRolling ? (
            <>
              <RotateCw className="w-6 h-6 animate-spin text-white" />
              아레나 연산 중...
            </>
          ) : (
            <>
              <Dices className="w-7 h-7 text-white/95 animate-pulse" />
              주사위 굴리기
            </>
          )}
        </button>

        {/* Auto Roll toggle */}
        <div className="flex items-center justify-center mt-0.5">
          <button
            onClick={() => setIsAutoRoll(!isAutoRoll)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 border ${
              isAutoRoll
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 glow-blue animate-pulse'
                : 'bg-slate-950/60 text-slate-500 border-slate-900 hover:border-slate-800'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${isAutoRoll ? 'animate-spin-slow text-cyan-400' : 'text-slate-500'}`} />
            자동 굴리기 : {isAutoRoll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Bottom Flow Map (Stepper) */}
      <div className="w-full border-t border-slate-800/80 pt-4 mt-3 flex items-center justify-between text-[10px] text-gray-500 font-semibold font-display">
        <span className={`transition-colors duration-300 ${!disabled && !isRolling ? 'text-tkd-energy font-black' : 'text-slate-650'}`}>
          주사위 롤
        </span>
        <ChevronRight className="w-3 h-3 text-slate-800" />
        <span className={`transition-colors duration-300 ${isRolling ? 'text-tkd-energy font-black animate-pulse' : 'text-slate-650'}`}>
          말 이동
        </span>
        <ChevronRight className="w-3 h-3 text-slate-800" />
        <span className={`transition-colors duration-300 ${disabled && !isRolling ? 'text-tkd-energy font-black' : 'text-slate-650'}`}>
          미션 수행
        </span>
      </div>

    </div>
  );
}
