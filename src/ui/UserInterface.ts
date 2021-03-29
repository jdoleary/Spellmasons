import * as PIXI from 'pixi.js';
import * as Unit from '../Unit';
import setupBoardInputHandlers from './GameBoardInput';
import { containerDangerOverlay } from '../PixiUtils';
import * as config from '../config';
import * as math from '../math';
import { canAttackCell } from '../AI';
import { clearSelectedCards } from '../CardUI';

const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;

export function setup() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        window.game.endMyTurn();
        break;
      case 'KeyZ':
        setPlanningView(true);
        break;
      case 'Escape':
        clearSelectedCards();
        break;
    }
  });
  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyZ':
        setPlanningView(false);
        break;
    }
  });

  elEndTurnBtn.addEventListener('click', () => {
    window.game.endMyTurn();
  });
  setupBoardInputHandlers();
}
window.planningViewActive = false;
function setPlanningView(active: boolean) {
  if (active == window.planningViewActive) {
    // Short-circuit if planningViewActive state wont change
    return;
  }
  window.planningViewActive = active;
  if (window.planningViewActive) {
    drawDangerOverlay();
    window.game.units.forEach((u) => {
      // "Select" living units, this shows their overlay for planning purposes
      if (u.alive) {
        Unit.select(u);
      }
    });
  } else {
    dangerOverlayGraphics.clear();
    window.game.units.forEach((u) => Unit.deselect(u));
  }
}

const dangerOverlayGraphics = new PIXI.Graphics();
containerDangerOverlay.addChild(dangerOverlayGraphics);
export function drawDangerOverlay() {
  if (window.planningViewActive) {
    const halfCell = config.CELL_SIZE / 2;
    dangerOverlayGraphics.clear();
    // Iterate all cells and paint ones that are able to be attacked by an AI
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        // for each unit...
        for (let unit of window.game.units) {
          if (unit.alive && unit.unitType === Unit.UnitType.AI) {
            if (canAttackCell(unit, x, y)) {
              const cell = math.cellToBoardCoords(x, y);
              const color = Unit.getDangerZoneColor(unit);
              // dangerOverlayGraphics.lineStyle(8, color, 0.9);
              dangerOverlayGraphics.beginFill(color);
              dangerOverlayGraphics.drawRect(
                cell.x - halfCell,
                cell.y - halfCell,
                config.CELL_SIZE,
                config.CELL_SIZE,
              );
              dangerOverlayGraphics.endFill();
            }
          }
        }
      }
    }
  }
}
