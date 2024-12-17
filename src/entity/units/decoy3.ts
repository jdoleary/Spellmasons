import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import type * as Unit from '../Unit';
import * as config from '../../config';
import Underworld from '../../Underworld';
import * as Image from '../../graphics/Image';
import { bloodDecoy } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'decoy 3',
  info: {
    description: 'decoy_copy',
    image: 'decoy3',
    subtype: UnitSubType.MELEE,
  },
  animations: {
    idle: 'decoy3',
    hit: 'decoy3',
    attack: 'decoy3',
    die: 'decoy_Death3',
    walk: 'decoy3',
  },
  sfx: {
    damage: 'unitDamage',
    death: 'decoyDeath',
  },
  unitProps: {
    damage: 0,
    attackRange: 0,
    staminaMax: 0,
    healthMax: 240,
    manaMax: 50,
    manaPerTurn: 50,
    strength: 3,
    // This is critical to a decoy, it prevents it from being pushed due to unit crowding
    immovable: true,
    radius: config.COLLISION_MESH_RADIUS,
    bloodColor: bloodDecoy,
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    Image.setScaleFromModifiers(unit.image, unit.strength);
  },
  action: async (_self: Unit.IUnit, _attackTargets: Unit.IUnit[], _underworld: Underworld, _canAttackTarget: boolean) => { },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => { return []; }
};

export default unit;
