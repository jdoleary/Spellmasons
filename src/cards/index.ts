import type * as Player from '../Player';
import type * as Unit from '../Unit';
import type { Vec2 } from '../Vec';
import Events, {
  onDamage,
  onDeath,
  onMove,
  onAgro,
  onTurnStart,
} from '../Events';
import Subsprites, { ISubsprites } from '../Subsprites';
// Register spells:
import add_damage from './add_damage';
import add_heal from './add_heal';
import area_of_effect from './area_of_effect';
import chain from './chain';
import contageous from './contageous';
import freeze from './freeze';
import raise_dead from './raise_dead';
import shield from './shield';
import swap from './swap';
import purify from './purify';
import poison from './poison';
import vulnerable from './vulnerable';
import lance from './lance';
import stomp from './stomp';
import protection from './protection';
import charge from './charge';
import obliterate from './obliterate';
import clone from './clone';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import { IUpgrade, upgradeSource } from '../Upgrade';
import { CardType, _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../CardUI';
export interface Spell {
  card: ICard;
  // modifiers keep track of additional state on an individual unit basis
  modifiers?: {
    add: (unit: Unit.IUnit) => void;
    remove: (unit: Unit.IUnit) => void;
  };
  // events trigger custom behavior when some event occurs
  events?: {
    onDamage?: onDamage;
    onDeath?: onDeath;
    onMove?: onMove;
    onAgro?: onAgro;
    onTurnStart?: onTurnStart;
  };
  subsprites?: ISubsprites;
}

function register(spell: Spell) {
  const { subsprites, card, events } = spell;
  const { id } = card;
  // Add card to cards pool
  allCards[id] = card;
  // Add card as upgrade:
  upgradeSource.push(cardToUpgrade(card));
  // Add subsprites
  if (subsprites) {
    Object.entries(subsprites).forEach(([key, value]) => {
      Subsprites[key] = value;
    });
  }
  // Add events
  if (events) {
    if (events.onAgro) {
      Events.onAgroSource[id] = events.onAgro;
    }
    if (events.onDamage) {
      Events.onDamageSource[id] = events.onDamage;
    }
    if (events.onDeath) {
      Events.onDeathSource[id] = events.onDeath;
    }
    if (events.onMove) {
      Events.onMoveSource[id] = events.onMove;
    }
    if (events.onTurnStart) {
      Events.onTurnSource[id] = events.onTurnStart;
    }
  }
}
export function registerCards() {
  register(add_damage);
  register(add_heal);
  register(area_of_effect);
  register(chain);
  register(contageous);
  register(freeze);
  register(raise_dead);
  register(shield);
  register(poison);
  register(purify);
  register(swap);
  register(vulnerable);
  // register(lance);
  // register(stomp);
  register(protection);
  // register(charge);
  register(obliterate);
  register(clone);
  register(mana_burn);
  register(mana_steal);
}
function cardToUpgrade(c: ICard): IUpgrade {
  return {
    title: c.id,
    description: () => c.description,
    thumbnail: `images/spell/${c.thumbnail}`,
    // TODO: Feature creep: What if you could UPGRADE the effect of a spell!! 0.o
    maxCopies: 1,
    effect: (player) => {
      addCardToHand(c, player);
    }
  };
}

// Guiding rules for designing spells:
// Follow the Priciple of Least Surpise
// Every spell effect should be designed to respond well to potentially more than one target
// Note: spells can be found in their own files in src/cards/*
// Make sure each spell's effect returns the state at the very end

export interface EffectState {
  casterPlayer?: Player.IPlayer;
  casterUnit: Unit.IUnit;
  targets: Vec2[];
  // aggregator carries extra information that can be passed
  // between card effects.
  // For example, "Vampiric" adds all damage taken
  // to the caster, this damage taken needs to be aggregated
  // for "Vampiric" to know how much to apply
  aggregator: any;
}
export type EffectFn = {
  // Dry run is for displaying to the user what will happen if they cast
  (state: EffectState, dryRun: boolean, index: number): Promise<EffectState>;
};

export interface ICard {
  id: string;
  type: CardType;
  thumbnail: string;
  probability: number;
  effect: EffectFn;
  description: string;
  // requiresFollowingCard is for cards like chain or AOE that need another
  // card to follow them in order to have an effect
  requiresFollowingCard?: boolean;
}

export const allCards: { [cardId: string]: ICard } = {};

export function getCardsFromIds(cardIds: string[]): ICard[] {
  return _getCardsFromIds(cardIds, allCards);
}