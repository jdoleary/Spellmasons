import { modifySpell, Spell, toString } from './Spell';

// const elPool = document.getElementById('spell-pool');
const spells: Spell[] = [undefined, undefined, undefined];
// Clear / initialize spells
spells.forEach((_s, i) => clearSpellIndex(i));

export function getSelectedSpell(): Spell {
  return spells[selectedSpellIndex];
}
let selectedSpellIndex;
export function clearSpellIndex(index: number) {
  // Reset the spell to only contain it's index
  spells[index] = { index };
  updateSpellLabel(index);
}
function updateSpellLabel(index: number) {
  // TODO now that spells are not prespells, the label is currently meaningless
  // find a new way to visually show what's in a spell
  const elSpell = document.getElementById('spell-' + index);
  elSpell.querySelector('.spell-content').innerHTML = toString(spells[index]);
}
export function addModifierToSpell(modifier: string) {
  // Add the modifier to the spell
  modifySpell(modifier, getSelectedSpell());
  updateSpellLabel(selectedSpellIndex);
  updateSelectedSpellUI();
}
export function updateSelectedSpellUI() {
  // update tooltip with current state of clicked spell
  window.setTooltip(JSON.stringify(getSelectedSpell() || '', null, 2));
}
export function selectSpell(index?: number) {
  // Deselect selected spell visually
  document.querySelector('.spell.selected')?.classList.remove('selected');

  selectedSpellIndex = index;
  if (selectedSpellIndex !== undefined) {
    // Update the selected spell DOM element
    document.getElementById('spell-' + index)?.classList.add('selected');
    updateSelectedSpellUI();
  }
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
