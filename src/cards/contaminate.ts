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
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconContaminate.png',
    description: 'spell_contaminate',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter((u) => u.alive)) {
        await spreadCurses(
          state.casterPlayer,
          unit,
          underworld,
          state.aggregator.radius,
          prediction,
        );
      }
      return state;
    },
  },
};
export default spell;

async function spreadCurses(
  casterPlayer: IPlayer | undefined,
  unit: IUnit,
  underworld: Underworld,
  extraRadius: number,
  prediction: boolean,
) {
  const range =
    (COLLISION_MESH_RADIUS * 4 + extraRadius) *
    (casterPlayer?.mageType == 'Witch' ? 1.5 : 1);
  drawUICircle(unit, range, colors.targetingSpellGreen, 'Contagion Radius');
  const nearByUnits = underworld
    .getUnitsWithinDistanceOfTarget(unit, range, prediction)
    // Filter out undefineds
    .filter((x) => x !== undefined)
    // Do not spread to dead units
    .filter((x) => x?.alive)
    // Filter out self
    .filter((x) => x !== unit) as IUnit[];
  const curseCardsData: { card: ICard; quantity: number }[] = Object.entries(
    unit.modifiers,
  )
    // Only curses are contagious
    // Do not spread contaminate itself
    .filter(
      ([cardId, modValue]) => modValue.isCurse && cardId !== contaminate_id,
    )
    .map(([id, mod]) => ({ card: allCards[id], quantity: mod.quantity }))
    .filter((x) => x.card !== undefined) as { card: ICard; quantity: number }[];

  for (let { card, quantity } of curseCardsData) {
    const promises = [];
    // Filter out units that already have this curse
    for (let touchingUnit of nearByUnits.filter(
      (u) => !Object.keys(u.modifiers).includes(card.id),
    )) {
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
        Unit.addModifier(
          touchingUnit,
          card.id,
          underworld,
          prediction,
          quantity,
        );
      });
    }
    await Promise.all(promises);
  }
}
