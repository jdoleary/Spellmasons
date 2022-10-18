import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { pull } from './pull';
import { CardRarity, probabilityMap } from '../graphics/ui/CardUI';

export const id = 'vortex';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'pull',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconVortex.png',
    description: `
Pulls the target(s) towards the cast location.
Note: ${id} is best used with a Targeting spell so that the cast location is far away from the target.  Try using it with Connect or Target Cone to get a feel for how it works.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      playDefaultSpellSFX(card, prediction);
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        promises.push(pull(entity, state.castLocation, quantity, underworld, prediction));
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
