import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { suffocateCardId, updateTooltip } from './suffocate';

export const resurrect_toxic_id = 'Toxic Resurrect';
export const thumbnail = 'spellIconResurrect3.png';
// Brings stats back to this amount on res
const resStatAmount = 1.0;
const turnsLeftToLive = 3;
const spell: Spell = {
  card: {
    id: resurrect_toxic_id,
    category: CardCategory.Soul,
    sfx: 'resurrect',
    manaCost: 90,
    healthCost: 0,
    cooldown: 2,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.RARE],
    onlySelectDeadUnits: true,
    thumbnail,
    description: ['spell_resurrect_toxic', turnsLeftToLive.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      const animationPromises = [];
      const targets = state.targetedUnits;
      let resurrectedUnitCount = 0;
      for (let unit of targets) {
        if (unit && !unit.alive) {
          let colorOverlayFilter: ColorOverlayFilter;
          if (unit.image && unit.image.sprite.filters) {
            // Overlay with white
            colorOverlayFilter = new ColorOverlayFilter(0xa1f196, 1.0);
            // blue rez 0x96cdf1
            // @ts-ignore Something is wrong with PIXI's filter types
            unit.image.sprite.filters.push(colorOverlayFilter);
          }
          playDefaultSpellSFX(card, prediction);
          Unit.resurrect(unit);

          // TOXIC add suffocate
          Unit.addModifier(unit, suffocateCardId, underworld, prediction, 1);
          const modifier = unit.modifiers[suffocateCardId];
          if (modifier) {
            modifier.turnsLeftToLive = turnsLeftToLive;
            updateTooltip(unit);
          }

          resurrectedUnitCount++;
          makeRisingParticles(unit, prediction);
          unit.health = unit.healthMax * resStatAmount;
          unit.mana = unit.manaMax * resStatAmount;
          Unit.changeFaction(unit, state.casterUnit.faction);
          // Resurrect animation is the die animation played backwards
          animationPromises.push(
            Unit.playAnimation(unit, unit.animations.die, {
              loop: false,
              animationSpeed: -0.2,
            }),
          );
          if (unit.image) {
            unit.image.sprite.gotoAndPlay(unit.image.sprite.totalFrames - 1);
          }
        }
      }
      await Promise.all(animationPromises);
      if (resurrectedUnitCount <= 0) {
        refundLastSpell(
          state,
          prediction,
          'None of the targets are dead\nRefunded mana',
        );
      }
      for (let unit of targets) {
        if (!unit) {
          continue;
        }
        // Remove color overlay now that the unit is done being resurrected
        if (unit.image && unit.image.sprite.filters) {
          // @ts-ignore This filter does have a __proto__ property
          unit.image.sprite.filters = unit.image.sprite.filters.filter(
            (f) => f.__proto__ !== ColorOverlayFilter.prototype,
          );
        }
      }
      return state;
    },
  },
};
export default spell;
