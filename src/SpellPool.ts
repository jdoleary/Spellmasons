// const elPool = document.getElementById('spell-pool');
const spells: string[][] = [[], [], []];
export let selectedSpell;
export let selectedSpellIndex;
export function clearSpellIndex(index: number) {
  spells[index] = [];
  updateSpellLabel(index);
}
function updateSpellLabel(index: number) {
  // Change the UI label of the spell in the pool to the number of modifiers in the spell
  const elSpell = document.getElementById('spell-' + index);
  elSpell.querySelector('.spell-content').innerHTML = spells[
    index
  ].length.toString();
}
export function addModifierToSpell(modifier: string) {
  // Add the modifier to the spell
  spells[selectedSpellIndex].push(modifier);
  updateSpellLabel(selectedSpellIndex);
}
export function selectSpell(index?: number) {
  // Deselect selected spell visually
  document.querySelector('.spell.selected')?.classList.remove('selected');

  selectedSpell = spells[index];
  selectedSpellIndex = index;
  if (selectedSpell) {
    // Update the selected spell DOM element
    document.getElementById('spell-' + index)?.classList.add('selected');
  }
  // update tooltip with current state of clicked spell
  window.setTooltip(JSON.stringify(selectedSpell || '', null, 2));
}
export function create() {
  const elPoolSpells = document.querySelectorAll('#spell-pool .spell');
  for (let i = 0; i < elPoolSpells.length; i++) {
    const el: HTMLDivElement = document.querySelector(
      '#spell-pool #spell-' + i,
    );
    // Start with the first spell selected
    selectSpell(0);

    // Click on spell
    el.addEventListener('click', (e) => {
      // Keep the last selected spell in state for casting later
      selectSpell(i);
    });
  }
}
export function cardChosen(elementId: string) {
  document.getElementById(elementId)?.classList.add('disabled');
}
