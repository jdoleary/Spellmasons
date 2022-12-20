import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Image from '../graphics/Image';
import { clone, Vec2 } from '../jmath/Vec';
import { raceTimeout } from '../Promise';

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
const spellRendAnimationHeight = 10;
const animationPath = 'spell-effects/spellRend';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 8,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconRend.png',
    animationPath,
    sfx: 'rend',
    description: `
Deals more damage based on the number of consecutive stacks of "${id}".
How total damage grows when stacking: ${calculateRendDamage(1)}, ${calculateRendDamage(2)}, ${calculateRendDamage(3)}, ${calculateRendDamage(4)}, ${calculateRendDamage(5)}, ${calculateRendDamage(6)}, ${calculateRendDamage(7)}, ${calculateRendDamage(8)}, ${calculateRendDamage(9)}, ${calculateRendDamage(10)}`,
    effect: async (state, card, quantity, underworld, prediction) => {
      const damage = calculateRendDamage(quantity);
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive)
      if (!prediction) {
        playDefaultSpellSFX(card, prediction);
      }
      await animateRend(targets, quantity, prediction);
      for (let unit of targets) {
        Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
function animateRend(targets: Vec2[], quantity: number, prediction: boolean): Promise<void> {
  if (!prediction) {
    return raceTimeout(500 + 120 * quantity, 'animateRend',
      new Promise<void>((resolve) => {
        for (let unit of targets) {
          // For rend effect only, make more instances going upward for each quantity
          for (let q = 0; q < quantity; q++) {
            const isLastAnimatedInstance = q == quantity - 1;
            setTimeout(() => {
              const image = Image.create(
                { x: unit.x, y: unit.y - ((quantity - 1) * spellRendAnimationHeight / 2) + q * spellRendAnimationHeight },
                animationPath,
                containerSpells,
                {
                  loop: false,
                  animationSpeed: 0.2,
                  onComplete: () => {
                    Image.hide(image)
                    Image.cleanup(image);
                    if (isLastAnimatedInstance) {

                      resolve()
                    }
                  }
                }
              );
              if (image && isLastAnimatedInstance) {
                image.resolver = resolve;
              }
            }, 100 * q);
          }
        }
      }));
  } else {
    return Promise.resolve();
  }

}