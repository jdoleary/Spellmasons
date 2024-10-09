import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { refundLastSpell, Spell } from './index';
import { CardCategory, UnitType } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { resurrectWithAnimation } from './resurrect';

export const resurrect_weak_id = 'Weak Resurrect';
export const thumbnail = 'spellIconResurrect.png';
// resStatAmount set due to WEAK resurrect
// Brings stats back to this amount on res
const resStatAmount = 0.1;
const spell: Spell = {
  card: {
    id: resurrect_weak_id,
    category: CardCategory.Soul,
    sfx: 'resurrect',
    manaCost: 70,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap[CardRarity.RARE],
    onlySelectDeadUnits: true,
    thumbnail,
    description: ['spell_resurrect_weak', (resStatAmount * 100).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const animationPromises = [];
      const targets = state.targetedUnits;
      let resurrectedUnitCount = 0;
      for (let unit of targets) {
        if (unit && !unit.alive && !unit.flaggedForRemoval) {
          animationPromises.push(resurrectWithAnimation(unit, state.casterUnit, state.casterUnit.faction, underworld, prediction, 0xf1eb96));
          // This is the distinguishing characteristic of Weak Resurrect,
          // it is weaker than Resurrect because it doesn't restore health to full.
          unit.health = Math.max(1, unit.healthMax * resStatAmount);

          resurrectedUnitCount++;
        }
      }
      await Promise.all(animationPromises);
      if (resurrectedUnitCount <= 0) {
        refundLastSpell(state, prediction, 'None of the targets are dead\nRefunded mana');
      }
      for (let unit of targets) {
        if (!unit) {
          continue;
        }
        // Remove color overlay now that the unit is done being resurrected
        if (unit.image && unit.image.sprite.filters) {
          // @ts-ignore This filter does have a __proto__ property
          unit.image.sprite.filters = unit.image.sprite.filters.filter(f => f.__proto__ !== ColorOverlayFilter.prototype)
        }

      }
      return state;
    },
  },
};
export default spell;
