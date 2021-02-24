import { MESSAGE_TYPES } from '../index';
import { CELL_SIZE } from '../Image';
import { getManaCost, Spell } from '../Spell';
let currentSpell: Spell = null;

const elBoard = document.getElementById('board');
export default function setupSpellBuilderUI() {
  // Add board click handling
  elBoard.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell_x = Math.floor(x / CELL_SIZE);
    const cell_y = Math.floor(y / CELL_SIZE);
    console.log('Click in cell:', cell_x, cell_y, currentSpell);
    if (currentSpell) {
      if (currentSpell.summon) {
        const vy = cell_y > 3 ? -1 : 1;
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          spell: {
            x: cell_x,
            y: cell_y,
            summon: { ...currentSpell.summon, vx: 0, vy },
          },
        });
      } else {
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          spell: { ...currentSpell, x: cell_x, y: cell_y },
        });
      }
    }
  });
  const elManaCost = document.getElementById('mana-cost');
  const elSpellConjurConfig = document.getElementById('spell-conjure-config');
  function setCurrentSpell(spell: Spell) {
    currentSpell = spell;
    console.log('set current spell to', currentSpell);
    elManaCost.innerText = getManaCost(spell) + ' mana cost';
  }
  // Add button handlers
  document.getElementById('spell-summon').addEventListener('click', () => {
    const imagePath =
      window.clientId === window.game.players[0].clientId
        ? 'crocodile.png'
        : 'parrot.png';
    setCurrentSpell({ summon: { imagePath } });
    elSpellConjurConfig.style.visibility = 'hidden';
  });
  document.getElementById('spell-conjure').addEventListener('click', () => {
    elSpellConjurConfig.style.visibility = 'visible';
    setCurrentSpell({});
  });
  const elSpellDamageText = document.getElementById('spell-damage-text');
  document.getElementById('spell-plus-damage').addEventListener('click', () => {
    const damage = (currentSpell.damage || 0) + 1;
    setCurrentSpell({
      ...currentSpell,
      damage,
    });
    elSpellDamageText.innerText = `${damage} ${damage > 0 ? 'Damage' : 'Heal'}`;
  });
  document.getElementById('spell-plus-heal').addEventListener('click', () => {
    const damage = (currentSpell.damage || 0) - 1;
    setCurrentSpell({
      ...currentSpell,
      damage,
    });
    elSpellDamageText.innerText = `${Math.abs(damage)} ${
      damage > 0 ? 'Damage' : 'Heal'
    }`;
  });
  document.getElementById('spell-freeze').addEventListener('click', (e) => {
    const { checked } = e.target as HTMLInputElement;
    setCurrentSpell({ ...currentSpell, freeze: checked });
  });
  document.getElementById('spell-chain').addEventListener('click', (e) => {
    const { checked } = e.target as HTMLInputElement;
    setCurrentSpell({ ...currentSpell, chain: checked });
  });
  const spellRange = document.getElementById('spell-range');
  const spellRangeText = document.getElementById('spell-range-text');
  spellRange.addEventListener('click', (e) => {
    const { value } = e.target as HTMLInputElement;
    setCurrentSpell({ ...currentSpell, aoe_radius: parseInt(value) });
    spellRangeText.innerText = `${value} AOE`;
  });
}
