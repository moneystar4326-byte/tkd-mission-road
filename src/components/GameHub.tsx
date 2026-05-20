import React, { useState } from 'react';
import { GameCatalogItem } from '../types';
import { Play, Lock, ChevronRight, Swords, HeartPulse, Activity, Zap, Star } from 'lucide-react';

const gameCatalog: GameCatalogItem[] = [
  {
    id: "mission-road",
    title: "주사위 미션로드",
    category: "체력",
    status: "available",
    description: "20칸 보드판에서 주사위를 굴려 미션을 수행하는 대표 게임",
    buttonText: "시작하기"
  },
  {
    id: "fitness-roulette",
    title: "체력 룰렛",
    category: "체력",
    status: "available",
    description: "체력 미션을 룰렛으로 뽑아 진행하는 게임",
    buttonText: "시작하기"
  },
  {
    id: "kick-roulette",
    title: "발차기 룰렛",
    category: "발차기",
    status: "coming-soon",
    description: "앞차기, 돌려차기, 옆차기 미션을 랜덤으로 뽑는 게임",
    buttonText: "준비 중"
  },
  {
    id: "poomsae-match",
    title: "품새 순서 맞추기",
    category: "품새",
    status: "coming-soon",
    description: "태극 품새 동작 순서를 맞추는 게임",
    buttonText: "준비 중"
  },
  {
    id: "color-reaction",
    title: "색깔 반응 게임",
    category: "반응속도",
    status: "coming-soon",
    description: "화면 색깔에 맞춰 빠르게 반응하는 순발력 게임",
    buttonText: "준비 중"
  },
  {
    id: "jump-rope-battle",
    title: "줄넘기 카운트 배틀",
    category: "줄넘기",
    status: "coming-soon",
    description: "팀별 줄넘기 기록을 게임처럼 겨루는 수업 게임",
    buttonText: "준비 중"
  },
  {
    id: "team-shout",
    title: "팀 기합 배틀",
    category: "팀전",
    status: "coming-soon",
    description: "팀별 기합과 집중력을 겨루는 분위기 전환 게임",
    buttonText: "준비 중"
  },
  {
    id: "character-cards",
    title: "인성 카드 뽑기",
    category: "인성교육",
    status: "coming-soon",
    description: "예의, 배려, 끈기, 자신감 인성 미션 카드 게임",
    buttonText: "준비 중"
  },
  {
    id: "test-prep",
    title: "심사 대비 랜덤 미션",
    category: "전체",
    status: "coming-soon",
    description: "국기원 심사 대비 동작을 랜덤으로 연습하는 게임",
    buttonText: "준비 중"
  },
  {
    id: "today-mvp",
    title: "오늘의 MVP 선정",
    category: "전체",
    status: "coming-soon",
    description: "수업 마지막에 오늘의 MVP를 뽑는 마무리 게임",
    buttonText: "준비 중"
  }
];

const categories = ["전체", "체력", "발차기", "품새", "반응속도", "줄넘기", "인성교육", "팀전"];

interface GameHubProps {
  onStartGame: (gameId: string) => void;
}

export default function GameHub({ onStartGame }: GameHubProps) {
  const [activeCategory, setActiveCategory] = useState("전체");

  const filteredGames = activeCategory === "전체" 
    ? gameCatalog 
    : gameCatalog.filter(g => g.category === activeCategory || g.category === "전체" && g.id === "test-prep"); // test-prep and mvp are loosely mapped, but let's strictly match category if not "전체"

  const displayGames = activeCategory === "전체" ? gameCatalog : gameCatalog.filter(g => g.category === activeCategory);

  return (
    <div className="flex-1 flex flex-col items-center p-6 lg:p-10 bg-slate-950 min-h-full overflow-y-auto w-full relative z-10">
      
      {/* Header section */}
      <div className="w-full max-w-6xl flex flex-col gap-2 mb-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-tkd-gold via-yellow-200 to-amber-500 tracking-tight">
          오늘 수업에 바로 쓰는 태권도 미니게임
        </h1>
        <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl">
          빔프로젝터와 PC로 바로 실행 가능한 맞춤형 수업 게임 카탈로그입니다.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="w-full max-w-6xl flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full font-bold text-sm md:text-base transition-all duration-300 shadow-md ${
              activeCategory === cat 
                ? 'bg-tkd-gold text-slate-950 shadow-tkd-gold/30' 
                : 'bg-slate-900/80 text-gray-400 hover:bg-slate-800 border border-slate-700/50 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {displayGames.map((game, index) => {
          const isAvail = game.status === "available";
          
          return (
            <div 
              key={game.id}
              className={`relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden group ${
                isAvail 
                  ? 'border-tkd-energy/30 bg-slate-900/60 hover:bg-slate-900 hover:border-tkd-energy/80 hover:shadow-xl hover:shadow-tkd-energy/20 cursor-pointer' 
                  : 'border-slate-800 bg-slate-900/30 cursor-not-allowed opacity-80'
              }`}
              onClick={() => isAvail && onStartGame(game.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card visual header */}
              <div className={`h-24 md:h-32 w-full flex items-center justify-center ${
                isAvail 
                  ? 'bg-gradient-to-br from-tkd-dark via-slate-800 to-blue-900/40' 
                  : 'bg-slate-800/40'
              }`}>
                {isAvail ? (
                  <Swords className="w-12 h-12 text-tkd-gold opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-transform duration-500" />
                ) : (
                  <Lock className="w-10 h-10 text-slate-600" />
                )}
              </div>
              
              {/* Category Badge */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-[10px] md:text-xs font-black px-2 py-1 rounded shadow-sm ${
                  isAvail ? 'bg-tkd-gold/90 text-slate-900' : 'bg-slate-800 text-gray-400'
                }`}>
                  {game.category}
                </span>
                {isAvail && game.id !== "mission-road" && (
                  <span className="text-[10px] md:text-xs font-black px-2 py-1 rounded shadow-sm bg-blue-500 text-white animate-pulse">
                    NOW OPEN
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className={`text-lg md:text-xl font-bold mb-2 ${isAvail ? 'text-white' : 'text-gray-400'}`}>
                  {game.title}
                </h3>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed flex-1 mb-6 break-keep">
                  {game.description}
                </p>
                
                <button 
                  className={`w-full py-3 rounded-lg font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${
                    isAvail 
                      ? 'bg-tkd-energy text-tkd-dark hover:bg-tkd-gold shadow-lg' 
                      : 'bg-slate-800/80 text-gray-500'
                  }`}
                  disabled={!isAvail}
                >
                  {isAvail ? (
                    <>
                      {game.buttonText} <Play className="w-4 h-4 fill-current" />
                    </>
                  ) : (
                    <>
                      {game.buttonText}
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
