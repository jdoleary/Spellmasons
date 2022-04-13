import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';

const unit: UnitSource = {
  id: 'dummy',
  info: {
    description: 'A practice dummy',
    image: 'units/dummy.png',
    subtype: UnitSubType.GOON,
    probability: 100,
  },
  unitProps: {
    moveDistance: 0,
    attackRange: 0,
  },
  action: async () => { },
  canInteractWithTarget: () => false,
};

export default unit;
