import * as Unit from '../Unit';
import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'obliterate',
    thumbnail: 'images/spell/obliterate.png',
    probability: 5,
    isDark: true,
    effect: (state) => {
      for (let target of state.targets) {
        // TODO
      }
      return state;
    },
  },
};
export default spell;
