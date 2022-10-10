import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';

export const id = 'Rend';
function calculateRendDamage(stack: number): number {
  let damage = 0;
  for (let i = 1; i < stack + 1; i++) {
    damage += i;
  }
  return damage;
}
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const animationPath = 'spell-effects/spellHurtCuts';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
    thumbnail: 'unknown.png',
    animationPath,
    sfx: 'rend',
    description: `
Deals more damage based on the number of consecutive stacks of "${id}".
For example:
1 ${id}: ${calculateRendDamage(1)} damage
2 ${id}: ${calculateRendDamage(2)} damage
3 ${id}: ${calculateRendDamage(3)} damage
4 ${id}: ${calculateRendDamage(4)} damage
5 ${id}: ${calculateRendDamage(5)} damage
6 ${id}: ${calculateRendDamage(6)} damage
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise<void>((resolve) => {
        const damage = calculateRendDamage(quantity);
        // .filter: only target living units
        const targets = state.targetedUnits.filter(u => u.alive)
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          for (let unit of targets) {
            oneOffImage(unit, animationPath, containerSpells, resolve);
            const spellEffectImage = oneOffImage(unit, animationPath, containerSpells, resolve);
            if (spellEffectImage) {
              spellEffectImage.sprite.scale.x = -1;
            }
            Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
          }
        } else {
          for (let unit of targets) {
            Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
          }
          resolve();
        }
      });
      return state;
    },
  },
};
export default spell;
