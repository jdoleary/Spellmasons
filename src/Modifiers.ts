import type { IUnit } from './Unit';

export const modifiersSource = {
  weaken: {
    add: (unit: IUnit) => {
      // First time setup
      if (!unit.modifiers.weaken) {
        unit.modifiers.weaken = {};
        // Add event
        unit.onDamageEvents.push('weaken');

        // Add subsprite image
        unit.image.addSubSprite('weaken');
      }
    },
    remove: (unit: IUnit) => {
      delete unit.modifiers.weaken;
      // Remove event
      unit.onDamageEvents = unit.onMoveEvents.filter(
        (name) => name !== 'weaken',
      );
      // Remove subsprite
      unit.image.removeSubSprite('weaken');
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
        unit.image.addSubSprite('freeze');
      }
      // Increment the number of turns that freeze is applied (can stack)
      unit.modifiers.freeze.turnsLeft =
        (unit.modifiers.freeze.turnsLeft || 0) + 1;
    },
    remove: (unit: IUnit) => {
      delete unit.modifiers.freeze;
      // Remove event
      unit.onTurnStartEvents = unit.onMoveEvents.filter(
        (name) => name !== 'freeze',
      );
      // Remove subsprite
      unit.image.removeSubSprite('freeze');
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
        unit.image.addSubSprite('shield');
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
      unit.image.removeSubSprite('shield');
    },
  },
};
