import type { IPlayer } from './Player';
import * as Unit from './Unit';
import type * as Card from './cards';
import floatingText from './FloatingText';
import Image from './Image';
import { SHIELD_MULTIPLIER } from './config';

export interface Spell {
  caster?: IPlayer;
  x?: number;
  y?: number;
  heal?: number;
  damage?: number;
  freeze?: number;
  shield?: number;
  chain?: boolean;
  area_of_effect?: number;
  image?: Image;
}
export function buildSpellFromCardTally(cardTally: Card.CardTally): Spell {
  const cardCountPairs = Object.entries(cardTally);
  let spell: Spell = {};
  for (let [cardId, count] of cardCountPairs) {
    spell[cardId] = count;
  }
  return spell;
}
export function getImage(s: Spell) {
  let imgPath = 'images/spell/damage.png';
  if (s.damage > 0) {
    imgPath = 'images/spell/damage.png';
  }
  if (s.heal > 0) {
    imgPath = 'images/spell/heal.png';
  }
  if (s.freeze > 0) {
    imgPath = 'images/spell/freeze.png';
  }
  if (s.chain) {
    imgPath = 'images/spell/chain.png';
  }
  if (s.area_of_effect > 0) {
    imgPath = 'images/spell/aoe.png';
  }
  if (s.shield > 0) {
    imgPath = 'images/spell/shield.png';
  }
  return imgPath;
}
export interface EffectArgs {
  unit?: Unit.IUnit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit.IUnit[];
}
export function effect(spell: Spell, args: EffectArgs) {
  console.log('🚀 ~ file: Spell.ts ~ line 53 ~ effect ~ spell', spell);
  const { unit, ignore = [] } = args;
  if (unit && ignore.includes(unit)) {
    return;
  }
  if (unit && spell.heal) {
    Unit.takeDamage(unit, -spell.heal, 'spell');
  }
  if (unit && spell.damage) {
    Unit.takeDamage(unit, spell.damage, 'spell');
  }
  if (unit && spell.freeze > 0) {
    unit.frozenForTurns += spell.freeze;
    const frozenSprite = unit.image.addSubSprite(
      'images/spell/freeze.png',
      'frozen',
    );
    frozenSprite.alpha = 0.5;
    frozenSprite.anchor.x = 0;
    frozenSprite.anchor.y = 0;
    frozenSprite.scale.x = 0.5;
    frozenSprite.scale.y = 0.5;
  }
  if (unit && spell.shield > 0) {
    unit.shield += spell.shield * SHIELD_MULTIPLIER;
    const shieldSprite = unit.image.addSubSprite(
      'images/spell/shield.png',
      'shield',
    );
    shieldSprite.alpha = 0.5;
    shieldSprite.anchor.x = 0;
    shieldSprite.anchor.y = 0;
    shieldSprite.scale.x = 0.5;
    shieldSprite.scale.y = 0.5;
  }
  // Show an image when cast occurs
  const castImage = new Image(spell.x, spell.y, getImage(spell));
  castImage.scale(1.5);
  castImage.updateFilter(0);
  castImage.remove();
}
