import type * as PIXI from 'pixi.js';
import { PLAYER_HEART_HEALTH } from './config';
import { addPixiSprite } from './PixiUtils';
import * as UI from './ui/UserInterface';

export interface IPlayer {
  // wsPie id
  clientId: string;
  heart_health: number;
  heart_x: number;
  heart_y: number;
  sprite: PIXI.Sprite;
}
export function create(clientId: string, heart_y: number): IPlayer {
  const heart_x = 3.5;
  const sprite = addPixiSprite('images/units/man-blue.png');
  const player = {
    clientId,
    heart_health: PLAYER_HEART_HEALTH,
    heart_x,
    heart_y,
    sprite,
  };
  UI.setHealth(player);
  return player;
}
