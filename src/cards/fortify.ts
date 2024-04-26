import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import floatingText from '../graphics/FloatingText';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'fortify';
const DAMGAGE_REDUCTION_PROPORTION = 0.5;
export const modifierImagePath = 'spell-effects/modifierShield.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    sfx: 'shield',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconFortify.png',
    animationPath: 'spell-effects/spellShield',
    description: ['spell_fortify', Math.round(DAMGAGE_REDUCTION_PROPORTION * 100).toString()],
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
    onTurnStart: async (unit, underworld, prediction) => {
      // Since this blessing only applies for one turn, remove it
      // on turn start
      Unit.removeModifier(unit, id, underworld);
    },
    onTakeDamage: (unit, amount, underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        // Only block damage, not heals
        if (amount > 0) {
          let reduceProportion = DAMGAGE_REDUCTION_PROPORTION;
          // Fortify stacks as 50%, 75%, 87.5%, etc...
          for (let i = 1; i < (modifier.quantity || 1); i++) {
            reduceProportion = reduceProportion + (1 - reduceProportion) * DAMGAGE_REDUCTION_PROPORTION;
          }
          const adjustedAmount = Math.round(amount * (1.0 - Math.min(1, reduceProportion)));
          if (!prediction) {
            floatingText({
              coords: unit,
              text: 'Fortify reduced damage!',
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
  const modifier = getOrInitModifier(unit, id, { isCurse: false, quantity }, () => {
    // Add event
    unit.onTakeDamageEvents.push(id);
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
