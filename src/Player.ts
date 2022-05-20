import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';
import * as Image from './Image';
import type * as Upgrade from './Upgrade';
import * as CardUI from './CardUI';
import * as config from './config';
import { Faction, UnitType } from './commonTypes';
import { getClients } from './wsPieHandler';
import { allCards } from './cards';
import { randInt } from './rand';
import { clearTooltipSelection } from './ui/PlanningView';
import defaultPlayerUnit from './units/jester';
import { MESSAGE_TYPES } from './MessageTypes';

// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IPlayerSerialized = Omit<IPlayer, "unit"> & { unit: { id: number } };
export interface CardUsage {
  [cardId: string]: number
}
export interface IPlayer {
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  inPortal: boolean;
  cards: string[];
  // The number of cards a player's hand is populated with at the start of a level
  cardsAmount: number;
  upgrades: Upgrade.IUpgrade[];
  // Note: call updateCardManaBadges() any time you modify cardUsageCounts so it will
  // be reflected in the UI
  cardUsageCounts: CardUsage;
}
export function create(clientId: string): IPlayer {
  const userSource = defaultPlayerUnit;
  const player: IPlayer = {
    clientId,
    // init players as not connected.  clientConnected status
    // should only be handled in one place and tied directly
    // to pie.clients
    clientConnected: false,
    unit: Unit.create(
      userSource.id,
      NaN,
      NaN,
      Faction.ALLY,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
      1
    ),
    inPortal: false,
    cards: [],
    cardUsageCounts: {},
    cardsAmount: config.START_CARDS_COUNT,
    upgrades: [],
  };
  // Player units get full mana every turn
  player.unit.manaPerTurn = player.unit.manaMax;
  player.inPortal = true;
  // Player units shouldn't be pushed around
  // during collisions while other units move
  player.unit.immovable = true;
  player.unit.alive = false;
  player.unit.attackRange = 500;
  player.unit.staminaMax = config.PLAYER_BASE_STAMINA;
  player.unit.stamina = config.PLAYER_BASE_STAMINA;

  updateGlobalRefToCurrentClientPlayer(player);
  // Add initial cards to hand
  CardUI.addCardToHand(allCards['hurt'], player);
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
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;

  window.underworld.players.push(player);
  return player;
}
export function resetPlayerForNextLevel(player: IPlayer) {
  // Player is no longer in portal
  player.inPortal = false;

  // Make unit visible
  Image.show(player.unit.image);
  if (!player.unit.alive) {
    Unit.resurrect(player.unit);
  }

  // Remove all modifiers between levels
  // This prevents players from scamming shields at the end of a level
  // on infinite mana
  Object.keys(player.unit.modifiers).forEach(modifier => {
    Unit.removeModifier(player.unit, modifier);
  });

  // Reset mana and health - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  player.unit.mana = player.unit.manaMax;
  player.unit.health = player.unit.healthMax;
  player.unit.stamina = player.unit.staminaMax;
  if (window.underworld.validPlayerSpawnCoords.length > 0) {
    const index = randInt(window.underworld.random, 0, window.underworld.validPlayerSpawnCoords.length - 1);
    console.log('Choose spawn', index, 'of', window.underworld.validPlayerSpawnCoords.length);
    const spawnCoords = window.underworld.validPlayerSpawnCoords[index];
    if (spawnCoords) {
      Unit.setLocation(player.unit, spawnCoords);
    } else {
      console.log('Level: cannot find valid spawn for player unit');
    }
  } else {
    console.log('Level: cannot find valid spawn for player unit');
  }
}
// Keep a global reference to the current client's player
export function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  if (window.clientId === player.clientId) {
    window.player = player;
  }
}
function addHighlighIfPlayerBelongsToCurrentClient(player: IPlayer) {
  if (player.clientId === window.clientId) {
    Image.addSubSprite(player.unit.image, 'ownCharacterMarker');
  } else {
    Image.removeSubSprite(player.unit.image, 'ownCharacterMarker');
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
export function load(player: IPlayerSerialized) {
  const reassignedUnit = window.underworld.units.find(u => u.id == player.unit.id);
  if (!reassignedUnit) {
    console.warn('Failed to load player because cannot find associated unit with ID', player.unit.id);
    console.log('Requesting SYNC_PLAYERS from host')
    window.pie.sendData({
      type: MESSAGE_TYPES.REQUEST_SYNC_PLAYERS
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
  const clients = getClients();
  setClientConnected(playerLoaded, clients.includes(player.clientId));
  addHighlighIfPlayerBelongsToCurrentClient(playerLoaded);
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  CardUI.recalcPositionForCards(playerLoaded);
  window.underworld.players.push(playerLoaded);
  return playerLoaded;
}

// Sets boolean and substring denoting if the player has a @websocketpie/client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean) {
  player.clientConnected = connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected');
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected');
    // If they disconnect, end their turn
    window.underworld.endPlayerTurn(player.clientId);
  }
}
export function enterPortal(player: IPlayer) {
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
  window.underworld.endPlayerTurn(player.clientId);
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive && player.clientConnected;
}
