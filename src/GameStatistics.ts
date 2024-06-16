import * as Unit from './entity/Unit';
import * as Cards from './cards';
import * as Achievements from './Achievements';
import Underworld from './Underworld';

//

// Global Stats are only stored once, and we don't care "when" they happened
export const globalStats: IGlobalStats = EmptyGlobalStatistics();
interface IGlobalStats {
  bestSpell: {
    unitsKilled: number,
    spell: string[]
  };
  longestSpell: string[];
  runStartTime: number,
  runWinTime: number | undefined,
  runEndTime: number | undefined,
}
// This function can be used to initialize or reset globalStats
export function EmptyGlobalStatistics(stats?: IGlobalStats): IGlobalStats {
  return Object.assign(stats || {}, {
    bestSpell: { unitsKilled: 0, spell: [] },
    longestSpell: [],
    runStartTime: Date.now(),
    runWinTime: undefined,
    runEndTime: undefined,
  })
}

//

export enum StatDepth {
  LIFETIME,
  RUN,
  LEVEL,
  SPELL,
}
// These statistics help us keep track of game events as they progress
// and are separated by when they occured for the purpose of achievements
export const allStats: IStatistics[] = [
  EmptyStatistics(), // 0 - Lifetime
  EmptyStatistics(), // 1 - Run
  EmptyStatistics(), // 2 - Level
  EmptyStatistics(), // 3 - Spell
];
export interface IStatistics {
  myPlayerDamageTaken: number;
  myPlayerDeaths: number;
  cardsCast: number;
  myPlayerArrowsFired: number;
  myPlayerCursesPurified: number;
}
// This function can be used to initialize or reset a statistics object
export function EmptyStatistics(stats?: IStatistics): IStatistics {
  return Object.assign(stats || {}, {
    myPlayerDamageTaken: 0,
    myPlayerDeaths: 0,
    cardsCast: 0,
    myPlayerArrowsFired: 0,
    myPlayerCursesPurified: 0,
  })
}

//

function allStatsAtDepth(depth: StatDepth): IStatistics[] {
  return allStats.slice(0, depth + 1);
}

export function LogStats() {
  console.log("[STATS]", allStats);
  console.log("[STATS] - LIFETIME", allStats[StatDepth.LIFETIME]);
  console.log("[STATS] - RUN", allStats[StatDepth.RUN]);
  console.log("[STATS] - LEVEL", allStats[StatDepth.LEVEL]);
  console.log("[STATS] - SPELL", allStats[StatDepth.SPELL]);
}

const GAME_STATISTICS_STORAGE_KEY = "Game Statistics - Lifetime";
export function SaveStats() {
  const statsToSave = allStats[StatDepth.LIFETIME];
  if (statsToSave) {
    storageSet(GAME_STATISTICS_STORAGE_KEY, JSON.stringify(statsToSave));
  }
}
export function LoadStats() {
  const loadedString = storageGet(GAME_STATISTICS_STORAGE_KEY);
  if (loadedString) {
    const loadedStats = JSON.parse(loadedString);
    if (loadedStats) {
      allStats[StatDepth.LIFETIME] = loadedStats;
    }
  }
}

//

interface trackUnitDamageArgs {
  unit: Unit.IUnit,
  amount: number,
  prediction: boolean,
}
export function trackUnitDamage(args: trackUnitDamageArgs) {
  let { unit, amount, prediction } = args;
  if (prediction) {
    return;
  }

  if (amount > 0) {
    if (unit == globalThis.player?.unit) {
      allStatsAtDepth(StatDepth.LEVEL).forEach(s => s.myPlayerDamageTaken += amount);
    }
  }
}

interface trackUnitDieArgs {
  unit: Unit.IUnit,
  prediction: boolean,
}
export function trackUnitDie(args: trackUnitDieArgs) {
  let { unit, prediction } = args;
  if (prediction) {
    return;
  }

  if (unit == globalThis.player?.unit) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerDeaths += 1);
  }
}

interface trackCastCardsArgs {
  effectState: Cards.EffectState,
  prediction: boolean,
}
export function trackCastCardsStart(args: trackCastCardsArgs) {
  let { effectState, prediction } = args;
  if (prediction) {
    return;
  }

  clearSpellStatistics();

  if (effectState.casterPlayer == globalThis.player) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.cardsCast += effectState.cardIds.length);
  }
}
export function trackCastCardsEnd(args: trackCastCardsArgs) {
  let { effectState, prediction } = args;
  if (prediction) {
    return;
  }

  Achievements.UnlockEvent_CastCards();
  clearSpellStatistics()
}

interface trackArrowFiredArgs {
  sourceUnit: Unit.IUnit,
  prediction: boolean,
}
export function trackArrowFired(args: trackArrowFiredArgs) {
  let { sourceUnit, prediction } = args;
  if (prediction) {
    return;
  }

  if (sourceUnit == globalThis.player?.unit) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerArrowsFired += 1);
  }
}

interface trackCursePurifiedArgs {
  unit: Unit.IUnit,
  sourceUnit: Unit.IUnit,
  prediction: boolean,
}
export function trackCursePurified(args: trackCursePurifiedArgs) {
  let { unit, sourceUnit, prediction } = args;
  if (prediction) {
    return;
  }

  if (sourceUnit == globalThis.player?.unit) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerCursesPurified += 1);
  }
}

// Warning, this gets called mulitple times per level
export function trackEndLevel(underworld: Underworld) {
  Achievements.UnlockEvent_EndOfLevel(underworld);
  clearLevelStatistics(underworld);
}

export function trackGameStart() {
  EmptyGlobalStatistics(globalStats);
}

export function trackGameEnd() {
  if (!globalStats.runEndTime) {
    globalStats.runEndTime = Date.now();
  }
}

export function clearSpellStatistics() {
  console.log("[STATS] - Clear Spell Statistics");
  LogStats();
  EmptyStatistics(allStats[StatDepth.SPELL]);
}
export function clearLevelStatistics(underworld: Underworld) {
  console.log("[STATS] - Clear Level Statistics", underworld.levelIndex);
  LogStats();
  EmptyStatistics(allStats[StatDepth.LEVEL]);
}
export function clearRunStatistics(underworld: Underworld) {
  console.log("[STATS] - Clear Run Statistics", underworld.levelIndex);
  LogStats();
  EmptyStatistics(allStats[StatDepth.RUN]);
}