import type { IPlayer } from './Player';
import * as Unit from './Unit';
import type * as Card from './Card';
import type Image from './Image';
import * as math from './math';
import { SHIELD_MULTIPLIER } from './config';
import type { Coords } from './commonTypes';

export interface Spell {
  caster?: IPlayer;
  x: number;
  y: number;
  heal?: number;
  damage?: number;
  freeze?: number;
  shield?: number;
  chain?: boolean;
  trap?: boolean;
  swap?: boolean;
  push?: number;
  area_of_effect?: number;
  image?: Image;
}
export function buildSpellFromCardTally(
  cardTally: Card.CardTally,
  player: IPlayer,
  coords: Coords,
): Spell {
  const cardCountPairs = Object.entries(cardTally);
  // Begin building spell from the coordinates
  let spell: Spell = coords;
  for (let [cardId, count] of cardCountPairs) {
    const upgrade = player.upgrades.find((u) => u.spellId === cardId);
    // "infinite" cards get the tally that is the summation of all of the upgrades with that id
    // whereas "finite" cards get the tally of as many finite cards that are chosen
    if (upgrade && upgrade.infinite) {
      // Supports increasing base stat
      spell[cardId] = player.upgrades.filter(
        (u) => u.spellId === cardId,
      ).length;
    } else {
      spell[cardId] = count;
    }
  }
  return spell;
}
export function getImage(s: Spell) {
  let imgPath = '';
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
  if (s.trap) {
    imgPath = 'images/spell/trap.png';
  }
  if (s.push) {
    imgPath = 'images/spell/push.png';
  }
  if (s.swap) {
    imgPath = 'images/spell/swap.png';
  }
  return imgPath;
}
export interface EffectArgs {
  unit?: Unit.IUnit;
  // Used to prevent infinite loops when recuring via chain for example
  ignore?: Unit.IUnit[];
}
export function effect(spell: Spell, args?: EffectArgs) {
  const { unit, ignore = [] } = args || {};
  if (unit && ignore.includes(unit)) {
    return;
  }
  if (unit && spell.push > 0) {
    for (let i = 0; i < spell.push; i++) {
      const moveTo = math.oneCellAwayFromCell(unit, spell.caster.unit);
      Unit.moveTo(unit, moveTo);
    }
  }
  if (unit && spell.heal) {
    Unit.takeDamage(unit, -spell.heal, 'spell');
  }
  if (unit && spell.damage) {
    Unit.takeDamage(unit, spell.damage, 'spell');
  }
  if (unit && spell.freeze > 0) {
    unit.modifiers.frozen = (unit.modifiers.frozen || 0) + spell.freeze;
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
}
