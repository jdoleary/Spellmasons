import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { forcePush } from './push';

export const id = 'repel';
export const velocityStartMagnitude = 10;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconRepel.png',
    description: `
Pushes the target(s) away from the cast location.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const awayFrom = state.castLocation;
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(forcePush(entity, awayFrom, velocityStartMagnitude * quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};

export default spell;
