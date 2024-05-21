import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Image from '../graphics/Image';
import { clone, Vec2 } from '../jmath/Vec';
import { raceTimeout } from '../Promise';

export const rendCardId = 'Rend';
function calculateRendDamage(stack: number): number {
  let damage = 0;
  for (let i = 1; i < stack + 1; i++) {
    damage += i;
  }
  return damage * 10;
}
const spellRendAnimationHeight = 10;
const animationPath = 'spell-effects/spellRend';
const spell: Spell = {
  card: {
    id: rendCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconRend.png',
    animationPath,
    sfx: 'rend',
    description: ['spell_rend', `${calculateRendDamage(1)}, ${calculateRendDamage(2)}, ${calculateRendDamage(3)}, ${calculateRendDamage(4)}, ${calculateRendDamage(5)}, ${calculateRendDamage(6)}, ${calculateRendDamage(7)}, ${calculateRendDamage(8)}, ${calculateRendDamage(9)}, ${calculateRendDamage(10)}`],
    timeoutMs: 576,
    effect: async (state, card, quantity, underworld, prediction) => {
      const damage = calculateRendDamage(quantity);
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive)
      if (!prediction) {
        playDefaultSpellSFX(card, prediction);
      }
      await animateRend(targets, quantity, prediction);
      for (let unit of targets) {
        Unit.takeDamage({
          unit: unit,
          amount: damage,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit,
        }, underworld, prediction);
      }
      return state;
    },
  },
};
export default spell;
function animateRend(targets: Vec2[], quantity: number, prediction: boolean): Promise<void> {
  if (prediction || globalThis.headless) {
    return Promise.resolve();
  } else {
    return raceTimeout(500 + 120 * quantity, 'animateRend',
      new Promise<void>((resolve) => {
        // Resolve immediately if there are no targets
        if (targets.length == 0) {
          resolve();
          return
        }
        // Limit animated quantity to 7 (anything beyond that is absurd from an animation standpoint and takes too long)
        quantity = Math.min(7, quantity);
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
  }

}