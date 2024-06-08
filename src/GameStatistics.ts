import * as Unit from './entity/Unit';
import * as Cards from './cards';
import * as Achievements from './Achievements';
import Underworld from './Underworld';

//

export interface IStatistics {
  myPlayerDamageTaken: number;
  cardsCast: number;
  myPlayerArrowsFired: number;
  myPlayerCursesPurified: number;
}

// This function can be used to initialize or reset a statistics object
export function EmptyStatistics(stats?: IStatistics): IStatistics {
  return Object.assign(stats || {}, {
    myPlayerDamageTaken: 0,
    cardsCast: 0,
    myPlayerArrowsFired: 0,
    myPlayerCursesPurified: 0,
  })
}

export enum StatDepth {
  TOTAL,
  RUN,
  LEVEL,
  SPELL,
}
export const allStats: IStatistics[] = [
  EmptyStatistics(), // 0 - Total
  EmptyStatistics(), // 1 - Run
  EmptyStatistics(), // 2 - Level
  EmptyStatistics(), // 3 - Spell
];

function allStatsAtDepth(depth: StatDepth): IStatistics[] {
  return allStats.slice(0, depth + 1);
}

export function LogStats() {
  console.log("[STATS]", allStats);

  console.log("[STATS] - TOTAL", allStats[StatDepth.TOTAL]);
  console.log("[STATS] - RUN", allStats[StatDepth.RUN]);
  console.log("[STATS] - LEVEL", allStats[StatDepth.LEVEL]);
  console.log("[STATS] - SPELL", allStats[StatDepth.SPELL]);
}

//

interface trackDamageArgs {
  unit: Unit.IUnit,
  amount: number,
  prediction: boolean,
}
export function trackDamage(args: trackDamageArgs) {
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

interface trackCastCardsArgs {
  effectState: Cards.EffectState,
  prediction: boolean,
}
export function trackCastCards(args: trackCastCardsArgs) {
  let { effectState, prediction } = args;
  if (prediction) {
    return;
  }

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
  EmptyStatistics(allStats[StatDepth.SPELL]);
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
  sourceUnit: Unit.IUnit,
  prediction: boolean,
}
export function trackCursePurified(args: trackCursePurifiedArgs) {
  let { prediction } = args;
  if (prediction) {
    return;
  }

  allStatsAtDepth(StatDepth.SPELL).forEach(s => s.myPlayerCursesPurified += 1);
}

export function trackEndLevel(underworld: Underworld) {
  Achievements.UnlockEvent_EndOfLevel(underworld);
  EmptyStatistics(allStats[StatDepth.LEVEL]);
}