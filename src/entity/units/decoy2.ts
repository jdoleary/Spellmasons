import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import type * as Unit from '../Unit';
import * as config from '../../config';
import Underworld from '../../Underworld';
import * as Image from '../../graphics/Image';
import { bloodDecoy } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'decoy 2',
  info: {
    description: 'decoy_copy',
    image: 'decoy2',
    subtype: UnitSubType.MELEE,
  },
  animations: {
    idle: 'decoy2',
    hit: 'decoy2',
    attack: 'decoy2',
    die: 'decoy_Death2',
    walk: 'decoy2',
  },
  sfx: {
    damage: 'unitDamage',
    death: 'decoyDeath',
  },
  unitProps: {
    damage: 0,
    attackRange: 0,
    staminaMax: 0,
    healthMax: 120,
    manaMax: 20,
    strength: 2,
    // This is critical to a decoy, it prevents it from being pushed due to unit crowding
    immovable: true,
    radius: config.COLLISION_MESH_RADIUS,
    bloodColor: bloodDecoy,
  },
  action: async (_self: Unit.IUnit, _attackTargets: Unit.IUnit[], _underworld: Underworld, _canAttackTarget: boolean) => { },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => { return []; }
};

export default unit;
