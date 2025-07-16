import { addTarget, EffectState, ICard, refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2, lerpVec2 } from '../jmath/Vec';
import * as Unit from '../entity/Unit';
import { IUnit } from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { getOrInitModifier } from './util';
import { playDefaultSpellSFX } from './cardUtils';
import * as inLiquid from '../inLiquid';
import floatingText from '../graphics/FloatingText';
import { tryFallInOutOfLiquid } from '../entity/Obstacle';

export const SubmergeId = 'Submerge';
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: any) {
  const modifier = getOrInitModifier(unit, SubmergeId, { isCurse: true, quantity, keepOnDeath: false }, () => {
    inLiquid.add(unit, underworld, prediction);
    // Special handling, yes keepOnDeath:false will remove it but not if it takes fatal damage from firstTimeSetup
    // before the modifier is even added.  So we have to check if the unit is now dead after inLiquid.add
    // and remoev the modifier if it is
    setTimeout(() => {
      if (!unit.alive) {
        Unit.removeModifier(unit, SubmergeId, underworld);
      }
    }, 0);
  });
}
function remove(unit: IUnit, underworld: Underworld) {
  // Must remove submergeModifier BEFORE calling tryFallInOutOfLiquid
  // or else it will think submerge override is still on and not remove
  // the mask
  unit.events = unit.events.filter((e) => e !== SubmergeId);
  delete unit.modifiers[SubmergeId];
  tryFallInOutOfLiquid(unit, underworld, false);
}
const spell: Spell = {
  card: {
    id: SubmergeId,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    requiresFollowingCard: false,
    sfx: 'fallIntoLiquid-water',
    thumbnail: 'spellIconSubmerge.png',
    description: 'spell_submerge',
    allowNonUnitTarget: false,
    effect: async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
      const targets = state.targetedUnits.filter(t => t.alive);
      // Add Submerge to all targeted units
      for (const target of targets) {
        Unit.addModifier(target, SubmergeId, underworld, prediction, quantity);
        if (!prediction && !globalThis.headless) {
          floatingText({ coords: target, text: SubmergeId });
        }
      }

      if (!prediction && !globalThis.headless && targets.length) {
        playDefaultSpellSFX(card, prediction);
      }
      if (!targets.length) {
        refundLastSpell(state, prediction)
      }

      return state;
    },
  },
  modifiers: {
    add,
    remove
  },
  events: {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[SubmergeId];
      if (modifier) {
        modifier.tooltip = i18n(SubmergeId);
      }
    },
  }
};

export default spell;