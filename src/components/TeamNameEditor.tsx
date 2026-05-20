import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Save, X, Edit3 } from 'lucide-react';
import { Team } from '../types';

interface TeamNameEditorProps {
  isOpen: boolean;
  onClose: () => void;
  teamNames: Record<Team, string>;
  onSave: (newNames: Record<Team, string>) => void;
}

export default function TeamNameEditor({ isOpen, onClose, teamNames, onSave }: TeamNameEditorProps) {
  const [hongName, setHongName] = useState(teamNames.HONG);
  const [cheongName, setCheongName] = useState(teamNames.CHEONG);
  const [error, setError] = useState('');

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setHongName(teamNames.HONG);
      setCheongName(teamNames.CHEONG);
      setError('');
    }
  }, [isOpen, teamNames]);

  const handleSave = () => {
    const trimmedHong = hongName.trim();
    const trimmedCheong = cheongName.trim();

    if (!trimmedHong || !trimmedCheong) {
      setError('팀 이름을 모두 입력해주세요.');
      return;
    }

    if (trimmedHong.length > 10 || trimmedCheong.length > 10) {
      setError('팀 이름은 최대 10자 이내로 입력해주세요.');
      return;
    }

    onSave({ HONG: trimmedHong, CHEONG: trimmedCheong });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-950 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-tkd-navy to-slate-900 px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-tkd-gold" />
                  <h3 className="font-display font-bold tracking-widest text-white text-base">팀 이름 설정</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {error && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 text-center font-bold">
                    {error}
                  </div>
                )}

                {/* HONG Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    홍팀 (HONG)
                  </label>
                  <input
                    type="text"
                    value={hongName}
                    onChange={(e) => setHongName(e.target.value)}
                    maxLength={10}
                    placeholder="홍팀 이름 입력 (최대 10자)"
                    className="w-full bg-[#020617] border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-700"
                  />
                </div>

                {/* CHEONG Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    청팀 (CHEONG)
                  </label>
                  <input
                    type="text"
                    value={cheongName}
                    onChange={(e) => setCheongName(e.target.value)}
                    maxLength={10}
                    placeholder="청팀 이름 입력 (최대 10자)"
                    className="w-full bg-[#020617] border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-4 bg-slate-900/50 border-t border-gray-800 flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-transparent transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#020617] bg-gradient-to-r from-tkd-gold to-amber-500 hover:from-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  저장하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
