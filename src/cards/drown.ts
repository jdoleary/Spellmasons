import { containerSpells } from '../graphics/PixiUtils';
import { CardCategory } from '../types/commonTypes';
import { oneOffImage, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import floatingText from '../graphics/FloatingText';

export const id = 'Drown';
export interface UnitDamage {
  id: number;
  x: number;
  y: number;
  health: number;
  damageTaken: number;

}
const damageDone = 4;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconDrown.png',
    sfx: 'drown',
    description: `
Deal ${damageDone} damage ONLY if target is submerged.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units that are submerged
      const targets = state.targetedUnits.filter(u => u.alive && u.inLiquid);
      if (targets.length) {
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
          // playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
        }
        for (let unit of targets) {
          Unit.takeDamage(unit, damageDone, state.casterUnit, underworld, prediction, state);
        }
      }
      if (targets.length == 0) {
        // No targets to cast on
        // Refund mana
        state.casterUnit.mana += state.aggregator.lastSpellCost;
        if (!prediction) {
          floatingText({ coords: state.casterUnit, text: 'No Targets are submerged' });

        }
      }
      return state;
    },
  },
};
export default spell;
