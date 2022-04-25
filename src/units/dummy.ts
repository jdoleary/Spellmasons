import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';

const unit: UnitSource = {
  id: 'dummy',
  info: {
    description: 'A practice dummy',
    image: 'units/dummy.png',
    subtype: UnitSubType.MELEE,
    probability: 100,
  },
  unitProps: {
    staminaMax: 0,
    attackRange: 0,
  },
  action: async () => { },
};

export default unit;
