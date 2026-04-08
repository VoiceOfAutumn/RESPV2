// Level progression table: each entry is [totalExpRequired, expToNextLevel]
// Index = level - 1, so LEVEL_TABLE[0] = level 1, LEVEL_TABLE[49] = level 50
const LEVEL_TABLE: [number, number][] = [
  // Tier: Newcomer (Levels 1–4)
  [0, 5],      // Lv 1 → 2
  [5, 6],      // Lv 2 → 3
  [11, 7],     // Lv 3 → 4
  [18, 14],    // Lv 4 → 5
  // Tier: Contender (Levels 5–9)
  [32, 12],    // Lv 5 → 6
  [44, 14],    // Lv 6 → 7
  [58, 15],    // Lv 7 → 8
  [73, 16],    // Lv 8 → 9
  [89, 16],    // Lv 9 → 10
  // Tier: Veteran (Levels 10–19)
  [105, 15],   // Lv 10 → 11
  [120, 16],   // Lv 11 → 12
  [136, 17],   // Lv 12 → 13
  [153, 18],   // Lv 13 → 14
  [171, 19],   // Lv 14 → 15
  [190, 18],   // Lv 15 → 16
  [208, 17],   // Lv 16 → 17
  [225, 16],   // Lv 17 → 18
  [241, 17],   // Lv 18 → 19
  [258, 17],   // Lv 19 → 20
  // Tier: Rival (Levels 20–34)
  [275, 18],   // Lv 20 → 21
  [293, 18],   // Lv 21 → 22
  [311, 19],   // Lv 22 → 23
  [330, 19],   // Lv 23 → 24
  [349, 20],   // Lv 24 → 25
  [369, 20],   // Lv 25 → 26
  [389, 21],   // Lv 26 → 27
  [410, 21],   // Lv 27 → 28
  [431, 22],   // Lv 28 → 29
  [453, 22],   // Lv 29 → 30
  [475, 23],   // Lv 30 → 31
  [498, 23],   // Lv 31 → 32
  [521, 24],   // Lv 32 → 33
  [545, 2],    // Lv 33 → 34
  [547, 3],    // Lv 34 → 35
  // Tier: Elite (Levels 35–49)
  [550, 25],   // Lv 35 → 36
  [575, 27],   // Lv 36 → 37
  [602, 29],   // Lv 37 → 38
  [631, 31],   // Lv 38 → 39
  [662, 33],   // Lv 39 → 40
  [695, 35],   // Lv 40 → 41
  [730, 37],   // Lv 41 → 42
  [767, 39],   // Lv 42 → 43
  [806, 41],   // Lv 43 → 44
  [847, 43],   // Lv 44 → 45
  [890, 45],   // Lv 45 → 46
  [935, 20],   // Lv 46 → 47
  [955, 15],   // Lv 47 → 48
  [970, 14],   // Lv 48 → 49
  [984, 15],   // Lv 49 → 50
];

// Level 50 (Legend) starts at 999 EXP
const MAX_LEVEL_EXP = 999;
const MAX_LEVEL = 50;

export interface TierInfo {
  name: string;
  color: string;      // tailwind text color
  borderColor: string; // tailwind border color
  accent: string;      // hex color for progress bars etc.
}

const TIER_DEFS: { minLevel: number; tier: TierInfo }[] = [
  { minLevel: 1,  tier: { name: 'Newcomer',  color: 'text-gray-400',   borderColor: 'border-gray-500',   accent: '#9ca3af' } },
  { minLevel: 5,  tier: { name: 'Contender', color: 'text-green-400',  borderColor: 'border-green-500',  accent: '#4ade80' } },
  { minLevel: 10, tier: { name: 'Veteran',   color: 'text-blue-400',   borderColor: 'border-blue-500',   accent: '#60a5fa' } },
  { minLevel: 20, tier: { name: 'Rival',     color: 'text-purple-400', borderColor: 'border-purple-500', accent: '#c084fc' } },
  { minLevel: 35, tier: { name: 'Elite',     color: 'text-orange-400', borderColor: 'border-orange-500', accent: '#fb923c' } },
  { minLevel: 50, tier: { name: 'Legend',     color: 'text-yellow-400', borderColor: 'border-yellow-500', accent: '#facc15' } },
];

export interface LevelData {
  level: number;
  tier: TierInfo;
  currentExp: number;       // total EXP the user has
  expForCurrentLevel: number; // EXP required to reach current level
  expForNextLevel: number;    // EXP required to reach next level (0 if max)
  expIntoLevel: number;       // how much EXP earned within current level
  expNeededForNext: number;   // how much more EXP needed for next level (0 if max)
  progress: number;           // 0–1 progress within current level (1 if max)
  isMaxLevel: boolean;
}

export function getLevelData(exp: number): LevelData {
  const clampedExp = Math.max(0, exp);

  // Find the level
  let level = 1;
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (clampedExp >= LEVEL_TABLE[i][0]) {
      level = i + 1;
      break;
    }
  }

  // Check if at or past max level
  if (clampedExp >= MAX_LEVEL_EXP) {
    level = MAX_LEVEL;
  }

  const isMaxLevel = level >= MAX_LEVEL;
  const tableIndex = level - 1;
  const expForCurrentLevel = LEVEL_TABLE[tableIndex][0];
  const expToNext = LEVEL_TABLE[tableIndex][1];

  let expForNextLevel: number;
  let expIntoLevel: number;
  let progress: number;

  if (isMaxLevel) {
    expForNextLevel = 0;
    expIntoLevel = clampedExp - expForCurrentLevel;
    progress = 1;
  } else {
    expForNextLevel = expForCurrentLevel + expToNext;
    expIntoLevel = clampedExp - expForCurrentLevel;
    progress = expToNext > 0 ? Math.min(expIntoLevel / expToNext, 1) : 1;
  }

  // Find tier
  let tier = TIER_DEFS[0].tier;
  for (let i = TIER_DEFS.length - 1; i >= 0; i--) {
    if (level >= TIER_DEFS[i].minLevel) {
      tier = TIER_DEFS[i].tier;
      break;
    }
  }

  return {
    level,
    tier,
    currentExp: clampedExp,
    expForCurrentLevel,
    expForNextLevel,
    expIntoLevel,
    expNeededForNext: isMaxLevel ? 0 : expToNext - expIntoLevel,
    progress,
    isMaxLevel,
  };
}
