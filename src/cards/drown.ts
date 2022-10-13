import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';

export const id = 'Drown';
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
    thumbnail: 'spellIconDrown.png',
    animationPath,
    sfx: 'rend',
    description: `
Deal damage if target is submerged in water
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise<void>((resolve) => {
        //   const damage = calculateRendDamage(quantity);
        //   // .filter: only target living units
        //   const targets = state.targetedUnits.filter(u => u.alive)
        //   if (!prediction) {
        //     playDefaultSpellSFX(card, prediction);
        //     for (let unit of targets) {
        //       oneOffImage(unit, animationPath, containerSpells, resolve);
        //       const spellEffectImage = oneOffImage(unit, animationPath, containerSpells, resolve);
        //       if (spellEffectImage) {
        //         spellEffectImage.sprite.scale.x = -1;
        //       }
        //       Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
        //     }
        //   } else {
        //     for (let unit of targets) {
        //       Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
        //     }
        resolve();
        //   }
      });
      return state;
    },
  },
};
export default spell;
