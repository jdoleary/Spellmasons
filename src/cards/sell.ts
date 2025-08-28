import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Cards from '../cards';
import floatingText from '../graphics/FloatingText';
import * as config from '../config';
import { recalcPositionForCards, syncInventory } from '../graphics/ui/CardUI';

export const sellCardId = 'Sell';
const spell: Spell = {
  card: {
    id: sellCardId,
    replaces: [],
    category: CardCategory.Blessings,
    supportQuantity: false,
    manaCost: 0,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSell.png',
    allowNonUnitTarget: true,
    requiresFollowingCard: true,
    ignoreRange: true,
    animationPath: '',
    sfx: '',
    omitForWizardType: ['Deathmason'],
    description: ['spell_sell'],
    frontload: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Clear out the rest of the spell so it doesn't actually cast it
      const sellIndex = state.cardIds.indexOf(sellCardId);
      if (sellIndex !== 0) {
        floatingText({ coords: state.castLocation, text: 'sell error' });
        return state;
      }
      if (!prediction && state.casterPlayer) {
        // Use Array.from(new Set()) so that you can't sell the same card more than once
        const cardsToSell = Array.from(new Set(state.cardIds.slice(sellIndex + 1)));
        const sellValues = cardsToSell.map(cardId => {
          const card = Cards.allCards[cardId];
          if (card && state.casterPlayer) {
            const rarity: CardRarity = Object.entries(probabilityMap).find(([rarity, probability]) => probability === card.probability)?.[0] as CardRarity || CardRarity.COMMON;
            const highestSellVal = config.STAT_POINTS_PER_LEVEL * 2;
            const sellValue = Math.round({
              [CardRarity.COMMON]: highestSellVal / 8,
              [CardRarity.SPECIAL]: highestSellVal / 6,
              [CardRarity.UNCOMMON]: highestSellVal / 4,
              [CardRarity.RARE]: highestSellVal / 2,
              [CardRarity.FORBIDDEN]: highestSellVal,
              [CardRarity.RUNIC]: highestSellVal / 2,
            }[rarity]);
            state.casterPlayer.statPointsUnspent += sellValue;
            return `${i18n(card.id)}: ${sellValue} SP`;
          } else {
            return '';
          }
        });

        // Remove sold cards from inv
        if (!state.casterPlayer.disabledCards) {
          state.casterPlayer.disabledCards = []
        }
        state.casterPlayer.disabledCards.push(...cardsToSell)
        // Remove sold cards from toolbar (replaces with empty '')
        state.casterPlayer.cardsInToolbar = state.casterPlayer.cardsInToolbar.map(cardId => cardsToSell.includes(cardId) ? '' : cardId);

        // For the casting player only...
        if (state.casterPlayer === globalThis.player) {
          floatingText({ coords: state.castLocation, text: sellValues.join('\n') });
          // Rerender runes menu in case they have the inventory open because they need to see their SP update
          // renderRunesMenu(underworld);
          recalcPositionForCards(globalThis.player, underworld);
          syncInventory(undefined, underworld);
        }
      }

      state.cardIds = [];
      return state;

    }
  },
};
export default spell;