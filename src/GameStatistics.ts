import * as Unit from './entity/Unit';
import * as Cards from './cards';
import * as Achievements from './Achievements';
import * as storage from "./storage";
import Underworld from './Underworld';
import { LAST_LEVEL_INDEX } from './config';

//

// Underworld Stats are only stored once, and we don't care "when" they happened
export const underworldStats: IGlobalStats = EmptyGlobalStatistics();
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
// Game Stats help us keep track of game events as they progress
// and are separated by when they occured for the purpose of achievements
export const gameStats: IStatistics[] = [
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

function gameStatsAtDepth(depth: StatDepth): IStatistics[] {
  return gameStats.slice(0, depth + 1);
}

export function clearGameStatsAtDepth(depth: StatDepth) {
  LogStats();
  for (let i = depth; i < gameStats.length; i++) {
    console.log("Clearing stats at depth:", StatDepth[i])
    EmptyStatistics(gameStats[i])
  }
}

export function LogStats() {
  console.log("[STATS]", gameStats);
  //console.log("[STATS] - LIFETIME", gameStats[StatDepth.LIFETIME]);
  //console.log("[STATS] - RUN", gameStats[StatDepth.RUN]);
  //console.log("[STATS] - LEVEL", gameStats[StatDepth.LEVEL]);
  //console.log("[STATS] - SPELL", gameStats[StatDepth.SPELL]);
}

//

const GAME_STATISTICS_STORAGE_KEY = "Game Statistics - Lifetime";
export function SaveLifetimeStats() {
  const statsToSave = gameStats[StatDepth.LIFETIME];
  if (statsToSave) {
    storageSet(GAME_STATISTICS_STORAGE_KEY, JSON.stringify(statsToSave));
  }
}
export function LoadLifetimeStats() {
  const loadedString = storageGet(GAME_STATISTICS_STORAGE_KEY);
  if (loadedString) {
    const loadedStats = JSON.parse(loadedString);
    if (loadedStats) {
      gameStats[StatDepth.LIFETIME] = loadedStats;
    }
  }
}

export function LoadRunStatsToUnderworld(stats: IStatistics[]) {
  // Lifetime stats should NOT be overwritten, only stats related to the current underworld
  // I.E. Run/Level/Spell stats
  // This prevents cheesing achievements by loading an empty stats list at the end of the game
  if (stats[StatDepth.LIFETIME] && gameStats[StatDepth.LIFETIME]) {
    stats[StatDepth.LIFETIME] = gameStats[StatDepth.LIFETIME];
    Object.assign(gameStats, stats);
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
      gameStatsAtDepth(StatDepth.LEVEL).forEach(s => s.myPlayerDamageTaken += amount);
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

  gameStatsAtDepth(StatDepth.SPELL).forEach(s => s.unitDeaths += 1);

  if (unit == globalThis.player?.unit) {
    gameStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerDeaths += 1);
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

  clearGameStatsAtDepth(StatDepth.SPELL);

  if (effectState.casterPlayer == globalThis.player) {
    gameStatsAtDepth(StatDepth.SPELL).forEach(s => s.cardsCast += effectState.cardIds.length);
  }
}
export function trackCastCardsEnd(args: trackCastCardsArgs, underworld: Underworld, prediction: boolean) {
  let { effectState } = args;
  if (prediction) {
    return;
  }

  if (gameStats[StatDepth.SPELL]) {
    const unitDeaths = gameStats[StatDepth.SPELL].unitDeaths;

    if (effectState.casterPlayer == globalThis.player) {
      if (underworldStats.bestSpell.unitsKilled < unitDeaths) {
        underworldStats.bestSpell.unitsKilled = unitDeaths;
        underworldStats.bestSpell.spell = effectState.cardIds;
      }
      if (underworldStats.longestSpell.length < effectState.cardIds.length) {
        underworldStats.longestSpell = effectState.cardIds;
      }
    }
  }

  Achievements.UnlockEvent_CastCards(underworld);
  clearGameStatsAtDepth(StatDepth.SPELL);
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
    gameStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerArrowsFired += 1);
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
    gameStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerCursesPurified += 1);
  }
}

export function trackEndLevel(underworld: Underworld) {
  // We can check if this function has already been called for this level
  // via globalStats.levelsComplete, and return early if so
  if (underworldStats.levelsComplete > underworld.levelIndex) {
    return;
  }
  underworldStats.levelsComplete = underworld.levelIndex + 1;

  // Store highest level reached - In case of hotseat, store it for each player
  let clientPlayers = underworld.players.filter(p => p.clientId == globalThis.clientId);
  for (let player of clientPlayers) {
    const mageTypeFarthestLevelKey = storage.getStoredMageTypeFarthestLevelKey(player.mageType || 'Spellmason');
    const highScore = parseInt(storageGet(mageTypeFarthestLevelKey) || '0')
    if (highScore < underworldStats.levelsComplete) {
      console.log('New farthest level record!', mageTypeFarthestLevelKey, '->', underworldStats.levelsComplete);
      storageSet(mageTypeFarthestLevelKey, (underworldStats.levelsComplete).toString());
    }
  }

  // If this was the last level, run win-game logic
  if (underworld.levelIndex == LAST_LEVEL_INDEX) {
    if (!underworldStats.runWinTime) {
      underworldStats.runWinTime = Date.now();

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
  clearGameStatsAtDepth(StatDepth.LEVEL);
}

export function trackGameStart() {
  EmptyGlobalStatistics(underworldStats);
}

export function trackGameEnd() {
  if (!underworldStats.runEndTime) {
    underworldStats.runEndTime = Date.now();
  }
}