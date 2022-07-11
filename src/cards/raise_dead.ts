import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import type { Spell } from '.';

const id = 'resurrect';
// Brings stats back to this amount on res
const resStatAmount = 1.0;
const spell: Spell = {
  card: {
    id,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 2,
    probability: 5,
    thumbnail: 'raise_dead.png',
    description: `
Resurrects a dead unit and converts them to the caster's faction.
    `,
    effect: async (state, prediction) => {
      // If there is a living unit atop a dead unit at the cast location, specifically target the dead unit
      // so the spell doesn't fizzle.
      const firstDeadUnitAtCastLocation = window.underworld.getUnitsAt(state.castLocation, prediction).filter(u => !u.alive)[0]
      for (let unit of [firstDeadUnitAtCastLocation, ...state.targetedUnits]) {
        if (unit && !unit.alive) {
          let colorOverlayFilter: ColorOverlayFilter;
          if (unit.image && unit.image.sprite.filters) {
            // Overlay with white
            colorOverlayFilter = new ColorOverlayFilter(0xffffff, 1.0);
            // @ts-ignore Something is wrong with PIXI's filter types
            unit.image.sprite.filters.push(colorOverlayFilter)
          }
          Unit.resurrect(unit);
          unit.health = unit.healthMax * resStatAmount;
          unit.mana = unit.manaMax * resStatAmount;
          Unit.changeFaction(unit, state.casterUnit.faction);
          // Resurrect animation is the die animation played backwards
          const playAnimationPromise = Unit.playAnimation(unit, unit.animations.die, { loop: false, animationSpeed: -0.2 });
          if (unit.image) {
            unit.image.sprite.gotoAndPlay(unit.image.sprite.totalFrames - 1);
          }
          await playAnimationPromise;
          // Remove color overlay now that the unit is done being resurrected
          if (unit.image && unit.image.sprite.filters) {
            // @ts-ignore Something is wrong with PIXI's filter types
            unit.image.sprite.filters = unit.image.sprite.filters.filter(f => f !== colorOverlayFilter)
          }
        }
      }
      return state;
    },
  },
};
export default spell;
