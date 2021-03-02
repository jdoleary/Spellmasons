import type Game from './Game';
import type { IPlayer } from './Player';
import * as Unit from './Unit';
import floatingText from './FloatingText';
import Image from './Image';

export interface Spell {
  caster?: IPlayer;
  x?: number;
  y?: number;
  // index in spell pool
  index: number;
  // damage can be negative for healing
  damage?: number;
  freeze?: boolean;
  chain?: boolean;
  aoe_radius?: number;
  image?: Image;
}

// Creates a spell object from a list of modifier strings from cards.ts
export function createSpellFromModifiers(
  modifiers: string[],
  initialValues: Spell,
) {
  const spell = initialValues;
  spell.damage = modifiers.reduce(
    (acc, mod) => acc + (mod === 'Damage' ? 1 : mod === 'Heal' ? -1 : 0),
    0,
  );
  spell.freeze = modifiers.includes('Freeze');
  spell.chain = modifiers.includes('Chain');
  spell.aoe_radius = modifiers.reduce(
    (acc, mod) => acc + (mod === 'AOE' ? 1 : 0),
    0,
  );
  return spell;
}
export function getImage(s: Spell) {
  let imgPath = 'spell/damage.png';
  if (s.damage) {
    imgPath = 'spell/damage.png';
  }
  if (s.freeze) {
    imgPath = 'spell/freeze.png';
  }
  if (s.chain) {
    imgPath = 'spell/chain.png';
  }
  if (s.aoe_radius > 0) {
    imgPath = 'spell/aoe.png';
  }
  return imgPath;
}
function toString(s: Spell) {
  const strings = [];
  if (s.damage > 0) {
    strings.push('Hurt');
  }
  if (s.damage < 0) {
    strings.push('Heal');
  }
  if (s.freeze) {
    strings.push('Freeze');
  }
  if (s.chain) {
    strings.push('Chain');
  }
  if (s.aoe_radius > 0) {
    strings.push('AOE');
  }
  return strings.join('|');
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
  if (unit && spell.freeze) {
    unit.frozen = true;
  }
  // Show an image when cast occurs
  const castImage = new Image(spell.x, spell.y, 0, 0, getImage(spell));
  castImage.scale(1.5);
  castImage.updateFilter(0);
  castImage.remove();
}
