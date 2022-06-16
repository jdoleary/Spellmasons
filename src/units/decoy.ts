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
  },
  animations: {
    idle: 'units/decoy.png',
    hit: 'units/decoy.png',
    attack: 'units/decoy.png',
    die: 'units/decoy.png',
    walk: 'units/decoy.png',
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
  action: async (_self: Unit.IUnit, _attackTarget: Unit.IUnit | undefined, _canAttackTarget: boolean) => { }
};

export default unit;
