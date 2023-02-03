import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { randFloat } from '../jmath/rand';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const slashCardId = 'Slash';
const damageDone = 20;
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const animationPath = 'spell-effects/spellHurtCuts';
const delayBetweenAnimationsStart = 400;
const sfx = 'hurt';
const spell: Spell = {
  card: {
    id: slashCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconHurt.png',
    animationPath,
    sfx,
    description: ['spell_slash', damageDone.toString()],
    animate: async ({ targetedUnits, casterUnit, quantity }, triggerEffectStage, underworld) => {
      let animationDelaySum = 0;
      const targets = targetedUnits.filter(u => u.alive)
      animationDelaySum = 0;
      let delayBetweenAnimations = delayBetweenAnimationsStart;
      // Note: quantity loop should always be INSIDE of the targetedUnits loop
      // so that any quantity-based animations will play simultaneously on multiple targets
      // but sequentially within themselves (on a single target, e.g. multiple hurts over and over)
      for (let q = 0; q < quantity; q++) {
        setTimeout(() => {
          playSFXKey(sfx);
          for (let unit of targets) {
            const spellEffectImage = oneOffImage(unit, animationPath, containerSpells);
            if (spellEffectImage) {
              // Randomize rotation a bit so that subsequent slashes don't perfectly overlap
              spellEffectImage.sprite.rotation = randFloat(underworld.random, -Math.PI / 6, Math.PI / 6);
              if (q % 2 == 0) {
                // Flip every other slash animation so that it comes from the other side
                spellEffectImage.sprite.scale.x = -1;
              }
            }
            setTimeout(() => {
              triggerEffectStage();
            }, 100)
          }
        }, animationDelaySum)
        animationDelaySum += delayBetweenAnimations;
        // Don't let it go below 100 milliseconds
        delayBetweenAnimations = Math.max(100, delayBetweenAnimations);
        // Juice: Speed up subsequent hits
        delayBetweenAnimations *= 0.80
      }
      await new Promise((resolve) => {
        setTimeout(resolve, animationDelaySum);
      })

    },
    effect2: (calculated, underworld, prediction) => {
      for (let unit of calculated.targetedUnits.filter(u => u.alive)) {
        // TODO WHERE DOES DAMAGE DONE COME FROM? WHAT ABOUT QUANTITY?
        Unit.takeDamage(unit, damageDone, calculated.casterUnit, underworld, prediction);
      }

    },
  },
};
export default spell;
