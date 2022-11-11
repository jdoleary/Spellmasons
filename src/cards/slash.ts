import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { randFloat } from '../jmath/rand';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const id = 'Slash';
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
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconHurt.png',
    animationPath,
    sfx: 'hurt',
    description: `
Deals ${damageDone} damage
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let animationDelaySum = 0;
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive)
      animationDelaySum = 0;
      let delayBetweenAnimations = delayBetweenAnimationsStart;
      // Note: quantity loop should always be INSIDE of the targetedUnits loop
      // so that any quantity-based animations will play simultaneously on multiple targets
      // but sequentially within themselves (on a single target, e.g. multiple hurts over and over)
      for (let q = 0; q < quantity; q++) {
        if (!prediction) {
          setTimeout(() => {
            playDefaultSpellSFX(card, prediction);
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
                Unit.takeDamage(unit, damageDone, state.casterUnit, underworld, prediction, state);
              }, 100)
            }
          }, animationDelaySum)
          animationDelaySum += delayBetweenAnimations;
          // Don't let it go below 100 milliseconds
          delayBetweenAnimations = Math.max(100, delayBetweenAnimations);
          // Juice: Speed up subsequent hits
          delayBetweenAnimations *= 0.80
        } else {
          for (let unit of targets) {
            Unit.takeDamage(unit, damageDone, state.casterUnit, underworld, prediction, state);
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
