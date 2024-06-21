import * as Unit from './entity/Unit';
import * as Cards from './cards';
import * as Achievements from './Achievements';
import * as storage from "./storage";
import Underworld from './Underworld';
import { LAST_LEVEL_INDEX } from './config';

//

// Global Stats are only stored once, and we don't care "when" they happened
export const globalStats: IGlobalStats = EmptyGlobalStatistics();
export interface IGlobalStats {
  bestSpell: {
    unitsKilled: number,
    spell: string[]
  };
  longestSpell: string[];
  // Used to make sure trackEndLevel() doesn't run logic multiple times
  levelsComplete: number,
  gameTimeElapsed: number,
  runStartTime: number,
  runWinTime: number | undefined,
  runEndTime: number | undefined,
}
// This function can be used to initialize or reset globalStats
export function EmptyGlobalStatistics(stats?: IGlobalStats): IGlobalStats {
  return Object.assign(stats || {}, {
    bestSpell: { unitsKilled: 0, spell: [] },
    longestSpell: [],
    levelsComplete: 0,
    gameTimeElapsed: 0,
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
  unitDeaths: number;
  myPlayerDamageTaken: number;
  myPlayerDeaths: number;
  cardsCast: number;
  myPlayerArrowsFired: number;
  myPlayerCursesPurified: number;
}
// This function can be used to initialize or reset a statistics object
export function EmptyStatistics(stats?: IStatistics): IStatistics {
  return Object.assign(stats || {}, {
    unitDeaths: 0,
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

export function clearAllStatsAtDepth(depth: StatDepth) {
  LogStats();
  for (let i = depth; i < allStats.length; i++) {
    console.log("Clearing stats at depth:", StatDepth[i])
    EmptyStatistics(allStats[i])
  }
}

export function LogStats() {
  console.log("[STATS]", allStats);
  //console.log("[STATS] - LIFETIME", allStats[StatDepth.LIFETIME]);
  //console.log("[STATS] - RUN", allStats[StatDepth.RUN]);
  //console.log("[STATS] - LEVEL", allStats[StatDepth.LEVEL]);
  //console.log("[STATS] - SPELL", allStats[StatDepth.SPELL]);
}

//

const GAME_STATISTICS_STORAGE_KEY = "Game Statistics - Lifetime";
export function SaveLifetimeStats() {
  const statsToSave = allStats[StatDepth.LIFETIME];
  if (statsToSave) {
    storageSet(GAME_STATISTICS_STORAGE_KEY, JSON.stringify(statsToSave));
  }
}
export function LoadLifetimeStats() {
  const loadedString = storageGet(GAME_STATISTICS_STORAGE_KEY);
  if (loadedString) {
    const loadedStats = JSON.parse(loadedString);
    if (loadedStats) {
      allStats[StatDepth.LIFETIME] = loadedStats;
    }
  }
}

export function LoadRunStatsToUnderworld(stats: IStatistics[]) {
  // Lifetime stats should NOT be overwritten, only stats related to the current run
  if (stats[StatDepth.LIFETIME] && allStats[StatDepth.LIFETIME]) {
    stats[StatDepth.LIFETIME] = allStats[StatDepth.LIFETIME];
    Object.assign(allStats, stats);
  } else {
    console.error("Something went wrong with loading stats.")
  }
}

//

interface trackUnitDamageArgs {
  unit: Unit.IUnit,
  amount: number,
}
export function trackUnitDamage(args: trackUnitDamageArgs, underworld: Underworld, prediction: boolean) {
  let { unit, amount } = args;
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
}
export function trackUnitDie(args: trackUnitDieArgs, underworld: Underworld, prediction: boolean) {
  if (prediction) {
    return;
  }
  let { unit } = args;

  allStatsAtDepth(StatDepth.SPELL).forEach(s => s.unitDeaths += 1);

  if (unit == globalThis.player?.unit) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerDeaths += 1);
  }
}

interface trackCastCardsArgs {
  effectState: Cards.EffectState,
}
export function trackCastCardsStart(args: trackCastCardsArgs, underworld: Underworld, prediction: boolean) {
  let { effectState } = args;
  if (prediction) {
    return;
  }

  clearAllStatsAtDepth(StatDepth.SPELL);

  if (effectState.casterPlayer == globalThis.player) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.cardsCast += effectState.cardIds.length);
  }
}
export function trackCastCardsEnd(args: trackCastCardsArgs, underworld: Underworld, prediction: boolean) {
  let { effectState } = args;
  if (prediction) {
    return;
  }

  if (allStats[StatDepth.SPELL]) {
    const unitDeaths = allStats[StatDepth.SPELL].unitDeaths;

    if (effectState.casterPlayer == globalThis.player) {
      if (globalStats.bestSpell.unitsKilled < unitDeaths) {
        globalStats.bestSpell.unitsKilled = unitDeaths;
        globalStats.bestSpell.spell = effectState.cardIds;
      }
      if (globalStats.longestSpell.length < effectState.cardIds.length) {
        globalStats.longestSpell = effectState.cardIds;
      }
    }
  }

  Achievements.UnlockEvent_CastCards(underworld);
  clearAllStatsAtDepth(StatDepth.SPELL);
}

interface trackArrowFiredArgs {
  sourceUnit: Unit.IUnit,
}
export function trackArrowFired(args: trackArrowFiredArgs, underworld: Underworld, prediction: boolean) {
  let { sourceUnit } = args;
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
}
export function trackCursePurified(args: trackCursePurifiedArgs, underworld: Underworld, prediction: boolean) {
  let { unit, sourceUnit } = args;
  if (prediction) {
    return;
  }

  if (sourceUnit == globalThis.player?.unit) {
    allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerCursesPurified += 1);
  }
}

