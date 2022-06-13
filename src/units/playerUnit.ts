import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { action } from './actions/gruntAction';

const unit: UnitSource = {
  id: 'playerUnit',
  info: {
    description: '',
    image: 'units/playerIdle',
    subtype: UnitSubType.PLAYER_CONTROLLED,
  },
  unitProps: {},
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action,
  animations: {
    idle: 'units/playerIdle',
    hit: 'units/playerHit',
    attack: 'units/playerCast',
    die: 'units/playerDeath',
    walk: 'units/playerIdle',
  },
};
export default unit;
