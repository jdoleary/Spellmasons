import { MESSAGE_TYPES } from './MessageTypes';
import { addModifierToSpell, selectedPreSpellIndex } from './SpellPool';
const elCardHolder = document.getElementById('card-holder');
export function clearCards() {
  elCardHolder.innerHTML = '';
}
// Cards are used for chanelling unique spells each turn.
// Both players are presented with a number of cards and they take turns deciding which to
// add to their chanelling spell orbs
export function generateCards(numberOfCards: number) {
  const cards = [];
  for (let i = 0; i < numberOfCards; i++) {
    const card = generateCard();
    const el = cardDOM(card, i);
    cards.push(el);
  }
}
interface SpellMod {
  description: string;
  thumbnail: string;
  probability: number;
}
const modifiers: SpellMod[] = [
  {
    description: 'Damage',
    thumbnail: 'images/spell/damage.png',
    probability: 10,
  },
  {
    description: 'Heal',
    thumbnail: 'images/spell/heal.png',
    probability: 5,
  },
  {
    description: 'Chain',
    thumbnail: 'images/spell/chain.png',
    probability: 1,
  },
  {
    description: 'Freeze',
    thumbnail: 'images/spell/freeze.png',
    probability: 2,
  },
  {
    description: 'AOE',
    thumbnail: 'images/spell/aoe.png',
    probability: 1,
  },
];
function generateCard() {
  // Chooses a random modifier based on their probability
  const maxProbability = modifiers.reduce(
    (maxProbability, current) => current.probability + maxProbability,
    0,
  );
  // Choose random integer within the sum of all the probabilities
  const roll = window.random.integer(0, maxProbability);
  let rollingLowerBound = 0;
  // Iterate each modifier and check if the roll is between the lower bound and the upper bound
  // which means that the current mod would have been rolled
  for (let mod of modifiers) {
    if (
      roll >= rollingLowerBound &&
      roll <= mod.probability + rollingLowerBound
    ) {
      return mod;
    } else {
      rollingLowerBound += mod.probability;
    }
  }
  // Logically it should never reach this point
  return modifiers[0];
}
function cardDOM(content: SpellMod, index: number) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.id = 'card-' + index;
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = content.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  element.appendChild(thumbHolder);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  desc.innerText = content.description;
  element.appendChild(desc);
  element.addEventListener('click', () => {
    if (window.game.yourTurn) {
      if (element.classList.contains('disabled')) {
        // You cannot select disabled cards
        return;
      }
      if (selectedPreSpellIndex !== undefined) {
        // Add card contents to spell:
        addModifierToSpell(content.description);
        // Send the selection to the other player
        window.pie.sendData({
          type: MESSAGE_TYPES.CHOOSE_CARD,
          id: element.id,
        });
      } else {
        alert('You must select a spell before choosing a card');
      }
    }
  });
  elCardHolder.appendChild(element);
  return element;
}
