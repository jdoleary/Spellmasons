import { HasLife } from '../entity/Type';
import * as Unit from '../entity/Unit';
import { lerp } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX, playSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeBleedParticles } from '../graphics/ParticleCollection';

export const id = 'Bleed';
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
function calculateDamageFromProportion(unit: HasLife, proportionDamage: number): number {
  const damage = Math.ceil(unit.healthMax * proportionDamage);
  return damage;
}
// Deals up to 30% damage
export const bleedInstantKillProportion = 0.30;
function calculateDamageProportion(unit: HasLife): number {
  // proportion is a percentage expressed as 0.0 - 1.0
  const proportionHealthLost = (unit.healthMax - unit.health) / unit.healthMax;
  const proportionDamage = lerp(0, bleedInstantKillProportion, proportionHealthLost / (1 - bleedInstantKillProportion));
  return proportionDamage;
}
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconBleed.png',
    // no animation path, animation is done with particles
    animationPath: '',
    sfx: '',
    description: `
Deals more damage based on how much health the target is missing.

For example:
Target with ${bleedInstantKillProportion * 100}% health will die.
${[40, 65, 90].map(health => `Target with ${health}% health will take ${Math.floor(calculateDamageProportion({ health, healthMax: 100, alive: true }) * 100)}% of max health as damage`).join(`
`)}
Target with full health will take no damage.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise<void>((resolve) => {
        // .filter: only target living units
        const targets = state.targetedUnits.filter(u => u.alive)
        let biggestProportion = 0;
        for (let unit of targets) {
          const proportion = calculateDamageProportion(unit);
          if (proportion > biggestProportion) {
            biggestProportion = proportion;
          }
          const damage = calculateDamageFromProportion(unit, proportion);
          if (!prediction) {
            makeBleedParticles(unit, prediction, proportion, resolve);
          }
          Unit.takeDamage(unit, damage, state.casterUnit, underworld, prediction, state);
        }
        if (!prediction) {
          if (biggestProportion < bleedInstantKillProportion / 3) {
            playSpellSFX('bleedSmall', prediction);
          } else if (biggestProportion < 2 * bleedInstantKillProportion / 3) {
            playSpellSFX('bleedMedium', prediction);
          } else {
            playSpellSFX('bleedLarge', prediction);

          }
        }
        if (prediction) {
          resolve();
        }
      });
      return state;
    },
  },
};
export default spell;
