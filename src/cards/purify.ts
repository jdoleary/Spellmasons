import * as Unit from '../Unit';
import type { Spell } from '.';

// Removes all buffs and curses
const spell: Spell = {
  card: {
    id: 'purify',
    thumbnail: 'images/spell/purify.png',
    probability: 10,
    effect: (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          unit.modifiers = {};
          unit.onDamageEvents = [];
          unit.onDeathEvents = [];
          unit.onMoveEvents = [];
          unit.onAgroEvents = [];
          unit.onTurnStartEvents = [];
        }
      }
      return state;
    },
  },
};
export default spell;
