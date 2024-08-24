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
import { heavyToxinsId } from '../modifierHeavyToxins';
import { slowCardId } from './slow';

export const poisonCardId = 'poison';
export const basePoisonStacks = 20;
const subspriteImageName = 'spell-effects/modifierPoisonDrip';
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
    description: ['spell_poison', basePoisonStacks.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        await Promise.all([playDefaultSpellAnimation(card, targets, prediction), playDefaultSpellSFX(card, prediction)]);
        for (let unit of targets) {
          Unit.addModifier(unit, poisonCardId, underworld, prediction, basePoisonStacks * quantity, { sourceUnitId: state.casterUnit.id });
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    addModifierVisuals,
    subsprite: {
      imageName: subspriteImageName,
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
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[poisonCardId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${modifier.quantity} ${i18n('Poison')}`;
      }
    },
    onTurnEnd: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[poisonCardId];
      if (modifier) {
        // Don't take damage on prediction because it is confusing for people to see the prediction damage that poison will do,
        // they assume prediction damage is only from their direct cast, not including the start of the next turn
        if (!prediction) {
          const sourceUnit = underworld.getUnitById(modifier.sourceUnitId, prediction);
          const damage = modifier.quantity;
          Unit.takeDamage({
            unit: unit,
            amount: damage,
            sourceUnit: sourceUnit,
            fromVec2: unit,
          }, underworld, prediction);
          floatingText({
            coords: unit, text: `${damage} poison damage`,
            style: { fill: '#44b944' },
          });
        }
      } else {
        console.error(`Should have ${poisonCardId} modifier on unit but it is missing`);
        return;
      }
    },
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: { [key: string]: any }) {
  const modifier = getOrInitModifier(unit, poisonCardId, { isCurse: true, quantity }, () => {
    Unit.addEvent(unit, poisonCardId);
  });

  if (extra && extra.sourceUnitId != undefined) {
    modifier.sourceUnitId = extra.sourceUnitId;

    // If source unit has heavyToxins modifier, it should also inflict slow
    const units = prediction ? underworld.unitsPrediction : underworld.units;
    const sourceUnit = units.find(u => u.id == extra.sourceUnitId);
    if (sourceUnit) {
      const heavyToxinsModifier = sourceUnit.modifiers[heavyToxinsId];
      if (heavyToxinsModifier) {
        // A loop is used because different applications of slow are multiplicative
        // For each quantity of heavy toxins
        for (let i = 0; i < heavyToxinsModifier.quantity; i++) {
          // Inflict a [added-poison-quantity]% slow, capped at 100%
          Unit.addModifier(unit, slowCardId, underworld, prediction, Math.min(quantity, 100));
        }
      }
    }
  }
}

function addModifierVisuals(unit: Unit.IUnit, underworld: Underworld) {
  Image.addSubSprite(unit.image, subspriteImageName);
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

export default spell;