import { motion } from 'motion/react';
import { Sword, Award, Check } from 'lucide-react';
import { getCellCoordinates, Team, MissionData } from '../types';

interface BoardProps {
  missions: MissionData[];
  hongPosition: number;
  cheongPosition: number;
  currentTurn: Team;
  teamNames: Record<Team, string>;
}

export default function Board({ missions, hongPosition, cheongPosition, currentTurn, teamNames }: BoardProps) {
  // Generate outer perimeters cells (1 to 20)
  const cells = Array.from({ length: 20 }, (_, idx) => {
    const id = idx + 1;
    const { row, col } = getCellCoordinates(id);
    const safeMissions = Array.isArray(missions) ? missions : [];
    const mission = safeMissions[idx];
    return {
      id,
      row,
      col,
      name: mission?.title || `미션 ${id}`,
      type: mission?.type || 'mission',
    };
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-xl md:max-w-4xl grid grid-cols-2 gap-2 mb-2">
        {/* Hong Team Starter Dock */}
        <div
          className={`relative p-2 rounded-xl border transition-all ${
            hongPosition === 0
              ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/40'
              : 'bg-slate-950/40 border-gray-900 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-400 tracking-wide font-display uppercase">HONG DECK ({teamNames.HONG} 시작 대기실)</span>
            {hongPosition === 0 && <span className="bg-red-500 text-[9px] text-white px-1.5 py-0.5 rounded font-black animate-pulse">STANDBY</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-amber-600 border-2 border-red-400 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-red-900/30">
                홍
              </div>
              {hongPosition === 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200">{teamNames.HONG}</p>
              <p className="text-[11px] text-gray-400 font-mono">위치: 시작 대기지점</p>
            </div>
          </div>
        </div>

        {/* Cheong Team Starter Dock */}
        <div
          className={`relative p-2 rounded-xl border transition-all ${
            cheongPosition === 0
              ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-950/30'
              : 'bg-slate-950/40 border-gray-900 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 tracking-wide font-display uppercase">CHEONG DECK ({teamNames.CHEONG} 시작 대기실)</span>
            {cheongPosition === 0 && <span className="bg-blue-500 text-[9px] text-white px-1.5 py-0.5 rounded font-black animate-pulse">STANDBY</span>}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-2 border-blue-400 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-900/30">
                청
              </div>
              {cheongPosition === 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200">{teamNames.CHEONG}</p>
              <p className="text-[11px] text-gray-400 font-mono">위치: 시작 대기지점</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 6x6 Battle Grid */}
      <div className="w-full aspect-[6/5] max-w-xl md:max-w-4xl bg-tkd-navy border border-slate-800 rounded-3xl p-2 md:p-3 grid grid-cols-6 grid-rows-6 gap-2 shadow-2xl relative">
        
        {/* Core Center area (Grid cells column 2 to 5, row 2 to 5) */}
        <div className="col-start-2 col-end-6 row-start-2 row-end-6 bg-slate-950/65 rounded-2xl border border-gray-800/80 p-4 flex flex-col items-center justify-between pointer-events-none relative overflow-hidden text-center z-0">
          {/* Ambient center grid decor */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
          
          <div className="m-auto flex flex-col items-center z-10 p-2">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-tkd-gold mb-2 shadow-inner">
              <Sword className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-display font-black text-xs md:text-sm tracking-widest text-slate-450 uppercase">
              TKD ARENA
            </h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-mono mt-1">
              격투 미션 로드 중심점
            </p>
            <div className="mt-3 flex gap-1 items-center bg-tkd-gold/10 px-2 py-0.5 rounded border border-tkd-gold/20">
              <Award className="w-3 h-3 text-tkd-gold" />
              <span className="text-[9px] md:text-[10px] font-bold text-tkd-gold">승리 고지: 20번 돌파!</span>
            </div>
          </div>
        </div>

        {/* Loop cells */}
        {cells.map((cell) => {
          const hasHong = hongPosition === cell.id;
          const hasCheong = cheongPosition === cell.id;
          const hasPiece = hasHong || hasCheong;
          
          // Determine if current turn is landing on this cell
          const holdsActiveHong = currentTurn === 'HONG' && hasHong;
          const holdsActiveCheong = currentTurn === 'CHEONG' && hasCheong;
          const holdsAnyActive = holdsActiveHong || holdsActiveCheong;

          const isFinal = cell.id === 20;

          // CSS Grid placement definitions
          const gridStyle = {
            gridRowStart: cell.row + 1,
            gridColumnStart: cell.col + 1,
          };

          return (
            <div
              key={cell.id}
              style={gridStyle}
              className={`relative rounded-xl transition-all duration-300 flex flex-col justify-between p-2 overflow-hidden border ${
                holdsAnyActive
                  ? currentTurn === 'HONG'
                    ? 'glow-red bg-red-950/30 scale-102 z-10'
                    : 'glow-blue bg-blue-950/30 scale-102 z-10'
                  : isFinal
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_20px_rgba(212,175,55,0.45)]'
                    : cell.type === 'rest'
                      ? 'border-emerald-500/20 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                      : hasPiece
                        ? 'border-[#00D4FF] bg-[#00D4FF]/5 shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                        : 'border-white/10 bg-[#0f172a]/80 hover:border-white/20'
              }`}
            >
              {/* Top info and tag label */}
              <div className="flex justify-between items-center w-full">
                <span
                  className={`font-display font-black text-xs md:text-sm leading-none tracking-tight ${
                    isFinal
                      ? 'text-tkd-gold'
                      : holdsAnyActive
                        ? 'text-white'
                        : 'text-slate-500'
                  }`}
                >
                  {String(cell.id).padStart(2, '0')}
                </span>

                {isFinal && (
                  <span className="text-[8px] bg-tkd-gold text-tkd-navy font-black px-1 rounded transform scale-75 md:scale-100 italic">
                    GOAL
                  </span>
                )}
                {cell.type === 'rest' && !isFinal && (
                  <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black px-1 rounded transform scale-75 md:scale-100 uppercase tracking-wider">
                    REST
                  </span>
                )}
              </div>

              {/* Mission text description */}
              <p
                className={`text-[10px] md:text-[11.5px] leading-snug font-semibold line-clamp-2 mt-0.5 select-none break-words whitespace-normal ${
                  holdsAnyActive
                    ? 'text-gray-100 font-bold'
                    : isFinal
                      ? 'text-tkd-gold/90'
                      : cell.type === 'rest'
                        ? 'text-emerald-300'
                        : 'text-slate-300'
                }`}
              >
                {cell.type === 'rest' ? cell.name.replace(/^쉼터[:\s]*/, '') : cell.name.split(' (')[0]}
              </p>

              {/* Bottom Piece holder */}
              <div className="flex gap-1 justify-center items-center mt-auto pt-1">
                {hasHong && (
                  <motion.div
                    layoutId="piece-hong"
                    animate={{ scale: [0.8, 1.1, 1], rotate: [0, 10, 0] }}
                    className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-red-600 to-red-500 border border-red-300 text-white font-extrabold text-[9px] flex items-center justify-center shadow-lg cursor-default shrink-0 z-20"
                    title={`${teamNames.HONG} 위치`}
                  >
                    홍
                  </motion.div>
                )}
                {hasCheong && (
                  <motion.div
                    layoutId="piece-cheong"
                    animate={{ scale: [0.8, 1.1, 1], rotate: [0, -10, 0] }}
                    className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 border border-blue-300 text-white font-extrabold text-[9px] flex items-center justify-center shadow-lg cursor-default shrink-0 z-20"
                    title={`${teamNames.CHEONG} 위치`}
                  >
                    청
                  </motion.div>
                )}
              </div>

              {/* Pulse effect overlay inside energetic slots */}
              {holdsAnyActive && (
                <div
                  className={`absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-tr animate-pulse-slow ${
                    currentTurn === 'HONG' ? 'from-red-500 to-amber-500' : 'from-blue-500 to-indigo-500'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
