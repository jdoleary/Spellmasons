import * as Unit from './entity/Unit';
import * as Cards from './cards';

//

export interface IStatistics {
  cardsCast: number;
  myPlayerArrowsFired: number;
  myPlayerDamageTaken: number;
}

// How can we initialize these without manually typing everything out 3+ times?
export const totalStatistics: IStatistics = { cardsCast: 0, myPlayerArrowsFired: 0, myPlayerDamageTaken: 0 };
export const runStatistics: IStatistics = { cardsCast: 0, myPlayerArrowsFired: 0, myPlayerDamageTaken: 0 };
export const levelStatistics: IStatistics = { cardsCast: 0, myPlayerArrowsFired: 0, myPlayerDamageTaken: 0 };
export const spellStatistics: IStatistics = { cardsCast: 0, myPlayerArrowsFired: 0, myPlayerDamageTaken: 0 };

export function TestStats() {
  // This is a test function called once in makeOverworld
}

function ClearStatistics(stats: IStatistics) {
  stats.cardsCast = 0;
  stats.myPlayerArrowsFired = 0;
  stats.myPlayerDamageTaken = 0;
}

//

interface trackCastCardsArgs {
  effectState: Cards.EffectState,
  prediction: boolean,
}
export function trackCastCards(args: trackCastCardsArgs) {
  let { effectState, prediction } = args;
  if (prediction) {
    return;
  }

  ClearStatistics(spellStatistics);
  if (effectState.casterPlayer == globalThis.player) {
    spellStatistics.cardsCast += effectState.cardIds.length;
  }
}

interface trackArrowFiredArgs {
  prediction: boolean,
}
export function trackArrowFired(args: trackArrowFiredArgs) {
  let { prediction } = args;
  if (prediction) {
    return;
  }

  spellStatistics.myPlayerArrowsFired += 1;
}

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
      totalStatistics.myPlayerDamageTaken += amount;
    }
  }
}