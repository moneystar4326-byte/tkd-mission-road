export type Team = 'HONG' | 'CHEONG'; // 홍팀 (Red) | 청팀 (Blue)

export type GameState = 'HOME' | 'HUB' | 'MISSION_INPUT' | 'GAME' | 'WIN' | 'FITNESS_ROULETTE';

export interface GameCatalogItem {
  id: string;
  title: string;
  category: string;
  status: 'available' | 'coming-soon';
  description: string;
  buttonText: string;
}

export interface Mission {
  id: number; // 1 to 20
  name: string;
}

export type DiceResult = 1 | 2 | 3 | 4 | 5 | 6;

export interface BoardCell {
  id: number; // 1 to 20
  row: number; // 0 to 5
  col: number; // 0 to 5
  name: string;
}

export interface GameHistoryEntry {
  team: Team;
  roll: DiceResult;
  steps: number;
  from: number;
  to: number;
  missionName: string;
  timestamp: string;
}

// 6x6 Grid Mapping for 20 outer cells
export const getCellCoordinates = (id: number): { row: number; col: number } => {
  if (id >= 1 && id <= 6) {
    return { row: 0, col: id - 1 };
  } else if (id >= 7 && id <= 10) {
    return { row: id - 6, col: 5 };
  } else if (id >= 11 && id <= 16) {
    return { row: 5, col: 5 - (id - 11) };
  } else if (id >= 17 && id <= 20) {
    return { row: 5 - (id - 16), col: 0 };
  }
  return { row: 0, col: 0 };
};

export const DEFAULT_MISSIONS: string[] = [
  "집중력 20개 (집중 사수!)",
  "스쿼트 15개 (강철 하체!)",
  "팔굽혀펴기 10회 (상체 단련!)",
  "플랭크 20초 (코어 사수!)",
  "유연성 미션 (다리 찢기!)",
  "버피 테스트 5개 (폐활량 업!)",
  "돌려차기 10번 (타격 고수!)",
  "앞발 돌려차기 1회",
  "한 발 균형 잡기 20초 버티기",
  "제자리 뛰어 정권 지르기 20회",
  "강력 발차기 10번",
  "마운틴 클라이머 20개",
  "단체 협동 팀워크 미션",
  "뒷차기 2회 연속 (허공 타격!)",
  "백스핀 한 바퀴 (고난도 턴!)",
  "다리 높이 올리기 10개",
  "발등 밀어차기 5개",
  "다 함께 단체 회전 발차기!",
  "전방 발차기 5번 연속!",
  "최종 미션: 힘찬 기합과 함께 마무리!"
];

export const DICE_DETAILS: Record<DiceResult, { name: string; steps: number; desc: string }> = {
  1: { name: 'DICE 1', steps: 1, desc: '1칸 앞으로 전진!' },
  2: { name: 'DICE 2', steps: 2, desc: '2칸 앞으로 전진!' },
  3: { name: 'DICE 3', steps: 3, desc: '3칸 앞으로 전진!' },
  4: { name: 'DICE 4', steps: 4, desc: '4칸 앞으로 전진!' },
  5: { name: 'DICE 5', steps: 5, desc: '5칸 앞으로 전진!' },
  6: { name: 'DICE 6', steps: 6, desc: '6칸 앞으로 전진! ★보너스 롤 찬스★' }
};
