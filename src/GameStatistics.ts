import * as Unit from './entity/Unit';
import * as Cards from './cards';

//

export interface IStatistics {
  cardsCast: number;
  myPlayerArrowsFired: number;
  myPlayerDamageTaken: number;
}

// This function can be used to initialize or reset a statistics object
function EmptyStatistics(stats?: IStatistics): IStatistics {
  return Object.assign(stats || {}, {
    cardsCast: 0,
    myPlayerArrowsFired: 0,
    myPlayerDamageTaken: 0,
  })
}

export const totalStatistics: IStatistics = EmptyStatistics();
export const runStatistics: IStatistics = EmptyStatistics();
export const levelStatistics: IStatistics = EmptyStatistics();
export const spellStatistics: IStatistics = EmptyStatistics();

export function TestStats() {
  // This is a test function called once in makeOverworld
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

  EmptyStatistics(spellStatistics);
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