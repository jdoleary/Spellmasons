import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import * as Pickup from '../entity/Pickup';
import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitType } from '../types/commonTypes';
import * as config from '../config'
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const freezeCardId = 'freeze';
// The number of turns that a unit cannot be refrozen after being frozen
const immuneForTurns = 2;
const imageName = 'spell-effects/spellFreeze_still.png';
const spell: Spell = {
  card: {
    id: freezeCardId,
    category: CardCategory.Curses,
    sfx: 'freeze',
    supportQuantity: false,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 5,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconFreeze.png',
    animationPath: 'spell-effects/spellFreeze',
    description: ['spell_freeze', immuneForTurns.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && !u.events.includes(freezeCardId));
      if (targets.length) {
        let spellAnimationPromise = Promise.resolve();
        targets.forEach(t => {
          spellAnimationPromise = Image.addOneOffAnimation(t, 'spell-effects/spellFreeze');
        })
        await Promise.all([spellAnimationPromise, playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, freezeCardId, underworld, prediction, quantity);
        }
        for (let pickup of state.targetedPickups) {
          if (pickup.turnsLeftToGrab !== undefined) {
            pickup.turnsLeftToGrab += quantity;
            // Update the text now that turnsLeftToGrab has changed
            Pickup.sync(pickup);
          }
        }
      } else {
        refundLastSpell(state, prediction);
      }
      return state;
    },
  },
  modifiers: {
    addModifierVisuals,
    add,
    remove,
  },
  events: {
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Decrement how many turns left the unit is frozen
      const modifier = unit.modifiers[freezeCardId];
      if (modifier) {
        modifier.quantity--;
        updateTooltip(unit, modifier.quantity, prediction);
        if (modifier.quantity == 0) {
          // Remove freeze effects at 0
          remove(unit);
        }
        if (modifier.quantity <= -immuneForTurns) {
          // Remove modifier.  This prevents a unit from being re-frozen within 2 turns
          Unit.removeModifier(unit, freezeCardId, underworld);
        }
      }
    },
  },
};
function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  // Add subsprite image
  Image.addSubSprite(unit.image, imageName);
  // Stop the animation
  unit.image?.sprite.stop();
}
function updateTooltip(unit: Unit.IUnit, quantity: number, prediction: boolean) {
  if (!prediction && unit.modifiers[freezeCardId] && quantity <= 0) {
    // Set tooltip:
    unit.modifiers[freezeCardId].tooltip = `${i18n(freezeCardId)} ${i18n('immune').toLocaleLowerCase()}: ${quantity + immuneForTurns}`;
  }
}

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  getOrInitModifier(unit, freezeCardId, { isCurse: true, quantity: 1 }, () => {
    unit.radius = config.COLLISION_MESH_RADIUS;
    Unit.addEvent(unit, freezeCardId);

    // Prevents units from being pushed out of the way and units
    // act as a blockade
    unit.immovable = true;
  });
}
function remove(unit: Unit.IUnit) {
  unit.radius = config.UNIT_BASE_RADIUS
  // Unit can be pushed around again as other units try to move past them
  unit.immovable = false;
  // Resume the animation
  unit.image?.sprite.play();

  // Special handling:
  // If players freeze themself it will skip their turn
  // which makes the freeze image get removed immediately
  // which is a bad UX because it's unclear why their turn ended
  // so if it's a player that gets frozen, delay 1 second before
  // removing the ice image
  if (unit.unitType == UnitType.PLAYER_CONTROLLED) {
    setTimeout(() => {
      Image.removeSubSprite(unit.image, imageName);
    }, 1000)
  } else {
    Image.removeSubSprite(unit.image, imageName);
  }
}

export default spell;
