
import type { IUnit } from '../entity/Unit';
import { allCards, ICard, Spell } from './index';
import { COLLISION_MESH_RADIUS } from '../config';
import { createVisualLobbingProjectile } from '../entity/Projectile';
import floatingText from '../graphics/FloatingText';
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { IPlayer } from '../entity/Player';
import { Modifier } from './util';
import { summoningSicknessId } from '../modifierSummoningSickness';
import { corpseDecayId } from '../modifierCorpseDecay';
import { baseExplosionRadius } from '../effects/explode';
import { runeWitchId } from '../modifierWitch';

export const contaminate_id = 'contaminate';
const baseRange = baseExplosionRadius;
const spell: Spell = {
  card: {
    id: contaminate_id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconContaminate.png',
    description: 'spell_contaminate',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      let promises = [];
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        promises.push(contaminate(state.casterPlayer, unit, quantity, state.aggregator.radiusBoost, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;

interface CurseData {
  modId: string,
  modifier: Modifier
}

// separate function to handle synchronous recursion and animation - avoids long wait times
export async function contaminate(casterPlayer: IPlayer | undefined, unit: IUnit, quantity: number, radiusBoost: number, underworld: Underworld, prediction: boolean) {
  // Contaminate does not get extra radius from quantity,
  // but can instead chain an additional time
  // +25% range per radius boost
  const adjustedRange = baseRange * (1 + (0.25 * radiusBoost)) * (casterPlayer?.unit.modifiers[runeWitchId] ? 1.5 : 1);

  // the units to spread contaminate from
  // initally just this unit, then only the latest additions to the chain
  let nextUnits: IUnit[] = [];
  let ignore: IUnit[] = []
  nextUnits.push(unit);
  ignore.push(unit);

  // we should only spread the initially targeted unit's  curses
  const modifiersToExclude = [summoningSicknessId, corpseDecayId]
  const curses: CurseData[] = Object.entries(unit.modifiers)
    .map(([id, mod]) => ({ modId: id, modifier: mod }))
    .filter(x => x.modifier.isCurse)
    .filter(x => !modifiersToExclude.includes(x.modId));

  // currently spreads curses in the order they appear on the initially targeted unit.
  // consider what order curses are spread in
  // i.e. bloat or suffocate first?

  // sort to change spread order
  //curses.sort((a, b) => a.modId.localeCompare(b.modId))

  // multicasting allows Contaminate to chain off of nearby enemies
  let recursions = 0;
  while (recursions < quantity) {
    const promises = [];
    for (let nextUnit of nextUnits) {
      promises.push(spreadCurses(nextUnit, ignore, curses, adjustedRange, underworld, prediction));
    }
    nextUnits = [];
    let affectedUnitsArrays = await Promise.all(promises);

    for (let affectedUnits of affectedUnitsArrays) {
      //add all affected units, but make sure there are no duplicates
      nextUnits = nextUnits.concat(affectedUnits.filter(u => !nextUnits.includes(u)));
      ignore = ignore.concat(affectedUnits.filter(u => !ignore.includes(u)));
    }
    recursions += 1;
  }
}

async function spreadCurses(unit: IUnit, ignore: IUnit[], curses: CurseData[], range: number, underworld: Underworld, prediction: boolean): Promise<IUnit[]> {

  if (prediction) {
    drawUICirclePrediction(unit, range, colors.healthRed, 'Contagion Radius');
  }

  const nearbyUnits = underworld.getUnitsWithinDistanceOfTarget(unit, range, prediction)
    // Filter out undefineds
    .filter(x => x !== undefined)
    // Do not spread to dead units
    .filter(x => x?.alive)
    // Filter out self
    .filter(x => x != unit)
    // Filter out other ignored units
    .filter(x => !ignore.includes(x)) as IUnit[];

  for (let curse of curses) {
    const promises = [];
    // Add and overwrite lower quantity curses for all nearby units
    for (let touchingUnit of nearbyUnits) {
      let animationPromise = Promise.resolve();
      if (!prediction) {
        // Visually show the contageon
        animationPromise = createVisualLobbingProjectile(
          unit,
          touchingUnit,
          'projectile/poisonerProjectile',
        )
        promises.push(animationPromise);
      }
      // Spread the curse after the animation promise completes
      animationPromise.then(() => {
        if (!prediction) {
          floatingText({ coords: touchingUnit, text: curse.modId });
          playSFXKey('contageousSplat');
        }
        if (touchingUnit.alive) {
          const existingQuantity = touchingUnit.modifiers[curse.modId]?.quantity as number;
          if (existingQuantity == undefined || existingQuantity < curse.modifier.quantity) {
            const quantityToAdd = curse.modifier.quantity - (existingQuantity != undefined ? existingQuantity : 0);
            Unit.addModifier(touchingUnit, curse.modId, underworld, prediction, quantityToAdd, curse.modifier);
          }
        }
      });
    }
    await Promise.all(promises);
  }

  return nearbyUnits;
}