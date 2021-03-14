import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';

export interface IPlayer {
  // wsPie id
  clientId: string;
  unit: Unit.IUnit;
  inPortal: boolean;
  // The number of actions used this turn
  actionsUsed: number;
}
export function create(clientId: string): IPlayer {
  const player = {
    clientId,
    unit: Unit.create(0, 0, 'images/units/man-blue.png', 'PlayerControlled'),
    inPortal: false,
    actionsUsed: 0,
  };
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  window.animationManager.startAnimate();
  return player;
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
  const self = {
    ...player,
    unit: Unit.load(player.unit),
  };
  addHighlighIfPlayerBelongsToCurrentClient(self);
  return self;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.moveTo(player.unit, 0, -1);
  window.animationManager.startAnimate();
  window.game.checkForEndOfLevel();
}
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive;
}
