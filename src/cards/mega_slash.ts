import * as Unit from '../entity/Unit';
import { containerSpells } from '../graphics/PixiUtils';
import { randFloat } from '../jmath/rand';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { heavyslashCardId } from './heavy_slash';

export const megaSlashCardId = 'Mega Slash';
const damageDone = 80;
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
    id: megaSlashCardId,
    replaces: [heavyslashCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 34,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconMegaSlash.png',
    animationPath,
    sfx: 'hurt3',
    description: ['spell_slash', damageDone.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let animationDelaySum = 0;
      // .filter: only target living units
      const targets = state.targetedUnits.filter((u) => u.alive);
      animationDelaySum = 0;
      let delayBetweenAnimations = delayBetweenAnimationsStart;
      // Note: quantity loop should always be INSIDE of the targetedUnits loop
      // so that any quantity-based animations will play simultaneously on multiple targets
      // but sequentially within themselves (on a single target, e.g. multiple hurts over and over)
      for (let q = 0; q < quantity; q++) {
        if (!prediction && !globalThis.headless) {
          setTimeout(() => {
            playDefaultSpellSFX(card, prediction);
            for (let unit of targets) {
              const spellEffectImage = oneOffImage(
                unit,
                animationPath,
                containerSpells,
              );
              if (spellEffectImage) {
                // Randomize rotation a bit so that subsequent slashes don't perfectly overlap
                spellEffectImage.sprite.rotation = randFloat(
                  -Math.PI / 6,
                  Math.PI / 6,
                );
                if (q % 2 == 0) {
                  // Flip every other slash animation so that it comes from the other side
                  spellEffectImage.sprite.scale.x = -1;
                }
                // Scale for MEGA SLASH
                spellEffectImage.sprite.scale.x *= 4;
                spellEffectImage.sprite.scale.y *= 4;
              }
              setTimeout(() => {
                Unit.takeDamage(
                  unit,
                  damageDone,
                  state.casterUnit,
                  underworld,
                  prediction,
                  state,
                );
              }, 100);
            }
          }, animationDelaySum);
          animationDelaySum += delayBetweenAnimations;
          // Don't let it go below 20 milliseconds
          delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
          // Juice: Speed up subsequent hits
          delayBetweenAnimations *= 0.8;
        } else {
          for (let unit of targets) {
            Unit.takeDamage(
              unit,
              damageDone,
              state.casterUnit,
              underworld,
              prediction,
              state,
            );
          }
        }
      }
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, animationDelaySum);
        });
      }
      return state;
    },
  },
};
export default spell;
