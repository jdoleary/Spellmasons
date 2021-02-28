const elCardHolder = document.getElementById('card-holder');
// Cards are used for chanelling unique spells each turn.
// Both players are presented with a number of cards and they take turns deciding which to
// add to their chanelling spell orbs
export function generateCards(numberOfCards: number) {
  const cards = [];
  for (let i = 0; i < numberOfCards; i++) {
    const card = generateCard();
    const el = cardDOM(card);
    cards.push(el);
  }
}
const modifiers = ['dmg', 'heal', 'chain', 'freeze', 'aoe'];
function generateCard() {
  return modifiers[window.random.integer(0, modifiers.length - 1)];
}
function cardDOM(content: string) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.innerText = content;
  element.addEventListener('click', () => {
    console.log('chose card with ', content);
    element.classList.add('chosen');
  });
  elCardHolder.appendChild(element);
  return element;
}

// <div class="card">
//   <div class="card-thumb"></div>
//   <div class="card-description"></div>
// </div>
