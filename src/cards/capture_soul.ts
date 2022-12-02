import { getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { upgradeCardsSource } from '../Upgrade';
import { recalcPositionForCards } from '../graphics/ui/CardUI';
import floatingText from '../graphics/FloatingText';

const id = 'Capture Soul';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Soul,
    manaCost: 40,
    healthCost: 0,
    probability: probabilityMap[CardRarity.RARE],
    expenseScaling: 2,
    thumbnail: 'unknown.png',
    description: `
Captures the soul of the targeted unit allowing you to summon them at will in the future.
This spell is destroyed in the process.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let targets: Vec2[] = getCurrentTargets(state);
      if (!prediction) {
        for (let target of targets) {
          const player = underworld.players.find(p => p.unit == state.casterUnit);
          if (player) {
            if (target && Unit.isUnit(target)) {
              const newCardId = (target as Unit.IUnit).unitSourceId;
              const alreadyHasCard = player.inventory.includes(newCardId);
              if (!alreadyHasCard) {
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
                }
              }
            }
          }
        }
      }
      return state;
    },
  },
};
export default spell;
