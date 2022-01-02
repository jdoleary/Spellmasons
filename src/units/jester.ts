import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { canInteractWithTarget, action } from './actions/gruntAction';

const unit: UnitSource = {
  id: 'jester',
  info: {
    description: '',
    image: 'units/jester.png',
    subtype: UnitSubType.PLAYER_CONTROLLED,
    probability: 0,
  },
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action,
  canInteractWithTarget,
};
export default unit;
