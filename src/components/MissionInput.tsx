import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, RefreshCw, Sparkles, ClipboardEdit, AlertCircle } from 'lucide-react';
import { DEFAULT_MISSIONS, MissionData } from '../types';

interface MissionInputProps {
  initialMissions: MissionData[];
  onSave: (missions: MissionData[]) => void;
  onBack: () => void;
}

export default function MissionInput({ initialMissions, onSave, onBack }: MissionInputProps) {
  const [missions, setMissions] = useState<MissionData[]>(() => {
    // Fill up to 20 just in case
    const arr = [...initialMissions];
    while (arr.length < 20) {
      arr.push({ id: arr.length + 1, title: '', type: 'mission' });
    }
    return arr;
  });

  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (index: number, val: string) => {
    const updated = [...missions];
    let type: 'mission' | 'rest' | 'goal' = 'mission';
    if (val.startsWith('쉼터') || val.startsWith('REST')) type = 'rest';
    if (index === 19) type = 'goal';
    
    updated[index] = { ...updated[index], title: val, type };
    setMissions(updated);
    if (error) setError(null);
  };

  const handleLoadDefaults = () => {
    setMissions([...DEFAULT_MISSIONS]);
    setError(null);
  };

  const handleSave = () => {
    const safeMissions = Array.isArray(missions) ? missions : [];
    // Check if any missions are empty
    const trimmed = safeMissions.map(m => ({ ...m, title: m?.title?.trim() ?? "" }));
    const hasEmpty = trimmed.some(m => m.title === '');
    
    if (hasEmpty) {
      setError('모든 칸의 미션을 빠짐없이 적어주셔야 완벽한 미션로드가 탄생합니다!');
      return;
    }

    onSave(trimmed);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Title block */}
      <div className="text-center mb-8 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-tkd-gold/10 text-tkd-gold border border-tkd-gold/30 mb-3"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          ARENA MISSION CONFIGURATOR
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-black font-display text-white tracking-widest bg-clip-text bg-gradient-to-b from-white to-gray-400">
          태권 미션 에디터
        </h1>
        <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
          태권도 수련생들의 훈련 코스를 직접 커스텀하세요. 각 칸번호(1~20번) 에 매칭될 도전 과제를 정교하게 편집할 수 있습니다.
        </p>
      </div>

      {/* Control Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6 bg-tkd-dark/60 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2">
          <ClipboardEdit className="w-5 h-5 text-tkd-energy" />
          <span className="text-sm font-semibold text-gray-300">총 20개 코스 관리</span>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleLoadDefaults}
            id="btn-load-defaults"
            className="flex-1 sm:flex-none py-2 px-3.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-tkd-energy border border-tkd-energy/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            기본 미션 자동입력
          </button>
          <button
            onClick={onBack}
            id="btn-input-back"
            className="flex-1 sm:flex-none py-2 px-3.5 rounded-lg text-xs font-semibold bg-gray-950 hover:bg-gray-900 text-gray-400 border border-gray-800 transition-all active:scale-95"
          >
            취소
          </button>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {(Array.isArray(missions) ? missions : []).map((mission, index) => {
          const numberStr = String(index + 1).padStart(2, '0');
          const isSpecial = index === 19; // Goal

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isSpecial
                  ? 'bg-tkd-gold/5 border-tkd-gold/30 hover:border-tkd-gold/50'
                  : 'bg-tkd-dark/45 border-gray-800/80 hover:border-gray-700'
              }`}
            >
              {/* Tile marker */}
              <div
                className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-display font-black text-sm border ${
                  isSpecial
                    ? 'bg-gradient-to-br from-tkd-gold to-amber-600 text-tkd-navy border-tkd-gold shadow-md'
                    : 'bg-slate-900 text-gray-400 border-slate-800'
                }`}
              >
                {numberStr}
              </div>

              {/* Input field */}
              <div className="flex-1">
                <input
                  type="text"
                  value={mission?.title ?? ""}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder={isSpecial ? "최종 최종 미션을 입력하세요" : `${index + 1}번 훈련 미션 내용...`}
                  maxLength={50}
                  className="w-full bg-slate-900/60 border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-tkd-energy focus:bg-slate-900 transition-all font-medium"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-2.5 text-red-400 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Action Footer */}
      <div className="flex justify-center border-t border-gray-800/60 pt-6">
        <button
          onClick={handleSave}
          id="btn-save-and-play"
          className="w-full md:w-auto md:min-w-[280px] py-4 px-8 rounded-xl font-display font-extrabold text-lg tracking-wide bg-gradient-to-r from-tkd-gold to-amber-500 text-tkd-navy border border-yellow-300 hover:from-tkd-gold hover:to-yellow-400 shadow-xl shadow-amber-950/20 hover:shadow-tkd-gold/15 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-5 h-5" />
          미션 저장 후 미션로드 진입!
        </button>
      </div>
    </div>
  );
}
