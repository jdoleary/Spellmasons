import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { refundLastSpell, Spell } from './index';
import { CardCategory, Faction } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { resurrect_weak_id } from './resurrect_weak';
import type Underworld from '../Underworld';

export const resurrect_id = 'resurrect';
export const thumbnail = 'spellIconResurrect2.png';
const spell: Spell = {
  card: {
    id: resurrect_id,
    replaces: [resurrect_weak_id],
    category: CardCategory.Soul,
    sfx: 'resurrect',
    manaCost: 160,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    onlySelectDeadUnits: true,
    thumbnail,
    description: 'spell_resurrect',
    effect: async (state, card, quantity, underworld, prediction) => {
      const animationPromises = [];
      const targets = state.targetedUnits;
      let resurrectedUnitCount = 0;
      for (let unit of targets) {
        if (unit && !unit.alive && !unit.flaggedForRemoval) {
          resurrectedUnitCount++;
          animationPromises.push(resurrectWithAnimation(unit, state.casterUnit.faction, underworld, prediction));
        }
      }
      await Promise.all(animationPromises);
      if (resurrectedUnitCount <= 0) {
        refundLastSpell(state, prediction, 'None of the targets are dead\nRefunded mana');
      }
      return state;
    },
  },
};
export function resurrectWithAnimation(unit: Unit.IUnit, faction: Faction, underworld: Underworld, prediction: boolean): Promise<void> {
  let colorOverlayFilter: ColorOverlayFilter;
  if (unit.image && unit.image.sprite.filters) {
    // Overlay with white
    colorOverlayFilter = new ColorOverlayFilter(0x96cdf1, 1.0);
    // @ts-ignore Something is wrong with PIXI's filter types
    unit.image.sprite.filters.push(colorOverlayFilter)
  }
  if (!prediction) {
    playSFXKey('resurrect');
  }
  Unit.resurrect(unit, underworld);

  makeRisingParticles(unit, prediction);
  Unit.changeFaction(unit, faction);
  // Resurrect animation is the die animation played backwards
  let promise = Unit.playAnimation(unit, unit.animations.die, { loop: false, animationSpeed: -0.2 });
  if (unit.image) {
    unit.image.sprite.gotoAndPlay(unit.image.sprite.totalFrames - 1);
  }
  // Always remove color overlay
  promise.catch(() => { }).then(() => {
    // Remove color overlay now that the unit is done being resurrected
    if (unit.image && unit.image.sprite.filters) {
      // @ts-ignore This filter does have a __proto__ property
      unit.image.sprite.filters = unit.image.sprite.filters.filter(f => f.__proto__ !== ColorOverlayFilter.prototype)
    }
  })
  return promise;

}
export default spell;
