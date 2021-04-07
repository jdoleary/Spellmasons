import type { IUnit } from './Unit';
import * as Image from './Image';

export const modifiersSource = {
  make_vulnerable: {
    add: (unit: IUnit) => {
      // First time setup
      if (!unit.modifiers.make_vulnerable) {
        unit.modifiers.make_vulnerable = {};
        // Add event
        unit.onDamageEvents.push('make_vulnerable');

        // Add subsprite image
        Image.addSubSprite(unit.image, 'make_vulnerable');
      }
    },
    remove: (unit: IUnit) => {
      delete unit.modifiers.make_vulnerable;
      // Remove event
      unit.onDamageEvents = unit.onMoveEvents.filter(
        (name) => name !== 'make_vulnerable',
      );
      // Remove subsprite
      Image.removeSubSprite(unit.image, 'make_vulnerable');
    },
  },
  freeze: {
    add: (unit: IUnit) => {
      // First time setup
      if (!unit.modifiers.freeze) {
        unit.modifiers.freeze = {};
        // Add event
        unit.onTurnStartEvents.push('freeze');

        // Add subsprite image
        Image.addSubSprite(unit.image, 'freeze');
      }
      // Increment the number of turns that freeze is applied (can stack)
      unit.modifiers.freeze.turnsLeft =
        (unit.modifiers.freeze.turnsLeft || 0) + 1;
    },
    remove: (unit: IUnit) => {
      delete unit.modifiers.freeze;
      // Remove event
      unit.onTurnStartEvents = unit.onTurnStartEvents.filter(
        (name) => name !== 'freeze',
      );
      // Remove subsprite
      Image.removeSubSprite(unit.image, 'freeze');
    },
  },
  shield: {
    add: (unit: IUnit) => {
      // First time setup
      if (!unit.modifiers.shield) {
        unit.modifiers.shield = {};
        // Add event
        unit.onDamageEvents.push('shield');
        // Add subsprite image
        Image.addSubSprite(unit.image, 'shield');
      }
      // Increment the number of stacks of shield
      unit.modifiers.shield.stacks = (unit.modifiers.shield.stacks || 0) + 1;
    },
    remove: (unit: IUnit) => {
      delete unit.modifiers.shield;
      // Remove event
      unit.onDamageEvents = unit.onDamageEvents.filter(
        (name) => name !== 'shield',
      );
      // Remove subsprite
      Image.removeSubSprite(unit.image, 'shield');
    },
  },
};
