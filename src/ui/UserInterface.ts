import * as PIXI from 'pixi.js';
import * as Unit from '../Unit';
import setupBoardInputHandlers from './GameBoardInput';
import { containerDangerOverlay } from '../PixiUtils';
import * as config from '../config';
import * as math from '../math';
import { canAttackCell } from '../AI';

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
let planningViewActive = false;
function setPlanningView(active: boolean) {
  if (active == planningViewActive) {
    // Short-circuit if planningViewActive state wont change
    return;
  }
  planningViewActive = active;
  if (planningViewActive) {
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
  if (planningViewActive) {
    const halfCell = config.CELL_SIZE / 2;
    dangerOverlayGraphics.clear();
    dangerOverlayGraphics.beginFill(0xff0000);
    // Iterate all cells and paint ones that are able to be attacked by an AI
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      checkcell: for (let y = 0; y < config.BOARD_WIDTH; y++) {
        // for each unit...
        for (let unit of window.game.units) {
          if (unit.unitType === Unit.UnitType.AI) {
            if (canAttackCell(unit, x, y)) {
              const cell = math.cellToBoardCoords(x, y);
              dangerOverlayGraphics.drawRect(
                cell.x - halfCell,
                cell.y - halfCell,
                config.CELL_SIZE,
                config.CELL_SIZE,
              );
              // Once a cell is drawn as a dangerous cell, move on to the next cell,
              // so that a cell isn't drawn multiple times for units whose attack zone
              // overlay
              continue checkcell;
            }
          }
        }
      }
    }
    dangerOverlayGraphics.endFill();
  }
}
