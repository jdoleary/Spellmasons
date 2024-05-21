import { getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { upgradeCardsSource } from '../Upgrade';
import { recalcPositionForCards } from '../graphics/ui/CardUI';
import floatingText from '../graphics/FloatingText';
import { makeManaTrail } from '../graphics/Particles';
import { playDefaultSpellSFX } from './cardUtils';

export const id = 'Capture Soul';
const healthThreshold = 31;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Soul,
    manaCost: 40,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 2,
    thumbnail: 'spellIconCaptureSoul.png',
    sfx: 'captureSoul',
    description: ['spell_capture_soul', healthThreshold.toString()],
    timeoutMs: 20,
    effect: async (state, card, quantity, underworld, prediction) => {
      const player = state.casterPlayer;
      if (player) {
        let targets = state.targetedUnits.filter(u => {
          return u.alive && u.health < healthThreshold;
        });
        for (let target of targets) {
          if (target) {
            if (!prediction) {
              const newCardId = Unit.unitSourceIdToName(target.unitSourceId, target.isMiniboss);
              const upgrade = upgradeCardsSource.find(u => u.title == newCardId)
              if (upgrade) {
                floatingText({ coords: target, text: 'Soul Captured!' });
                underworld.forceUpgrade(player, upgrade, true);
                makeManaTrail(target, state.casterUnit, underworld, '#321d73', '#9526cc', targets.length).then(() => {
                  playDefaultSpellSFX(card, prediction);
                });
              } else {
                console.error('Cannot capture soul, upgrade not found with title:', newCardId)
              }
            }
            Unit.die(target, underworld, prediction);
          }
        }
        if (targets.length == 0) {
          refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        }
      } else {
        console.error(`Cannot ${id}, no effectState.casterPlayer`);
      }
      return state;
    },
  },
};
export default spell;
