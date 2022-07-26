import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';

export const id = 'hurt';
const damageDone = 2;
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'hurt.png',
    animationPath: 'spell-effects/spellHurtCuts',
    sfx: 'hurt',
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    effect: async (state, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.takeDamage(unit, damageDone * quantity, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
