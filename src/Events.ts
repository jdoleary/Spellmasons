import type { Coords } from './commonTypes';
import floatingText from './FloatingText';
import type { IUnit } from './Unit';

type onDamage = {
  // Returns a possibly modified damage
  (unit: IUnit, amount: number, damageDealer?: IUnit): number;
};

export const onDamageSource: { [name: string]: onDamage } = {
  shield: (unit, amount, damageDealer) => {
    // Remove self
    unit.onDamageEvents = unit.onDamageEvents.filter(
      (name) => name !== 'shield',
    );
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: 'Shielded from damage!',
      style: {
        fill: 'blue',
      },
    });
    // Remove subsprite
    unit.image.removeSubSprite('shield');
    // Take no damage
    return 0;
  },
};

type onDeath = {
  (unit: IUnit, damageDealer?: IUnit): void;
};

type onMove = {
  // Returns a possibly modified coordinate
  (unit: IUnit, newLocation: Coords): Coords;
};
export const onMoveSource: { [name: string]: onMove } = {
  freeze: (unit, newLocation) => {
    // Remove self
    unit.onMoveEvents = unit.onMoveEvents.filter((name) => name !== 'freeze');
    // Remove subsprite
    unit.image.removeSubSprite('freeze');
    // Return current location, unit is frozen and cannot move
    return unit;
  },
};

type onAgro = {
  // Returns a possibly modified agroTarget
  (agroer: IUnit, agroTarget: IUnit): IUnit;
};

type onTurnStart = {
  (unit: IUnit): void;
};
