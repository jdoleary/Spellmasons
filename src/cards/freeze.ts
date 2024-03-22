import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import * as Pickup from '../entity/Pickup';
import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitType } from '../types/commonTypes';
import * as config from '../config'
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const freezeCardId = 'freeze';
const imageName = 'spell-effects/spellFreeze_still.png';
const spell: Spell = {
  card: {
    id: freezeCardId,
    category: CardCategory.Curses,
    sfx: 'freeze',
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    cooldown: 2,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconFreeze.png',
    animationPath: 'spell-effects/spellFreeze',
    description: 'spell_freeze',
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
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
    add,
    remove,
    // Special subsprite handling in remove function
    // subsprite: {
    //   imageName,
    //   alpha: 1.0,
    //   anchor: {
    //     x: 0.5,
    //     y: 0.5,
    //   },
    //   scale: {
    //     x: 1,
    //     y: 1,
    //   },
    // },
  },
  events: {
    onTurnStart: async (unit: Unit.IUnit) => {
      // Ensure that the unit cannot move when frozen
      // (even when players' turns are ended they can still act so long
      // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
      // during that phase, so setting stamina to 0
      // prevents players from moving when they are frozen)
      // and then returning true also ends their turn.
      unit.stamina = 0;
    },
    onTurnEnd: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
      // Decrement how many turns left the unit is frozen
      const modifier = unit.modifiers[freezeCardId];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit.removeModifier(unit, freezeCardId, underworld);
        }
      }
    },
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, freezeCardId, { isCurse: true, quantity }, () => {
    unit.radius = config.COLLISION_MESH_RADIUS;
    // Immediately set stamina to 0 so they can't move
    unit.stamina = 0;
    // Add event
    if (!unit.onTurnStartEvents.includes(freezeCardId)) {
      unit.onTurnStartEvents.push(freezeCardId);
    }
    if (!unit.onTurnEndEvents.includes(freezeCardId)) {
      unit.onTurnEndEvents.push(freezeCardId);
    }

    // Add subsprite image
    Image.addSubSprite(unit.image, imageName);
    // Stop the animation
    unit.image?.sprite.stop();
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
