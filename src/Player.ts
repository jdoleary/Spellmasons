import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';
import * as Card from './Card';
import * as config from './config';

export interface IPlayer {
  // wsPie id
  clientId: string;
  unit: Unit.IUnit;
  inPortal: boolean;
  // The number of actions used this turn
  actionsUsed: number;
  // The players "hand" which contains cards
  hand: Card.CardTally;
}
export function create(clientId: string): IPlayer {
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  const player = {
    clientId,
    unit: Unit.create(
      coords.x,
      coords.y,
      'images/units/man-blue.png',
      Unit.UnitType.PLAYER_CONTROLLED,
    ),
    inPortal: false,
    actionsUsed: 0,
    hand: {},
  };
  updateGlobalRefToCurrentClientPlayer(player);
  // Add cards to hand
  for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
    const card = Card.generateCard();
    Card.addCardToHand(card, player);
  }
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;
  window.animationManager.startAnimate();
  return player;
}
// Keep a global reference to the current client's player
function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  if (window.clientId === player.clientId) {
    window.player = player;
  }
}
function addHighlighIfPlayerBelongsToCurrentClient(player: IPlayer) {
  if (player.clientId === window.clientId) {
    player.unit.image.addSubSprite(
      'images/units/unit-underline.png',
      'ownCharacterMarker',
    );
  }
}
export function load(player: IPlayer) {
  const playerLoaded = {
    ...player,
    unit: Unit.load(player.unit),
  };
  addHighlighIfPlayerBelongsToCurrentClient(playerLoaded);
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  Card.recalcPositionForCards(playerLoaded);
  return playerLoaded;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.moveTo(player.unit, -1, coords.y);
  window.animationManager.startAnimate();
  window.game.checkForEndOfLevel();
}
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive;
}
