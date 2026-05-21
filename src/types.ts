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

export interface MissionData {
  id: number;
  title: string;
  type: 'mission' | 'rest' | 'goal';
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

export const DEFAULT_MISSIONS: MissionData[] = [
  { id: 1, title: "팔벌려 뛰기 1분", type: "mission" },
  { id: 2, title: "버피 테스트 1분", type: "mission" },
  { id: 3, title: "쉼터: 물 한 모금 마시기", type: "rest" },
  { id: 4, title: "무릎 꿇고 발목으로 버티기 1분", type: "mission" },
  { id: 5, title: "양발 앞차기 1분", type: "mission" },
  { id: 6, title: "엎드려 달리기 1분", type: "mission" },
  { id: 7, title: "쉼터: 심호흡 3번", type: "rest" },
  { id: 8, title: "플랭크 버티기 1분", type: "mission" },
  { id: 9, title: "스쿼트 점프 1분", type: "mission" },
  { id: 10, title: "런지 점프 1분", type: "mission" },
  { id: 11, title: "쉼터: 팀원 박수 응원", type: "rest" },
  { id: 12, title: "슈퍼맨 자세로 척추기립근 버티기 1분", type: "mission" },
  { id: 13, title: "뒤로 취침 자세에서 팔다리 버티기 1분", type: "mission" },
  { id: 14, title: "학다리 균형잡기 1분", type: "mission" },
  { id: 15, title: "쉼터: 제자리 정리 호흡", type: "rest" },
  { id: 16, title: "주먹지르기 1분", type: "mission" },
  { id: 17, title: "피칭 1분", type: "mission" },
  { id: 18, title: "스텝 발바꾸기 1분", type: "mission" },
  { id: 19, title: "잔발뛰기 1분", type: "mission" },
  { id: 20, title: "최종 미션: 양발 무릎 점프 1분", type: "goal" }
];

export const DICE_DETAILS: Record<DiceResult, { name: string; steps: number; desc: string }> = {
  1: { name: 'DICE 1', steps: 1, desc: '1칸 앞으로 전진!' },
  2: { name: 'DICE 2', steps: 2, desc: '2칸 앞으로 전진!' },
  3: { name: 'DICE 3', steps: 3, desc: '3칸 앞으로 전진!' },
  4: { name: 'DICE 4', steps: 4, desc: '4칸 앞으로 전진!' },
  5: { name: 'DICE 5', steps: 5, desc: '5칸 앞으로 전진!' },
  6: { name: 'DICE 6', steps: 6, desc: '6칸 앞으로 전진! ★보너스 롤 찬스★' }
};
