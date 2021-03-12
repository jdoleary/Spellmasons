import { modifySpell, Spell, toString, unmodifySpell } from './Spell';

let currentSpell = {};
const elPool = document.getElementById('spell-pool');
export function getSelectedSpell(): Spell {
  return currentSpell;
}
export function addModifierToSpell(modifier: string) {
  // Add the modifier to the spell
  modifySpell(modifier, getSelectedSpell());
  updateSelectedSpellUI();
}
export function removeModifierFromSpell(modifier: string) {
  // Remove the modifier from the spell
  unmodifySpell(modifier, getSelectedSpell());
  updateSelectedSpellUI();
}
export function updateSelectedSpellUI() {
  elPool.innerText = toString(currentSpell);
}
export function cardChosen(elementId: string) {
  document.getElementById(elementId)?.classList.add('disabled');
}
