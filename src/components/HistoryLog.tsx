import { motion, AnimatePresence } from 'motion/react';
import { History, Swords, ChevronRight, Activity, CalendarDays } from 'lucide-react';
import { GameHistoryEntry } from '../types';

interface HistoryLogProps {
  logs: GameHistoryEntry[];
  onClear: () => void;
  teamNames: Record<'HONG' | 'CHEONG', string>;
}

export default function HistoryLog({ logs, onClear, teamNames }: HistoryLogProps) {
  // Take only the most recent 4 logs for the horizontal dashboard view
  const recentLogs = [...logs].reverse().slice(0, 4);

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-gray-800 p-4 md:p-5 flex flex-col shadow-2xl overflow-hidden w-full">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-tkd-gold" />
          <h3 className="font-display font-bold text-base tracking-widest text-gray-200">
            훈련 아카이브 (주사위 기록)
          </h3>
          <div className="px-3 py-1 bg-black/40 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300 ml-4">
            총 롤 횟수 (Dice Rolls): <span className="text-tkd-energy font-mono font-bold ml-1">{logs.length}회</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors" title="전체 기록 모달은 준비 중입니다.">
            🔍 전체 기록 보기
          </span>
          {logs.length > 0 && (
            <button
              onClick={onClear}
              className="text-gray-500 hover:text-red-400 font-semibold transition-all hover:underline flex items-center gap-1"
            >
              ❌ 기록 초기화
            </button>
          )}
        </div>
      </div>

      {/* Horizontal History Ledger List */}
      <div className="flex-1 w-full min-h-[85px]">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="w-full h-[85px] bg-[#020617]/40 rounded-2xl border border-gray-900/50 flex flex-col justify-center items-center text-center opacity-60">
              <Activity className="w-6 h-6 text-slate-600 mb-2 animate-pulse" />
              <p className="text-xs text-gray-400">아직 저장된 훈련 이력이 없습니다.</p>
              <p className="text-[10px] text-gray-500 mt-1">주사위를 굴려 미션을 돌파하세요!</p>
            </div>
          ) : (
            <div className="flex items-stretch gap-4 overflow-x-auto pb-2 custom-scrollbar pr-2">
              {recentLogs.map((log, idx) => {
                const isHong = log.team === 'HONG';
                const teamBadgeColor = isHong 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20';

                return (
                  <motion.div
                    key={`${log.timestamp}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-shrink-0 w-64 bg-[#020617]/60 rounded-2xl p-3 border border-gray-800 flex flex-col justify-between gap-2 transition-all hover:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${teamBadgeColor}`}>
                        {isHong ? teamNames.HONG : teamNames.CHEONG}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                      <span className="text-white font-display text-xs px-1.5 py-0.5 bg-slate-900 border border-gray-700 rounded font-black">
                        DICE {log.roll}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {log.steps}칸 이동
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-600" />
                      <span className="text-tkd-gold font-black text-xs">
                        {log.to === 0 ? '대기실' : `CELL ${log.to}`}
                      </span>
                    </div>

                    <div className="bg-black/40 p-2 rounded-xl border border-gray-900 flex items-start gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-tkd-energy mt-0.5 shrink-0" />
                      <span className="text-xs leading-snug text-gray-300 font-medium line-clamp-1" title={log.missionName}>
                        {log.missionName}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
