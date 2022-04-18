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
import add_damage, { UnitDamage } from './add_damage';
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
import protection from './protection';
import clone from './clone';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import vampire_bite from './vampire_bite';
import { IUpgrade, upgradeCardsSource } from '../Upgrade';
import { _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../CardUI';
export interface Modifiers {
  add?: (unit: Unit.IUnit) => void;
  remove?: (unit: Unit.IUnit) => void;
}
export interface Spell {
  card: ICard;
  // modifiers keep track of additional state on an individual unit basis
  modifiers?: Modifiers;
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
  // Add modifiers to allModifiers
  if (spell.modifiers) {
    allModifiers[id] = spell.modifiers;
  }
  // Add card as upgrade:
  upgradeCardsSource.push(cardToUpgrade(card));
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
  register(clone);
  register(mana_burn);
  register(mana_steal);
  register(vampire_bite);
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
    },
    probability: c.probability
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
  targetedUnits: Unit.IUnit[];
  castLocation: Vec2;
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    unitDamage: UnitDamage[],
    damageDealt: number,
    healingDealt: number
  };
}
export type EffectFn = {
  // Dry run is for displaying to the user what will happen if they cast
  (state: EffectState, dryRun: boolean): Promise<EffectState>;
};

export interface ICard {
  id: string;
  manaCost: number;
  healthCost: number;
  probability: number;
  thumbnail: string;
  effect: EffectFn;
  description: string;
  // requiresFollowingCard is for cards like chain or AOE that need another
  // card to follow them in order to have an effect
  requiresFollowingCard?: boolean;
}

export const allCards: { [cardId: string]: ICard } = {};
export const allModifiers: { [id: string]: Modifiers } = {};

export function getCardsFromIds(cardIds: string[]): ICard[] {
  return _getCardsFromIds(cardIds, allCards);
}

export function addUnitTarget(unit: Unit.IUnit, effectState: EffectState) {
  // Adds a unit's id to effectState.unitTargets IF it is not already in unitTargets
  if (effectState.targetedUnits.indexOf(unit) === -1) {
    effectState.targetedUnits.push(unit);
  }
}
// Takes the array of targets and returns a (deduplicated) array of units
export function targetsToUnits(targets: Vec2[]): Unit.IUnit[] {
  // Get units at coordinates
  const unitsAndUndefined = targets.map(t => window.underworld.getUnitAt(t));
  // remove undefined
  const units = unitsAndUndefined.flatMap(u => !!u ? [u] : []);
  const dedupedUnits = units.filter((unit, index) => units.indexOf(unit) === index);
  return dedupedUnits;
}

export function tallyUnitDamage(state: EffectState | undefined, damage: number, unit?: Unit.IUnit) {
  // If there is no effect state, for instance, if damage is done during onTurnStart or during an AI turn
  // (not during) a card effect, then just return immediately, there is no work for this function to do
  if (!state) {
    return
  }
  if (unit) {
    // Save damage statistics so that planning view can determine if 
    // this damage will kill the target
    let unitDamageInstanceForThisUnit: UnitDamage | undefined = state.aggregator.unitDamage.find(ud => ud.id === unit.id)
    if (!unitDamageInstanceForThisUnit) {
      unitDamageInstanceForThisUnit = {
        id: unit.id,
        x: unit.x,
        y: unit.y,
        health: unit.health,
        damageTaken: 0
      };
      state.aggregator.unitDamage.push(unitDamageInstanceForThisUnit);
    }
    unitDamageInstanceForThisUnit.damageTaken += damage
  }
  if (damage < 0) {
    state.aggregator.healingDealt = -damage;
  } else {
    state.aggregator.damageDealt = damage;
  }

}