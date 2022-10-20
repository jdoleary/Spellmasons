import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { pull } from './pull';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const id = 'Dash';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'dash',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconDash.png',
    description: `
Pulls the caster towards the target(s).
${id} must be cast on a target such as a unit or pickup.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      for (let entity of targets) {
        playDefaultSpellSFX(card, prediction);
        await pull(state.casterUnit, entity, quantity, underworld, prediction);
      }
      return state;
    },
  },
};
const velocity_falloff = 0.93;
export default spell;
