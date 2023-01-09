import * as Unit from '../entity/Unit';
import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { makeRisingParticles } from '../graphics/ParticleCollection';
import { manaBlue } from '../graphics/ui/colors';
import { hexToString } from '../graphics/ui/colorUtil';

export const id = 'conserve';
const imageName = 'spell-effects/spellFreeze_still.png';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    sfx: '',
    supportQuantity: false,
    manaCost: 0,
    healthCost: 6,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconConserve.png',
    animationPath: '',
    description: `
Saves the rest of the targets' current mana for next turn.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units with mana
      const targets = state.targetedUnits.filter(u => u.alive && u.mana > 0);
      if (targets.length) {
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, unit.mana);
          unit.mana = 0;
          makeRisingParticles(unit, prediction, hexToString(manaBlue));
        }
      } else {
        refundLastSpell(state, prediction, 'No targets with mana to conserve.');
      }
      return state;
    },
  },
  modifiers: {
    add,
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1,
        y: 1,
      },
    },
  },
  events: {
    onTurnStart: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        setTimeout(() => {
          unit.mana += modifier.quantity;
          Unit.removeModifier(unit, id, underworld);
        }, 0);
      }
      // Do not skip turn
      return false;
    },
  },

};

function add(unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, id, { isCurse: false, quantity, persistBetweenLevels: false }, () => {
    if (!unit.onTurnStartEvents.includes(id)) {
      unit.onTurnStartEvents.push(id);
    }
  });
}

export default spell;
