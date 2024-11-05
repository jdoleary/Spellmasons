import { getCardsFromIds, Spell } from './index';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory, UnitType } from '../types/commonTypes';
import { calculateCost, playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { spellmasonUnitId } from '../entity/units/playerUnit';
import { addWarningAtMouse } from '../graphics/PlanningView';

// callOnChange and memoizedFunction allow the `cb` callback to be invoked with
// the arg of `message` only when `message` changes.
// This is useful for alerting the mana cost of the teach spell but only when it changes
function callOnChange<T extends (cb: (m: string) => void, message: string) => any>(fn: T): T {
  let lastArgs: string | null = null;

  return function (cb, message: string) {
    if (!lastArgs || message !== lastArgs) {
      lastArgs = message;
      fn(cb, message);
    }
  } as T;
}
const memoizedFunction = callOnChange((cb, message) => {
  cb(message)
});
export const teachCardId = 'teach';
const spell: Spell = {
  card: {
    id: teachCardId,
    category: CardCategory.Blessings,
    requires: [],
    sfx: 'teach',
    supportQuantity: false,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconTeach.png',
    animationPath: '',
    requiresFollowingCard: true,
    description: ['spell_teach'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);

        // calculate spell cost
        const teachIndex = state.cardIds.indexOf(teachCardId);
        const learnedSpell = state.cardIds.slice(teachIndex + 1);
        // Show mana cost for taught spell:
        const cards = getCardsFromIds(learnedSpell);
        const cost = calculateCost(cards, {});
        if (prediction) {
          memoizedFunction((message: string) => {
            floatingText({
              coords: state.castLocation,
              text: message,
            });
          }, `${i18n(teachCardId)} ${cost.manaCost} ${i18n('mana')} ${cost.healthCost > 0 ? `; ${cost.healthCost} ${i18n('health')}` : ''}`);

        }
        for (let unit of targets) {
          if (unit.unitSourceId == spellmasonUnitId && unit.unitType == UnitType.AI) {
            const teachIndex = state.cardIds.indexOf(teachCardId);
            const learnedSpell = state.cardIds.slice(teachIndex + 1);
            // Show mana cost for taught spell:
            const cards = getCardsFromIds(learnedSpell);
            const cost = calculateCost(cards, {})
            addWarningAtMouse(`${i18n(teachCardId)} ${cost.manaCost} ${i18n('mana')}; ${cost.healthCost} ${i18n('health')}`);
            // LEFT OFF: WHy don't they incur mana cost??

            Unit.addModifier(unit, teachCardId, underworld, prediction, quantity, { spell: learnedSpell });
            if (!prediction) {
              floatingText({ coords: unit, text: `${i18n('Learned')}: ${learnedSpell.map(i18n).join(',')}`, style: { fill: 'blue' } });
            }
          } else {
            // Omit error notification for self since it's obvious that you can't target yourself with teach,
            // and players may want to chain teach off of Ultra clone in which case this notification is annoying
            if (unit !== state.casterUnit) {
              floatingText({ coords: unit, text: i18n('teach npc error'), style: { fill: 'red' } });
            }
          }
        }
        // Clear out the rest of the spell so it doesn't actually cast it
        state.cardIds = [];
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[teachCardId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${i18n('Learned')}: ${modifier.spell.map(i18n).join(',')}`;
      }
    },
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: { [key: string]: any }) {
  const modifier = getOrInitModifier(unit, teachCardId, { isCurse: false, quantity }, () => {
    Unit.addEvent(unit, teachCardId);
  });

  if (extra && extra.spell != undefined) {
    modifier.spell = extra.spell;
    // Once a spell is assigned, set their damage to 0 so as to not mess up smartTargeting since
    // their predicted damage is now unknown
    unit.damage = 0;
  }
}

export default spell;