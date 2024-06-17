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
function calculateRendDamage(baseDamage: number, quantity: number): number {
  let stackDamageMult = 0;
  for (let i = 1; i < quantity + 1; i++) {
    stackDamageMult += i;
  }
  return baseDamage * stackDamageMult;
}
const baseDamageMult = 0.5;
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
    description: ['spell_rend', rendDescription()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const damage = calculateRendDamage(Unit.GetSpellDamage(state.casterUnit.damage, baseDamageMult), quantity);
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

// Returns damage values for the first 10 stacks of rend
function rendDescription(): string {
  const baseDamage = Unit.GetSpellDamage(undefined, baseDamageMult);
  return `${calculateRendDamage(baseDamage, 1)}, ${calculateRendDamage(baseDamage, 2)}, ${calculateRendDamage(baseDamage, 3)}, ${calculateRendDamage(baseDamage, 4)}, ${calculateRendDamage(baseDamage, 5)}, ${calculateRendDamage(baseDamage, 6)}, ${calculateRendDamage(baseDamage, 7)}, ${calculateRendDamage(baseDamage, 8)}, ${calculateRendDamage(baseDamage, 9)}, ${calculateRendDamage(baseDamage, 10)}`
}

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