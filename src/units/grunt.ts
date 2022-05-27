import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { action } from './actions/gruntAction';
import * as config from '../config'

const unit: UnitSource = {
  id: 'grunt',
  info: {
    description: 'A simple but persistant creature that will pursue its enemies and attack them if within arm\'s reach.',
    image: 'units/golem',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    staminaMax: config.UNIT_BASE_STAMINA,
    attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
    manaMax: 0,
  },
  spawnParams: {
    probability: 100,
    unavailableUntilLevelIndex: 0,
  },
  action,
};

export default unit;
