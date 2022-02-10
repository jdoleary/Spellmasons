import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';
import * as Image from './Image';
import type * as Upgrade from './Upgrade';
import * as CardUI from './CardUI';
import * as config from './config';
import { Faction, UnitType } from './commonTypes';
import { allUnits } from './units';
import { getClients } from './wsPieHandler';
import { containerOverworld } from './PixiUtils';
import { currentOverworldLocation } from './overworld';
import * as readyState from './readyState';
import { allCards } from './cards';

// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IPlayerSerialized = Omit<IPlayer, "unit" | "overworldImage"> & { unit: Unit.IUnitSerialized } & { overworldImage: Image.IImageSerialized };
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
  overworldImage: Image.IImage;
}
export function create(clientId: string, unitId: string): IPlayer | undefined {
  const userSource = allUnits[unitId];
  if (!userSource) {
    console.error('User unit source file not registered, cannot create player');
    return undefined;
  }
  const player: IPlayer = {
    clientId,
    clientConnected: true,
    unit: Unit.create(
      userSource.id,
      NaN,
      NaN,
      Faction.PLAYER,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
    ),
    inPortal: false,
    cards: [],
    cardsAmount: config.START_CARDS_COUNT,
    upgrades: [],
    overworldImage: Image.create(
      0,
      0,
      userSource.info.image,
      containerOverworld,
    ),
  };
  player.inPortal = true;
  player.unit.alive = false;
  // Set position for player overworld image
  // offset between player images:
  const offset = window.underworld.players.length * 10;
  player.overworldImage.sprite.x = currentOverworldLocation.x + offset;
  player.overworldImage.sprite.y = currentOverworldLocation.y + offset;

  updateGlobalRefToCurrentClientPlayer(player);
  // Add initial cards to hand
  CardUI.addCardToHand(allCards['damage'], player);
  CardUI.addCardToHand(allCards['heal'], player);
  CardUI.addCardToHand(allCards['AOE'], player);
  CardUI.addCardToHand(allCards['chain'], player);
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;
  Unit.syncPlayerHealthManaUI();

  return player;
}
export function resetPlayerForNextLevel(player: IPlayer) {
  // Player is no longer in portal
  player.inPortal = false;

  // Reset action limitations
  player.unit.thisTurnMoved = false;

  // Make unit visible
  Image.show(player.unit.image);
  if (!player.unit.alive) {
    Unit.resurrect(player.unit);
  }

  // Reset mana - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  player.unit.mana = player.unit.manaMax;

  // Return to a spawn location
  // limit spawn to the leftmost column
  const coords = window.underworld.getRandomCoordsWithinBounds({ xMin: config.COLLISION_MESH_RADIUS, yMin: config.COLLISION_MESH_RADIUS, xMax: config.COLLISION_MESH_RADIUS, yMax: config.MAP_HEIGHT - config.COLLISION_MESH_RADIUS });
  Unit.setLocation(player.unit, coords);
}
// Keep a global reference to the current client's player
function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  if (window.clientId === player.clientId) {
    window.player = player;
    // When the player is first created or loaded, sync the health-mana UI
    Unit.syncPlayerHealthManaUI();
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
  const { unit, overworldImage, ...rest } = player;
  return {
    ...rest,
    unit: Unit.serialize(unit),
    overworldImage: Image.serialize(overworldImage)
  }
}
// load rehydrates a player entity from IPlayerSerialized
export function load(player: IPlayerSerialized) {
  const playerLoaded: IPlayer = {
    ...player,
    unit: Unit.load(player.unit),
    overworldImage: Image.load(player.overworldImage, containerOverworld),
  };
  const clients = getClients();
  setClientConnected(playerLoaded, clients.includes(player.clientId));
  addHighlighIfPlayerBelongsToCurrentClient(playerLoaded);
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  CardUI.recalcPositionForCards(playerLoaded);
  return playerLoaded;
}
// Similar but not the same as `load`, syncronize updates (mutates) a player 
// entity with properties from a player (in JSON)
// mutates originalUnit
export function syncronize(playerSerialized: IPlayerSerialized, originalPlayer: IPlayer): void {
  const { unit, overworldImage, ...rest } = playerSerialized;
  Object.assign(originalPlayer, rest);
  Unit.syncronize(unit, originalPlayer.unit);
  Image.syncronize(overworldImage, originalPlayer.overworldImage);
  addHighlighIfPlayerBelongsToCurrentClient(originalPlayer);
}
// Sets boolean and substring denoting if the player has a pie-client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean) {
  player.clientConnected = connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected');
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected');
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
  // Entering the portal ends the player's turn
  window.underworld.endPlayerTurn(player.clientId);
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive && player.clientConnected;
}
