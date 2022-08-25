import { PLAYER_BASE_HEALTH } from '../config';
import * as Unit from './Unit';
import * as Image from '../graphics/Image';
import type * as Upgrade from '../Upgrade';
import * as CardUI from '../graphics/ui/CardUI';
import * as Cards from '../cards';
import * as config from '../config';
import { Faction, UnitType } from '../types/commonTypes';
import { clearTooltipSelection } from '../graphics/PlanningView';
import defaultPlayerUnit from './units/playerUnit';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { playerCastAnimationColor, playerCoatPrimary, playerCoatSecondary, robeColors } from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { lerp } from "../jmath/math"
import * as inLiquid from '../inLiquid';

const elLobbyBody = document.getElementById('lobby-body') as (HTMLElement | undefined);
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IPlayerSerialized = Omit<IPlayer, "unit"> & { unit: { id: number } };
export interface CardUsage {
  [cardId: string]: number
}
export interface IPlayer {
  // Multiplayer "gamer handle"
  name: string;
  // color of robe
  color: number;
  ready: boolean;
  endedTurn: boolean;
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  inPortal: boolean;
  isSpawned: boolean;
  cards: string[];
  inventory: string[];
  // The number of cards a player's hand is populated with at the start of a level
  cardsAmount: number;
  upgrades: Upgrade.IUpgrade[];
  // Note: call updateCardManaBadges() any time you modify cardUsageCounts so it will
  // be reflected in the UI
  cardUsageCounts: CardUsage;
}
export function create(clientId: string, underworld: Underworld): IPlayer {
  const userSource = defaultPlayerUnit;
  const player: IPlayer = {
    name: '',
    ready: false,
    endedTurn: false,
    clientId,
    // init players as not connected.  clientConnected status
    // should only be handled in one place and tied directly
    // to pie.clients
    clientConnected: false,
    color: 0xffffff,
    unit: Unit.create(
      userSource.id,
      NaN,
      NaN,
      Faction.ALLY,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
      1,
      undefined,
      underworld
    ),
    inPortal: true,
    isSpawned: false,
    cards: Array(config.NUMBER_OF_TOOLBAR_SLOTS).fill(''),
    inventory: [],
    cardUsageCounts: {},
    cardsAmount: config.START_CARDS_COUNT,
    upgrades: [],
  };

  // Player units get full mana every turn
  player.unit.manaPerTurn = player.unit.manaMax;
  // Player units shouldn't be pushed around
  // during collisions while other units move
  player.unit.immovable = true;
  player.unit.attackRange = config.PLAYER_BASE_ATTACK_RANGE;
  player.unit.staminaMax = config.PLAYER_BASE_STAMINA;
  player.unit.stamina = config.PLAYER_BASE_STAMINA;

  updateGlobalRefToCurrentClientPlayer(player);
  // Add initial cards to hand
  // CardUI.addCardToHand(allCards['hurt'], player);
  // CardUI.addCardToHand(allCards['summon_decoy'], player);
  // CardUI.addCardToHand(allCards['heal'], player);
  // CardUI.addCardToHand(allCards['AOE'], player);
  // CardUI.addCardToHand(allCards['chain'], player);
  // CardUI.addCardToHand(allCards['purify'], player);
  // CardUI.addCardToHand(allCards['mana_burn'], player);
  // CardUI.addCardToHand(allCards['mana_steal'], player);
  // CardUI.addCardToHand(allCards['poison'], player);
  // CardUI.addCardToHand(allCards['protection'], player);
  // CardUI.addCardToHand(allCards['resurrect'], player);
  // CardUI.addCardToHand(allCards['shield'], player);
  // CardUI.addCardToHand(allCards['vulnerable'], player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;

  underworld.players.push(player);
  underworld.queueGameLoop();
  return player;
}
// TODO: This creates a NEW MultiColorReplaceFilter,
// there should be a better way of syncing filters.  This is a footgun if called
// more than once on a player object.  As of this writing it is only called on new player objects
// Proceed with caution.
// color: a color in hex such as 0xff0000
export function setPlayerRobeColor(player: IPlayer, color: number | string) {
  // Protect against hex number as string coming in from storage
  if (typeof color === 'string') {
    color = parseInt(color);
  }
  player.color = color;
  // Add player-specific shaders
  // regardless of if the image sprite changes to a new animation or not.
  if (player.unit.image && player.unit.image.sprite.filters) {
    const r = Math.floor(color / 0x10000);
    const g = Math.floor((color - r * 0x10000) / 0x100);
    const b = Math.floor((color - r * 0x10000 - g * 0x100));

    const lightenCoefficient = 0.3;
    const r_secondary = Math.floor(lerp(r, 255, lightenCoefficient));
    const g_secondary = Math.floor(lerp(g, 255, lightenCoefficient));
    const b_secondary = Math.floor(lerp(b, 255, lightenCoefficient));

    const colorSecondary = parseInt(`0x${r_secondary.toString(16)}${g_secondary.toString(16)}${b_secondary.toString(16)}`, 16);
    if (color && colorSecondary) {
      // @ts-ignore for some reason ts is flagging this as an error but it works fine
      // in pixi.
      const robeColorFilter = new MultiColorReplaceFilter(
        [
          [playerCoatPrimary, color],
          [playerCoatSecondary, colorSecondary],
          [playerCastAnimationColor, color],
        ],
        0.1
      );
      const ROBE_COLOR_FILTER_ID = 'robeColorFilter';
      // @ts-ignore: jid is a custom identifier to differentiate this filter
      robeColorFilter.jid = ROBE_COLOR_FILTER_ID;
      // Remove previous robeColorFilters
      // @ts-ignore: jid is a custom identifier to differentiate this filter
      player.unit.image.sprite.filters = player.unit.image.sprite.filters.filter(f => f.jid != ROBE_COLOR_FILTER_ID);
      // Add new robe color filter
      player.unit.image.sprite.filters.push(robeColorFilter);
    }
  }


}
export function resetPlayerForNextLevel(player: IPlayer, underworld: Underworld) {
  // Player is no longer in portal
  player.inPortal = false;
  // Set the player so they can choose their next spawn
  player.isSpawned = false;

  // Make unit visible
  Image.show(player.unit.image);
  if (!player.unit.alive) {
    Unit.resurrect(player.unit);
  }

  if (player.unit.image) {
    // Remove liquid mask which may be attached if the player died in liquid
    inLiquid.remove(player.unit);
    // Restore player alpha which was 0.5 while player
    // was looking for a spawn point
    player.unit.image.sprite.alpha = 1.0;
  }

  // Remove all modifiers between levels
  // This prevents players from scamming shields at the end of a level
  // on infinite mana
  Object.keys(player.unit.modifiers).forEach(modifier => {
    Unit.removeModifier(player.unit, modifier, underworld);
  });

  // Reset mana and health - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  player.unit.mana = player.unit.manaMax;
  player.unit.health = player.unit.healthMax;
  player.unit.stamina = player.unit.staminaMax;

  Unit.returnToDefaultSprite(player.unit);
}
// Keep a global reference to the current client's player
export function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  if (globalThis.clientId === player.clientId) {
    globalThis.player = player;
  }
}
// Converts a player entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full player entity 
// This is the opposite of load
export function serialize(player: IPlayer): IPlayerSerialized {
  const { unit, ...rest } = player;
  return {
    ...rest,
    unit: { id: unit.id },
  }
}
// load rehydrates a player entity from IPlayerSerialized
export function load(player: IPlayerSerialized, underworld: Underworld) {
  const reassignedUnit = underworld.units.find(u => u.id == player.unit.id);
  if (!reassignedUnit) {
    console.error('Failed to load player because cannot find associated unit with ID', player.unit.id);
    console.log('Requesting game state from host')
    underworld.pie.sendData({
      type: MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE
    })
    return
  }
  const playerLoaded: IPlayer = {
    ...player,
    unit: reassignedUnit,
  };
  // Make sure player unit stays hidden if they are in a portal
  if (playerLoaded.inPortal) {
    playerLoaded.unit.x = NaN;
    playerLoaded.unit.y = NaN;
  }
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  CardUI.recalcPositionForCards(playerLoaded, underworld);
  underworld.players.push(playerLoaded);
  setClientConnected(playerLoaded, underworld.clients.includes(player.clientId), underworld);
  underworld.queueGameLoop();
  setPlayerRobeColor(playerLoaded, playerLoaded.color);
  return playerLoaded;
}

