import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import type * as Unit from '../Unit';
import * as config from '../../config';
import Underworld from '../../Underworld';
import { bloodDecoy } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'decoy',
  info: {
    description: 'decoy_copy',
    image: 'units/decoy',
    subtype: UnitSubType.MELEE,
  },
  animations: {
    idle: 'units/decoy',
    hit: 'units/decoy',
    attack: 'units/decoy',
    die: 'units/decoy_Death',
    walk: 'units/decoy',
  },
  sfx: {
    damage: 'unitDamage',
    death: 'decoyDeath',
  },
  unitProps: {
    damage: 0,
    attackRange: 0,
    staminaMax: 0,
    healthMax: 70,
    manaMax: 0,
    // This is critical to a decoy, it prevents it from being pushed due to unit crowding
    immovable: true,
    radius: config.COLLISION_MESH_RADIUS,
    bloodColor: bloodDecoy,
  },
  action: async (_self: Unit.IUnit, _attackTargets: Unit.IUnit[], _underworld: Underworld, _canAttackTarget: boolean) => { },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => { return []; }
};

export default unit;
