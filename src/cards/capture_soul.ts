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

const id = 'Capture Soul';
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
    effect: async (state, card, quantity, underworld, prediction) => {
      const player = state.casterPlayer;
      if (player) {
        let targets = state.targetedUnits.filter(u => {
          return u.alive && u.health < healthThreshold;
        });
        for (let target of targets) {
          if (target) {
            if (!prediction) {
              const newCardId = target.isMiniboss ? `${target.unitSourceId} Miniboss` : target.unitSourceId;
              const upgrade = upgradeCardsSource.find(u => u.title == newCardId)
              if (upgrade) {
                floatingText({ coords: target, text: 'Soul Captured!' });
                // TODO Persist to server?
                upgrade.effect(player, underworld);
                player.upgrades.push(upgrade);
                // Now remove this card because it's use destroys itself:
                player.inventory = player.inventory.filter(x => x !== id);
                // Replace the card in the toolbar
                const toolbarIndex = player.cards.findIndex(x => x == id);
                if (toolbarIndex !== -1) {
                  player.cards[toolbarIndex] = newCardId
                }
                // Remove duplicate instance of the new card since when it's
                // added it gets added to the toolbar and replaces the capture soul spell
                player.cards.forEach((cardId, index) => {
                  if (cardId == newCardId && index !== toolbarIndex) {
                    player.cards[index] = '';
                  }
                });
                // Recalc cards so the card changes show up
                recalcPositionForCards(player, underworld);
                makeManaTrail(target, state.casterUnit, underworld, '#321d73', '#9526cc').then(() => {
                  playDefaultSpellSFX(card, prediction);
                });
              } else {
                console.log('Capture soul upgrade id', newCardId);
                console.error('Cannot capture soul, upgrade not found')
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