// Sets boolean and substring denoting if the player has a @websocketpie/client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean, underworld: Underworld) {
  player.clientConnected = connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected.png');
    underworld.queueGameLoop();
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected.png');
    // If they disconnect, end their turn
    underworld.endPlayerTurn(player.clientId);
  }
  syncLobby(underworld)
}
function syncLobby(underworld: Underworld) {
  // Update lobby element
  if (elLobbyBody) {
    elLobbyBody.innerHTML = underworld.players.map(p => `<tr><td>${p.clientId}</td><td>${p.clientConnected}</td></tr>`).join('');
  }
}
export function enterPortal(player: IPlayer, underworld: Underworld) {
  player.inPortal = true;
  Image.hide(player.unit.image);
  // Make sure to resolve the moving promise once they enter the portal or else 
  // the client queue will get stuck
  player.unit.resolveDoneMoving();
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.setLocation(player.unit, { x: NaN, y: NaN });
  // Clear the selection so that it doesn't persist after portalling (which would show
  // your user's move circle in the upper left hand of the map but without the user there)
  clearTooltipSelection();
  // Entering the portal ends the player's turn
  underworld.endPlayerTurn(player.clientId);
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive && player.clientConnected;
}

export function addCardToHand(card: Cards.ICard | undefined, player: IPlayer | undefined, underworld: Underworld) {
  if (!card) {
    console.error('Attempting to add undefined card to hand');
    return
  }
  if (!player) {
    console.warn("Attempted to add cards to a non-existant player's hand")
    return
  }
  // Players may not have more than 1 of a particular card, because now, cards are
  // not removed when cast
  if (!player.inventory.includes(card.id)) {
    player.inventory.push(card.id);
    const emptySlotIndex = player.cards.indexOf('');
    if (emptySlotIndex !== -1) {
      player.cards[emptySlotIndex] = card.id;
    }
    CardUI.recalcPositionForCards(player, underworld);
  }
}
// This function fully deletes the cards from the player's hand
export function removeCardsFromHand(player: IPlayer, cards: string[], underworld: Underworld) {
  player.cards = player.cards.filter(c => !cards.includes(c));
  // Remove any selected cards with a name in the cards array of this function
  for (let card of cards) {
    document.querySelectorAll(`#selected-cards .card[data-card-id="${card}"]`).forEach(el => {
      // clicking a selected card, deselects it
      (el as HTMLElement).click();
    });
  }
  CardUI.recalcPositionForCards(player, underworld);
}