export function trackEndLevel(underworld: Underworld) {
  // We can check if this function has already been called for this level
  // via globalStats.levelsComplete, and return early if so
  if (globalStats.levelsComplete > underworld.levelIndex) {
    return;
  }
  globalStats.levelsComplete = underworld.levelIndex + 1;

  // Store highest level reached - In case of hotseat, store it for each player
  let clientPlayers = underworld.players.filter(p => p.clientId == globalThis.clientId);
  for (let player of clientPlayers) {
    const mageTypeFarthestLevelKey = storage.getStoredMageTypeFarthestLevelKey(player.mageType || 'Spellmason');
    const highScore = parseInt(storageGet(mageTypeFarthestLevelKey) || '0')
    if (highScore < globalStats.levelsComplete) {
      console.log('New farthest level record!', mageTypeFarthestLevelKey, '->', globalStats.levelsComplete);
      storageSet(mageTypeFarthestLevelKey, (globalStats.levelsComplete).toString());
    }
  }

  // If this was the last level, run win-game logic
  if (underworld.levelIndex == LAST_LEVEL_INDEX) {
    if (!globalStats.runWinTime) {
      globalStats.runWinTime = Date.now();

      // Store wins - In case of hotseat, store it for each player
      let clientPlayers = underworld.players.filter(p => p.clientId == globalThis.clientId);
      for (let player of clientPlayers) {
        const mageTypeWinsKey = storage.getStoredMageTypeWinsKey(player.mageType || 'Spellmason');
        const currentMageTypeWins = parseInt(storageGet(mageTypeWinsKey) || '0');
        storageSet(mageTypeWinsKey, (currentMageTypeWins + 1).toString());
      }
    }
  }

  Achievements.UnlockEvent_EndOfLevel(underworld);
  clearAllStatsAtDepth(StatDepth.LEVEL);
}

export function trackGameStart() {
  EmptyGlobalStatistics(globalStats);
}

export function trackGameEnd() {
  if (!globalStats.runEndTime) {
    globalStats.runEndTime = Date.now();
  }
}