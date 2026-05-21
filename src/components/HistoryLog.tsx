import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Swords, ChevronRight, Activity, CalendarDays } from 'lucide-react';
import { GameHistoryEntry } from '../types';

interface HistoryLogProps {
  logs: GameHistoryEntry[];
  onClear: () => void;
  teamNames: Record<'HONG' | 'CHEONG', string>;
}

export default function HistoryLog({ logs, onClear, teamNames }: HistoryLogProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Take only the most recent 4 logs for the horizontal dashboard view
  const recentLogs = [...logs].reverse().slice(0, 4);

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl border border-gray-800 p-4 md:p-5 flex flex-col shadow-2xl overflow-hidden w-full relative">
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
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 font-semibold"
          >
            🔍 전체 기록 보기
          </button>
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

                    <div className="bg-black/40 p-2 rounded-xl border border-gray-900 flex flex-col gap-1.5">
                      <div className="flex items-start gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-tkd-energy mt-0.5 shrink-0" />
                        <span className="text-xs leading-snug text-gray-300 font-medium line-clamp-1" title={log.missionName}>
                          {log.missionName}
                        </span>
                      </div>
                      {log.capturedTeamName && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wider">잡기 성공</span>
                          <span className="text-[9px] text-gray-400">{log.capturedTeamName} 시작으로</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-slate-950/50">
                <h2 className="text-lg font-black tracking-widest text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-tkd-gold" />
                  훈련 아카이브 전체 기록
                </h2>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-60">
                    <Activity className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
                    <p className="text-sm text-gray-300 font-medium">아직 기록된 주사위 결과가 없습니다.</p>
                    <p className="text-xs text-gray-500 mt-1">주사위를 굴리면 기록이 여기에 표시됩니다.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {logs.map((log, index) => {
                      // fallback for missing data
                      const safeTeam = log.team === 'HONG' ? teamNames.HONG : teamNames.CHEONG;
                      const safeDice = log.roll ?? 0;
                      const safeSteps = log.steps ?? 0;
                      const safeTo = log.to ?? 0;
                      const safeMission = log.missionName ?? "미션 준비 중";
                      const safeTime = log.timestamp ?? new Date().toLocaleTimeString();
                      const logNum = logs.length - index;

                      return (
                        <div key={`${safeTime}-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-gray-800/60">
                          <div className="flex items-center gap-3 sm:w-[35%]">
                            <span className="text-xs font-mono text-gray-500 w-5">{logNum}.</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${log.team === 'HONG' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {safeTeam}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {safeTime}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm sm:w-[35%]">
                            <span className="text-white font-display text-xs px-1.5 py-0.5 bg-slate-900 border border-gray-700 rounded font-black">
                              주사위 {safeDice}
                            </span>
                            <span className="text-gray-400 text-xs">{safeSteps}칸 이동</span>
                            <ChevronRight className="w-3 h-3 text-gray-600" />
                            <span className="text-tkd-gold font-black text-xs">
                              {safeTo === 0 ? '대기실' : `CELL ${safeTo}`}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:w-[30%]">
                            <div className="flex items-center gap-1.5 w-full">
                              <Swords className="w-3.5 h-3.5 text-tkd-energy shrink-0" />
                              <span className="text-xs text-gray-300 font-medium truncate" title={safeMission}>
                                {safeMission}
                              </span>
                            </div>
                            {log.capturedTeamName && (
                              <div className="flex items-center gap-1 mt-1 sm:mt-0 sm:ml-auto">
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black tracking-wider whitespace-nowrap">잡기 성공</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-slate-950/50">
                {logs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("전체 기록을 삭제하시겠습니까?")) {
                        onClear();
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 flex items-center gap-1.5"
                  >
                    기록 초기화
                  </button>
                )}
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all bg-slate-800 text-white hover:bg-slate-700 border border-gray-700"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
