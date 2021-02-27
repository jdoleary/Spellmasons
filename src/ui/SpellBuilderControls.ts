import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../Image';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config';
import { getManaCost, Spell } from '../Spell';
import floatingText from '../FloatingText';
let currentSpell: Spell = null;

const elBoard = document.getElementById('board');
export default function setupSpellBuilderUI() {
  // Add board click handling
  elBoard.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (e.target === elBoard) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let cell_x = Math.floor(x / CELL_SIZE);
      let cell_y = Math.floor(y / CELL_SIZE);
      if (window.inverted) {
        cell_x = Math.abs((cell_x + 1 - BOARD_WIDTH) % BOARD_WIDTH);
        cell_y = Math.abs((cell_y + 1 - BOARD_HEIGHT) % BOARD_HEIGHT);
      }
      console.log('Click in cell:', cell_x, cell_y, currentSpell);
      if (currentSpell) {
        if (currentSpell.summon) {
          const vy = cell_y > 3 ? -1 : 1;
          if (
            window.game.units.filter((u) => u.alive && u.x === cell_x && u.y === cell_y)
              .length
          ) {
            floatingText({
              cellX: cell_x,
              cellY: cell_y,
              color: 'red',
              text: "Cannot cast here, something's in the way",
            });
          } else {
            window.pie.sendData({
              type: MESSAGE_TYPES.SPELL,
              spell: {
                x: cell_x,
                y: cell_y,
                summon: { ...currentSpell.summon, vx: 0, vy },
              },
            });
          }
        } else {
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            spell: { ...currentSpell, x: cell_x, y: cell_y },
          });
        }
      }
    } else {
      console.error('Board is not the target of click', e.target);
    }
  });
  const elManaCost = document.getElementById('mana-cost');
  const elSpellConjurConfig = document.getElementById('spell-conjure-config');
  const elSpellDamageText = document.getElementById('spell-damage-text');
  const elSpellHealText = document.getElementById('spell-heal-text');
  function setCurrentSpell(spell: Spell) {
    currentSpell = spell;
    const { aoe_radius = 0, damage = 0, delay = 0 } = currentSpell;
    console.log('set current spell to', currentSpell);
    elManaCost.innerText = getManaCost(spell) + ' mana cost';
    elSpellDamageText.innerText =
      damage > 0 ? `${Math.abs(damage)} Damage` : '0 Damage';
    elSpellHealText.innerText =
      damage < 0 ? `${Math.abs(damage)} Heal` : '0 Heal';
    elSpellDelayText.innerText = `${Math.abs(delay)} Turn Delay`;
    spellRangeText.innerText = `${aoe_radius} AOE`;
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
  document.getElementById('spell-plus-damage').addEventListener('click', () => {
    const currentDamage = currentSpell.damage || 0;
    const damage = currentDamage < 1 ? 1 : currentDamage + 1;
    setCurrentSpell({
      ...currentSpell,
      damage,
    });
  });
  document.getElementById('spell-plus-heal').addEventListener('click', () => {
    const currentDamage = currentSpell.damage || 0;
    const damage = currentDamage > -1 ? -1 : currentDamage - 1;
    setCurrentSpell({
      ...currentSpell,
      damage,
    });
  });
  const elSpellDelayText = document.getElementById('spell-delay-text');
  document.getElementById('spell-delay-minus').addEventListener('click', () => {
    const delay = Math.max(0, (currentSpell.delay || 0) - 1);
    setCurrentSpell({
      ...currentSpell,
      delay,
    });
  });
  document.getElementById('spell-delay-plus').addEventListener('click', () => {
    const delay = (currentSpell.delay || 0) + 1;
    setCurrentSpell({
      ...currentSpell,
      delay,
    });
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
  });
}
