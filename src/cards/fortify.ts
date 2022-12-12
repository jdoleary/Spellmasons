import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import throttle from 'lodash.throttle';
import { Vec2 } from '../jmath/Vec';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'fortify';
export const modifierImagePath = 'spell-effects/modifierShield.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'shield',
    supportQuantity: false,
    manaCost: 120,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconFortify.png',
    animationPath: 'spell-effects/spellShield',
    description: `
Protects bearer all damage for the next turn.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        let animationPromise = Promise.resolve();
        for (let unit of targets) {
          animationPromise = Image.addOneOffAnimation(unit, 'projectile/priestProjectileHit', {}, { loop: false });
        }
        playDefaultSpellSFX(card, prediction);
        // We only need to wait for one of these promises, since they all take the same amount of time to complete
        await animationPromise;
        // Add the modifier after the animation so that the subsprite doesn't get added until after the animation is
        // complete
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, quantity);
        }
      }

      return state;
    },
  },
  modifiers: {
    add,
    subsprite: {
      imageName: modifierImagePath,
      alpha: 0.5,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1.0,
        y: 1.0,
      },
    },
  },
  events: {
    onTurnStart: async (unit, prediction, underworld) => {
      // Since this blessing only applies for one turn, remove it
      // on turn start
      Unit.removeModifier(unit, id, underworld);
      // do not skip turn
      return false;
    },
    onDamage: (unit, amount, underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        // Only block damage, not heals
        if (amount > 0) {
          let adjustedAmount = 0;
          if (!prediction) {
            floatingText({
              coords: unit,
              text: 'Fortify prevented damage!',
              style: {
                fill: 'blue',
                ...config.PIXI_TEXT_DROP_SHADOW
              },
            });
          }

          return adjustedAmount;
        } else {
          return amount;
        }
      } else {
        return amount;
      }
    },
  },

};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, id, { isCurse: false, quantity, persistBetweenLevels: false }, () => {
    // Add event
    unit.onDamageEvents.push(id);
    unit.onTurnStartEvents.push(id);
    // Add subsprite image
    const animatedFortifySprite = Image.addSubSprite(unit.image, modifierImagePath);
    if (animatedFortifySprite) {
      // Make it blue just so it looks distinct from shield
      animatedFortifySprite.tint = 0x0000ff;
    }
  });
}
export default spell;
