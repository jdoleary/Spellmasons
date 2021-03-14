import type Game from './Game';
import type { IPlayer } from './Player';
import * as Unit from './Unit';
import floatingText from './FloatingText';
import Image from './Image';

const elCurrentSpellDescription = document.getElementById(
  'current-spell-description',
);
let currentSpell: Spell = {};
export function clearCurrentSpell() {
  currentSpell = {};
  updateSelectedSpellUI();
}
export function getSelectedSpell(): Spell {
  return currentSpell;
}
export function updateSelectedSpellUI() {
  elCurrentSpellDescription.innerText = toString(currentSpell);
}
export interface Spell {
  caster?: IPlayer;
  x?: number;
  y?: number;
  // damage can be negative for healing
  damage?: number;
  freeze?: number;
  chain?: boolean;
  aoe_radius?: number;
  image?: Image;
}

export function modifySpell(modifier: string) {
  const spell = currentSpell;
  switch (modifier) {
    case 'Damage':
      spell.damage = (spell.damage || 0) + 1;
      break;
    case 'Heal':
      spell.damage = (spell.damage || 0) - 1;
      break;
    case 'Freeze':
      spell.freeze = (spell.freeze || 0) + 1;
      break;
    case 'Chain':
      spell.chain = true;
      break;
    case 'AOE':
      spell.aoe_radius = (spell.aoe_radius || 0) + 1;
      break;
  }
  updateSelectedSpellUI();
}
export function unmodifySpell(modifier: string) {
  const spell = currentSpell;
  switch (modifier) {
    case 'Damage':
      spell.damage = (spell.damage || 0) - 1;
      break;
    case 'Heal':
      spell.damage = (spell.damage || 0) + 1;
      break;
    case 'Freeze':
      spell.freeze = (spell.freeze || 0) - 1;
      break;
    case 'Chain':
      spell.chain = false;
      break;
    case 'AOE':
      spell.aoe_radius = (spell.aoe_radius || 0) - 1;
      break;
  }
  updateSelectedSpellUI();
}
export function getImage(s: Spell) {
  let imgPath = 'images/spell/damage.png';
  if (s.damage) {
    imgPath = 'images/spell/damage.png';
  }
  if (s.freeze) {
    imgPath = 'images/spell/freeze.png';
  }
  if (s.chain) {
    imgPath = 'images/spell/chain.png';
  }
  if (s.aoe_radius > 0) {
    imgPath = 'images/spell/aoe.png';
  }
  return imgPath;
}
export function toString(s?: Spell) {
  if (!s) {
    return '';
  }
  const strings = [];
  if (s.damage > 0) {
    strings.push(`${s.damage}🔥`);
  }
  if (s.damage < 0) {
    strings.push(`${Math.abs(s.damage)}✨`);
  }
  if (s.freeze) {
    strings.push('🧊');
  }
  if (s.chain) {
    strings.push('⚡');
  }
  if (s.aoe_radius) {
    strings.push(`${s.aoe_radius}💣`);
  }
  return strings.join(' ');
}
export interface EffectArgs {
  unit?: Unit.IUnit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit.IUnit[];
}
export function effect(spell: Spell, args: EffectArgs) {
  const { unit, ignore = [] } = args;
  if (unit && ignore.includes(unit)) {
    return;
  }
  if (unit && spell.damage) {
    floatingText({
      cellX: unit.x,
      cellY: unit.y,
      text: toString(spell),
      color: 'red',
    });
    Unit.takeDamage(unit, spell.damage, 'spell');
  }
  if (unit && spell.freeze > 0) {
    unit.frozenForTurns = spell.freeze;
    unit.image.addSubSprite('images/spell/freeze.png', 'frozen');
  }
  // Show an image when cast occurs
  const castImage = new Image(spell.x, spell.y, getImage(spell));
  castImage.scale(1.5);
  castImage.updateFilter(0);
  castImage.remove();
}
