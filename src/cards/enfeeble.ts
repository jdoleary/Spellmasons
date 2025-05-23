import * as Unit from '../entity/Unit';
import { CardCategory, UnitSubType, UnitType } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { PRIEST_ID } from '../entity/units/priest';
import { POISONER_ID } from '../entity/units/poisoner';
import { gripthulu_id } from '../entity/units/gripthulu';
import { decoyId } from './summon_decoy';
import { bossmasonUnitId } from '../entity/units/deathmason';
import { DARK_SUMMONER_ID } from '../entity/units/darkSummoner';

export const enfeebleId = 'Enfeeble';
const statChange = 5;
const spell: Spell = {
  card: {
    id: enfeebleId,
    category: CardCategory.Curses,
    sfx: 'enfeeble',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconEnfeeble.png',
    animationPath: 'spellEnfeeble',
    description: ['spell_enfeeble', (statChange).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(enfeebleFilter);
      // Even though the player's damage stat doesn't affect their spells
      // it will affect cloned spellmasons, so we allow it.

      if (!targets.length) {
        refundLastSpell(state, prediction, "No valid targets");
      } else {
        playDefaultSpellSFX(card, prediction);
        //await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, enfeebleId, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
  },
};

export function enfeebleFilter(u: Unit.IUnit): boolean {
  return u.alive
    && u.unitSourceId != PRIEST_ID
    && u.unitSourceId != gripthulu_id
    && u.unitSourceId != decoyId
    && u.unitSourceId != bossmasonUnitId
    && u.unitSourceId != DARK_SUMMONER_ID;
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, enfeebleId, { isCurse: true, quantity, }, () => {
    //no first time setup
  });

  // Special balance case: Poisoner applies 1 stack of poison per damage
  if (unit.unitSourceId == POISONER_ID) {
    unit.damage -= quantity;
  } else {
    unit.damage -= statChange * quantity;
  }
}

function remove(unit: Unit.IUnit, underworld: Underworld) {
  const modifier = unit.modifiers[enfeebleId];
  if (!modifier) {
    console.error(`Missing modifier object for ${enfeebleId}; cannot remove.  This should never happen`);
    return
  }

  // Special balance case: Poisoner applies 1 stack of poison per damage
  if (unit.unitSourceId == POISONER_ID) {
    unit.damage += modifier.quantity;
  } else {
    unit.damage += statChange * modifier.quantity;
  }
}

export default spell;