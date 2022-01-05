import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import { canInteractWithTarget, action } from './actions/gruntAction';

const unit: UnitSource = {
  id: 'ladyBlue',
  info: {
    description: '',
    image: 'units/lady-blue.png',
    subtype: UnitSubType.PLAYER_CONTROLLED,
    probability: 0,
  },
  unitProps: {},
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action,
  canInteractWithTarget,
};
export default unit;
