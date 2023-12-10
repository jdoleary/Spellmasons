import type * as PIXI from 'pixi.js';
import { IUnit, takeDamage } from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const poisonCardId = 'poison';
const baseDamage = 20;
function init(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  if (spell.modifiers?.subsprite) {
    // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
    // which is used for identifying the sprite or animation that is currently active
    const poisonSubsprite = unit.image?.sprite.children.find(c => c.imagePath == spell.modifiers?.subsprite?.imageName)
    if (poisonSubsprite) {
      const animatedSprite = poisonSubsprite as PIXI.AnimatedSprite;
      animatedSprite.onFrameChange = (currentFrame) => {
        if (currentFrame == 5) {
          animatedSprite.anchor.x = (3 + Math.random() * (6 - 3)) / 10;
        }
      }
    }
  }
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, poisonCardId, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
    // Add event
    if (!unit.onTurnEndEvents.includes(poisonCardId)) {
      unit.onTurnEndEvents.push(poisonCardId);
    }
    // Add subsprite image
    if (!prediction) {
      if (spell.modifiers?.subsprite) {
        Image.addSubSprite(unit.image, spell.modifiers.subsprite.imageName);
        init(unit, underworld, prediction);
      }
    }

  });

  if (!prediction) {
    updateTooltip(unit);
  }
}
export function updateTooltip(unit: Unit.IUnit) {
  if (unit.modifiers[poisonCardId]) {
    // Set tooltip:
    unit.modifiers[poisonCardId].tooltip = `Poison ${unit.modifiers[poisonCardId].quantity} | ${baseDamage * unit.modifiers[poisonCardId].quantity} damage`
  }
}

const spell: Spell = {
  card: {
    id: poisonCardId,
    category: CardCategory.Curses,
    sfx: 'poison',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconPoison.png',
    animationPath: 'spell-effects/spellPoison',
    description: ['spell_poison', baseDamage.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, poisonCardId, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    init,
    subsprite: {
      imageName: 'spell-effects/modifierPoisonDrip',
      alpha: 1.0,
      anchor: {
        x: 0.6,
        y: 0.5,
      },
      scale: {
        x: 1.0,
        y: 1.0,
      },
    },

  },
  events: {
    onTurnEnd: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      // TODO: There was a bug here where somehow modifiers['poison'] was undefined after i did chain, vulx10, poisonx10
      const modifier = unit.modifiers[poisonCardId];
      // Don't take damage on prediction because it is confusing for people to see the prediction damage that poison will do,
      // they assume prediction damage is only from their direct cast, not including the start of the next turn
      if (!prediction) {
        if (modifier) {
          const damage = (modifier.quantity || 1) * baseDamage;
          takeDamage(unit, damage, unit, underworld, prediction, undefined);
          floatingText({
            coords: unit, text: `${damage} poison damage`,
            style: { fill: '#44b944' },
          });
        } else {
          console.error(`Should have ${poisonCardId} modifier on unit but it is missing`);
        }
      }
      return false;
    },
  },
};
export default spell;
