import * as CardUI from '../CardUI';
import type { Spell } from '.';

const id = 'discard';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'discard.png',
    probability: 3,
    description: `
Discards all the following cards and draws the number of cards you discarded as draws new cards in your hand.
    `,
    effect: async (state, dryRun, index) => {
      if (dryRun) {
        return state;
      }
      const discarded = state.cards.slice(index + 1);
      for (let i = 0; i < discarded.length; i++) {
        const card = CardUI.generateCard();
        if(state.casterPlayer){
          CardUI.addCardToHand(card, state.casterPlayer);
        }
      }
      state.cards = state.cards.slice(0, index + 1);
      return state;
    },
  },
};
export default spell;
