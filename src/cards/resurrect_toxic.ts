import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { impendingDoomId } from '../modifierImpendingDoom';

export const resurrect_toxic_id = 'Toxic Resurrect';
export const thumbnail = 'spellIconResurrect3.png';
const turnsLeftToLive = 3;
const spell: Spell = {
  card: {
    id: resurrect_toxic_id,
    category: CardCategory.Soul,
    sfx: 'resurrect',
    supportQuantity: true,
    manaCost: 90,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap[CardRarity.RARE],
    onlySelectDeadUnits: true,
    thumbnail,
    description: ['spell_resurrect_toxic', turnsLeftToLive.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const animationPromises = [];
      const targets = state.targetedUnits;
      let resurrectedUnitCount = 0;
      for (let unit of targets) {
        if (unit && !unit.alive && !unit.flaggedForRemoval) {
          let colorOverlayFilter: ColorOverlayFilter;
          if (unit.image && unit.image.sprite.filters) {
            // Overlay with white
            colorOverlayFilter = new ColorOverlayFilter(0xa1f196, 1.0);
            // blue rez 0x96cdf1
            // @ts-ignore Something is wrong with PIXI's filter types
            unit.image.sprite.filters.push(colorOverlayFilter)
          }
          playDefaultSpellSFX(card, prediction);
          Unit.resurrect(unit, underworld);
          // Impending doom is added to kill units after a specified number of turns.
          // This is the distinguishing characteristic of Toxic Resurrect,
          // it is weaker than Resurrect because the resurrected unit will die in X turns.
          Unit.addModifier(unit, impendingDoomId, underworld, prediction, turnsLeftToLive * quantity);

          resurrectedUnitCount++;
          makeRisingParticles(unit, prediction);
          Unit.changeFaction(unit, state.casterUnit.faction);
          // Resurrect animation is the die animation played backwards
          animationPromises.push(Unit.playAnimation(unit, unit.animations.die, { loop: false, animationSpeed: -0.2 }));
          if (unit.image) {
            unit.image.sprite.gotoAndPlay(unit.image.sprite.totalFrames - 1);
          }
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
