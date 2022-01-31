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

export interface IPlayer {
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  inPortal: boolean;
  cards: string[];
  cardsSelected: string[];
  // The number of cards a player's hand is populated with at the start of a level
  cardsAmount: number;
  upgrades: Upgrade.IUpgrade[];
  overworldImage: Image.IImage;
}
export function create(clientId: string, unitId: string): IPlayer | undefined {
  // limit spawn to the leftmost column
  const coords = window.underworld.getRandomCoordsWithinBounds({ xMax: 0 });
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
      coords.x,
      coords.y,
      Faction.PLAYER,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
    ),
    inPortal: false,
    cards: [],
    cardsSelected: [],
    cardsAmount: config.START_CARDS_COUNT,
    upgrades: [],
    overworldImage: Image.create(
      0,
      0,
      userSource.info.image,
      containerOverworld,
    ),
  };
  // Set position for player overworld image
  // offset between player images:
  const offset = window.underworld.players.length * 10;
  player.overworldImage.sprite.x = currentOverworldLocation.x + offset;
  player.overworldImage.sprite.y = currentOverworldLocation.y + offset;

  updateGlobalRefToCurrentClientPlayer(player);
  // Add initial cards to hand
  CardUI.addCardToHand(allCards[0], player);
  CardUI.addCardToHand(allCards[1], player);
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

  // Return to a spawn location
  // limit spawn to the leftmost column
  const coords = window.underworld.getRandomCoordsWithinBounds({ xMax: 10 });
  Unit.setLocation(player.unit, coords);
}
// Keep a global reference to the current client's player
function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  readyState.set('player', true);
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
export function load(player: IPlayer) {
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
// Sets boolean and substring denoting if the player has a pie-client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean) {
  player.clientConnected = connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected');
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected');
  }
}
// Remove all of the player's cards
function removeAllCards(player: IPlayer) {
  player.cards = [];
  player.cardsSelected = [];
  CardUI.recalcPositionForCards(player);
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  Image.hide(player.unit.image);
  removeAllCards(player);
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.setLocation(player.unit, { x: NaN, y: NaN });
  // Entering the portal ends the player's turn
  window.underworld.endPlayerTurn(player.clientId);
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive && player.clientConnected;
}
