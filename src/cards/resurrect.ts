import * as Unit from '../entity/Unit';
import { ColorOverlayFilter } from '@pixi/filter-color-overlay';
import { refundLastSpell, Spell } from './index';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { resurrect_weak_id } from './resurrect_weak';
import type Underworld from '../Underworld';
import { getOrInitModifier } from './util';
import { GlowFilter } from '@pixi/filter-glow';

export const resurrect_id = 'resurrect';
export const thumbnail = 'spellIconResurrect2.png';
// The number of turns that a unit cannot be reresurrected after being resurrected
const immuneForTurns = 1;
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  // Must keepOnDeath or else it won't prevent a reressurect
  getOrInitModifier(unit, resurrect_id, { isCurse: false, quantity: immuneForTurns, keepOnDeath: true }, () => {
    Unit.addEvent(unit, resurrect_id);
  });
}

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
          animationPromises.push(resurrectWithAnimation(unit, state.casterUnit, state.casterUnit.faction, underworld, prediction, 0x96cdf1));
        }
      }
      await Promise.all(animationPromises);
      if (resurrectedUnitCount <= 0) {
        refundLastSpell(state, prediction, 'None of the targets are dead\nRefunded mana');
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[resurrect_id];
      if (modifier && modifier.quantity >= 0) {
        // Set tooltip:
        modifier.tooltip = `${i18n(resurrect_id)} ${i18n('immune').toLocaleLowerCase()}: ${modifier.quantity + immuneForTurns}`;
      }
    },
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Decrement how many turns left the unit is resurrect immune
      const modifier = unit.modifiers[resurrect_id];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity == 0) {
          // Remove modifier.  This prevents a unit from being re-resurrected within X turns
          Unit.removeModifier(unit, resurrect_id, underworld);
        }
      }
    },
  }
};
export function resurrectWithAnimation(unit: Unit.IUnit, summoner: Unit.IUnit, faction: Faction, underworld: Underworld, prediction: boolean, color?: number): Promise<void> {
  const success = Unit.resurrect(unit, underworld, true);
  if (!success) {
    return Promise.resolve();
  }
  let colorOverlayFilter: ColorOverlayFilter;
  if (unit.image && unit.image.sprite.filters) {
    // Overlay with white
    colorOverlayFilter = new ColorOverlayFilter(0xffffff, 1.0);
    const glowFilter = new GlowFilter({ color: color || 0xffffff })
    // @ts-ignore Something is wrong with PIXI's filter types
    unit.image.sprite.filters.push(colorOverlayFilter, glowFilter)
  }
  if (!prediction) {
    playSFXKey('resurrect');
  }

  makeRisingParticles(unit, prediction);
  Unit.changeFaction(unit, faction);
  if (unit.unitType !== UnitType.PLAYER_CONTROLLED) {
    unit.summonedBy = summoner;
  }
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
      unit.image.sprite.filters = unit.image.sprite.filters.filter(f => f.__proto__ !== ColorOverlayFilter.prototype && f.__proto__ !== GlowFilter.prototype)
    }
  })
  return promise;
}
export default spell;
