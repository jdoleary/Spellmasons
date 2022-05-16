import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import type * as Unit from '../Unit';
import * as config from '../config';

const unit: UnitSource = {
  id: 'decoy',
  info: {
    description: 'A decoy to distract enemies',
    image: 'units/decoy.png',
    subtype: UnitSubType.MELEE,
    probability: 0,
  },
  unitProps: {
    staminaMax: 0,
    attackRange: 0,
    manaMax: 0,
    healthMax: 7,
    // This is critical to a decoy, it prevents it from being pushed
    immovable: true,
    radius: config.COLLISION_MESH_RADIUS
  },
  action: async (self: Unit.IUnit, attackTarget: Unit.IUnit | undefined, canAttackTarget: boolean) => { }
};

export default unit;
