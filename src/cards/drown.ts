import { containerSpells } from '../graphics/PixiUtils';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import * as Unit from '../entity/Unit';

export const id = 'Drown';
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const damageDone = 4;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'spellIconDrown.png',
    sfx: 'rend',
    description: `
Deal ${damageDone} damage ONLY if target is submerged.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive)
      if (!prediction) {
        playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
      }
      for (let unit of targets) {
        Unit.takeDamage(unit, damageDone, state.casterUnit, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
