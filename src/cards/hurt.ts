import * as Unit from '../entity/Unit';
import { containerUI } from '../graphics/PixiUtils';
import { randFloat } from '../jmath/rand';
import { CardCategory } from '../types/commonTypes';
import { animateSpell, oneOffImage, playDefaultSpellSFX } from './cardUtils';
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
const animationPath = 'spell-effects/spellHurtCuts';
const delayBetweenAnimationsStart = 400;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'hurt.png',
    animationPath,
    sfx: 'hurt',
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let animationDelaySum = 0;
      for (let unit of state.targetedUnits) {
        animationDelaySum = 0;
        let delayBetweenAnimations = delayBetweenAnimationsStart;
        // Note: quantity loop should always be INSIDE of the targetedUnits loop
        // so that any quantity-based animations will play simultaneously on multiple targets
        // but sequentially within themselves (on a single target, e.g. multiple hurts over and over)
        for (let q = 0; q < quantity; q++) {
          if (!prediction) {
            setTimeout(() => {
              const spellEffectImage = oneOffImage(unit, animationPath, containerUI);
              if (spellEffectImage) {
                // Randomize rotation a bit so that subsequent slashes don't perfectly overlap
                spellEffectImage.sprite.rotation = randFloat(underworld.random, -Math.PI / 6, Math.PI / 6);
                if (q % 2 == 0) {
                  // Flip every other slash animation so that it comes from the other side
                  spellEffectImage.sprite.scale.x = -1;
                }
              }
              playDefaultSpellSFX(card, prediction);
              Unit.takeDamage(unit, damageDone, underworld, prediction, state);
            }, animationDelaySum)
            animationDelaySum += delayBetweenAnimations;
            // Don't let it go below 100 milliseconds
            delayBetweenAnimations = Math.max(100, delayBetweenAnimations);
            // Juice: Speed up subsequent hits
            delayBetweenAnimations *= 0.80
          } else {
            Unit.takeDamage(unit, damageDone, underworld, prediction, state);
          }
        }
      }
      await new Promise((resolve) => {
        setTimeout(resolve, animationDelaySum);
      })
      return state;
    },
  },
};
export default spell;
