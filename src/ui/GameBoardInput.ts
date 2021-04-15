import * as PIXI from 'pixi.js';
import * as Image from '../Image';
import { MESSAGE_TYPES } from '../MessageTypes';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import { turn_phase } from '../Game';
import * as Card from '../CardUI';
import * as Player from '../Player';
import floatingText from '../FloatingText';
import * as Unit from '../Unit';
import { app, containerSpells, containerUI } from '../PixiUtils';
import { Coords, Faction, UnitSubType, UnitType } from '../commonTypes';

let mouseCellX: number;
let mouseCellY: number;
const elInspectorTooltip = document.getElementById('inspector-tooltip');
const elInspectorTooltipContent = document.getElementById(
  'inspector-tooltip-content',
);
// SpellEffectProjection are images that appear above cells to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection() {
  if (!window.animatingSpells) {
    dryRunGraphics.clear();
    containerSpells.removeChildren();
  }
}
function isOutOfBounds(x: number, y: number) {
  return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
}
function areAnyCardsSelected() {
  return !!Card.getSelectedCards().length;
}
const dryRunGraphics = new PIXI.Graphics();
containerUI.addChild(dryRunGraphics);

export function drawSwapLine(one: Coords, two: Coords) {
  if (one && two) {
    const x1 = one.x * CELL_SIZE + CELL_SIZE / 2;
    const y1 = one.y * CELL_SIZE + CELL_SIZE / 2;
    const x2 = two.x * CELL_SIZE + CELL_SIZE / 2;
    const y2 = two.y * CELL_SIZE + CELL_SIZE / 2;
    dryRunGraphics.beginFill(0xffff0b, 0.5);
    dryRunGraphics.lineStyle(3, 0x33ff00);
    dryRunGraphics.moveTo(x1, y1);
    dryRunGraphics.lineTo(x2, y2);
    dryRunGraphics.drawCircle(x2, y2, 10);
    dryRunGraphics.endFill();
  }
}

// Draws the image that shows on the cell under the mouse
export async function syncSpellEffectProjection() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  if (isOutOfBounds(mouseCellX, mouseCellY)) {
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.game.turn_phase == turn_phase.PlayerTurns) {
    // If mouse hovering over a new cell, update the target images

    if (!areAnyCardsSelected()) {
      // Do not render if there are no cards selected meaning there is no spell
      return;
    }
    const currentPlayer = window.game.players.find(
      (p) => p.clientId === window.clientId,
    );
    if (currentPlayer) {
      const mouseTarget = { x: mouseCellX, y: mouseCellY };
      if (!Player.isTargetInRange(currentPlayer, mouseTarget)) {
        // Draw deny icon to show the player they are out of range
        Image.create(
          mouseTarget.x,
          mouseTarget.y,
          'images/spell/deny.png',
          containerSpells,
        );
      } else {
        // Dry run cast so the user can see what effect it's going to have
        await window.game.castCards(
          currentPlayer,
          Card.getSelectedCards(),
          mouseTarget,
          true,
        );
      }
    }
  }
}
function setHoverTooltipPosition(x: number, y: number) {
  if (!(elInspectorTooltipContent && elInspectorTooltip)) {
    return;
  }
  const pixiCoords = app.renderer.plugins.interaction.mouse.global;
  // Update position of HTML element
  elInspectorTooltip.style.transform = `translate(${pixiCoords.x}px, ${pixiCoords.y}px)`;

  // Update information in content
  // show info on cell, unit, pickup, etc clicked
  let text = '';
  // Find unit:
  const unit = window.game.getUnitAt(x, y);
  if (unit) {
    text += `\
Unit
Type ${UnitType[unit.unitType]}
SubType ${UnitSubType[unit.unitSubType]}
Faction ${Faction[unit.faction]}
Health ${unit.health}/${unit.healthMax}
Modifiers ${JSON.stringify(unit.modifiers, null, 2)}
        `;
  }
  const pickup = window.game.getPickupAt(x, y);
  if (pickup) {
    text += `\
Pickup
${pickup.name}
${pickup.description}
        `;
  }
  const obstacle = window.game.getObstacleAt(x, y);
  if (obstacle) {
    text += `\
${obstacle.name}
${obstacle.description}
        `;
  }
  elInspectorTooltipContent.innerText = text;
}
export default function setupBoardInputHandlers() {
  // on Hover
  document.body.addEventListener('mousemove', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    setHoverTooltipPosition(x, y);
    const didChange = mouseCellX !== x || mouseCellY !== y;
    mouseCellX = x;
    mouseCellY = y;
    // If mouse hovering over a new cell, update the target images
    if (didChange) {
      // Show target hover on cells
      syncSpellEffectProjection();
    }
  });
  // Handle right click on game board
  document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // Disallow click out of bounds
      return;
    }
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      if (window.game.yourTurn) {
        // Get current client's player
        const selfPlayer: Player.IPlayer | undefined = window.game.players.find(
          (p) => p.clientId === window.clientId,
        );
        // If player hasn't already moved this turn...
        if (selfPlayer && !selfPlayer.unit.thisTurnMoved) {
          const targetCell = Unit.findCellOneStepCloserTo(
            selfPlayer.unit,
            x,
            y,
          );
          if (
            targetCell &&
            window.game.canUnitMoveIntoCell(targetCell.x, targetCell.y)
          ) {
            window.pie.sendData({
              type: MESSAGE_TYPES.MOVE_PLAYER,
              // This formula clamps the diff to -1, 0 or 1
              ...targetCell,
            });
          } else {
            floatingText({
              cellX: x,
              cellY: y,
              text: 'You cannot move here',
              style: {
                fill: 'red',
              },
            });
          }
        } else {
          floatingText({
            cellX: x,
            cellY: y,
            text: 'You cannot move more than once per turn.',
          });
        }
      }
    }
    return false;
  });
  // Handle clicks on the game board
  document.body.addEventListener('click', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // Disallow click out of bounds
      return;
    }
    if (window.planningViewActive) {
      window.pie.sendData({
        type: MESSAGE_TYPES.PING,
        x,
        y,
      });
      return;
    }
    // If a spell exists (based on the combination of cards selected)...
    if (areAnyCardsSelected()) {
      // Only allow casting in the proper phase
      if (window.game.turn_phase == turn_phase.PlayerTurns) {
        if (window.game.yourTurn) {
          // Get current client's player
          const selfPlayer:
            | Player.IPlayer
            | undefined = window.game.players.find(
            (p) => p.clientId === window.clientId,
          );
          // If the player casting is the current client player
          if (selfPlayer) {
            // If the spell is not in range
            if (!Player.isTargetInRange(selfPlayer, { x, y })) {
              // Show floating message to alert player
              floatingText({ cellX: x, cellY: y, text: 'out of range' });
            } else {
              // cast the spell
              window.pie.sendData({
                type: MESSAGE_TYPES.SPELL,
                x,
                y,
                cards: Card.getSelectedCards(),
              });
              Card.clearSelectedCards();
            }
          }
        } else {
          floatingText({ cellX: x, cellY: y, text: 'It is not your turn yet' });
        }
      }
    }
  });
}
