
import type { IUnit } from '../entity/Unit';
import { allCards, ICard, Spell } from './index';
import { COLLISION_MESH_RADIUS } from '../config';
import { createVisualLobbingProjectile } from '../entity/Projectile';
import floatingText from '../graphics/FloatingText';
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { drawUICircle } from '../graphics/PlanningView';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { IPlayer } from '../entity/Player';

export const contaminate_id = 'contaminate';

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
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        await contaminate(state.casterPlayer, unit, underworld, state.aggregator.radius, prediction, quantity);
      }
      return state;
    },
  },
};
export default spell;

// separate function to handle synchronous recursion and animation - avoids long wait times
async function contaminate(casterPlayer: IPlayer | undefined, unit: IUnit, underworld: Underworld, extraRadius: number, prediction: boolean, quantity: number) {
  const range = (COLLISION_MESH_RADIUS * 4 + extraRadius) * (casterPlayer?.mageType == 'Witch' ? 1.5 : 1);

  // the units to spread contaminate from, initally just unit, then only the latest additions to the chain
  let nextUnits: IUnit[] = [];
  let ignore: IUnit[] = []
  nextUnits.push(unit);
  ignore.push(unit);

  let recursion = 1;
  while (recursion <= quantity) {
    const promises = [];
    for (let nextUnit of nextUnits) {
      promises.push(spreadCurses(nextUnit, range, underworld, prediction, ignore));
    }
    nextUnits = [];
    let affectedUnitsArrays = await Promise.all(promises);

    for (let affectedUnits of affectedUnitsArrays) {
      //add all affected units, but make sure there are no duplicates
      nextUnits = nextUnits.concat(affectedUnits.filter(u => !nextUnits.includes(u)));
      ignore = ignore.concat(affectedUnits.filter(u => !ignore.includes(u)));
    }
    recursion += 1;
  }
}

async function spreadCurses(unit: IUnit, range: number, underworld: Underworld, prediction: boolean, ignore: IUnit[]): Promise<IUnit[]> {
  drawUICircle(unit, range, colors.targetingSpellGreen, 'Contagion Radius');

  const nearbyUnits = underworld.getUnitsWithinDistanceOfTarget(unit, range, prediction)
    // Filter out undefineds
    .filter(x => x !== undefined)
    // Do not spread to dead units
    .filter(x => x?.alive)
    // Filter out self
    .filter(x => x != unit)
    // Filter out other ignored units
    .filter(x => !ignore.includes(x)) as IUnit[];

  const curseCardsData: { card: ICard, quantity: number }[] = Object.entries(unit.modifiers)
    // Only curses are contagious
    // Do not spread contaminate itself
    .filter(([cardId, modValue]) => modValue.isCurse && cardId !== contaminate_id)
    .map(([id, mod]) => ({ card: allCards[id], quantity: mod.quantity }))
    .filter(x => x.card !== undefined) as { card: ICard, quantity: number }[];

  //temporary fix for curses being to same unit spread in different order
  curseCardsData.sort((a, b) => a.card.id.localeCompare(b.card.id))
  //consider what order curses are spread in
  //i.e. suffocate before bloat

  for (let { card, quantity } of curseCardsData) {
    const promises = [];
    // Add and overwrite lower quantity curses for all nearby units
    for (let touchingUnit of nearbyUnits) {
      const existingQuantity = touchingUnit.modifiers[card.id]?.quantity as number;
      if (existingQuantity == undefined || existingQuantity < quantity) {
        const quantityToAdd = quantity - (existingQuantity != undefined ? existingQuantity : 0);
        Unit.addModifier(touchingUnit, card.id, underworld, prediction, quantityToAdd);
      }

      let animationPromise = Promise.resolve();
      if (!prediction) {
        // Visually show the contageon
        animationPromise = createVisualLobbingProjectile(
          unit,
          touchingUnit,
          'projectile/poisonerProjectile',
        ).then(() => {
          floatingText({ coords: touchingUnit, text: card.id });
        });
        promises.push(animationPromise);
      }
      // Spread the curse after the animation promise completes
      animationPromise.then(() => {
        if (!prediction) {
          playSFXKey('contageousSplat');
        }
      });
    }
    await Promise.all(promises);
  }

  return nearbyUnits;
}