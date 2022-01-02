import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { canInteractWithTarget, action } from './actions/gruntAction';

const unit: UnitSource = {
  id: 'grunt',
  info: {
    description: 'A basic grunt that will pursue enemies and hit them',
    image: 'units/golem',
    subtype: UnitSubType.AI_melee,
    probability: 100,
  },
  action,
  canInteractWithTarget,
};

export default unit;
