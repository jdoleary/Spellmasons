import type { Spell } from '.';

const id = 'amplify';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'amplify.png',
    probability: 3,
    description: `
Doubles all the cards that follow (excluding amplify cards).
    `,
    effect: async (state, _dryRun, index) => {
      const cardsThatFollow = state.cards
        .slice(index + 1)
        // Exclude amplify cards which would cause an infinite loop
        .filter((cardId) => cardId !== id);
      state.cards = [...state.cards, ...cardsThatFollow];
      return state;
    },
  },
};
export default spell;
