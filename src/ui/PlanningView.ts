import * as PIXI from 'pixi.js';

import { allUnits } from '../units';
import { app, containerSpells, containerUI } from '../PixiUtils';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import { containerPlanningView } from '../PixiUtils';
import { Coords, Faction, UnitSubType, UnitType } from '../commonTypes';
import { getCurrentMouseCellOnGrid } from './eventListeners';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as config from '../config';
import * as Image from '../Image';
import * as math from '../math';
import * as Player from '../Player';
import * as Unit from '../Unit';

window.planningViewActive = false;
let planningViewGraphics: PIXI.Graphics;
let dryRunGraphics: PIXI.Graphics;
export function setPlanningView(active: boolean) {
  if (active == window.planningViewActive) {
    // Short-circuit if planningViewActive state wont change
    return;
  }
  window.planningViewActive = active;
  if (window.planningViewActive) {
    updatePlanningView();
    window.underworld.units.forEach((u) => {
      // "Select" living units, this shows their overlay for planning purposes
      if (u.alive) {
        Unit.select(u);
      }
    });
  } else {
    planningViewGraphics.clear();
    window.underworld.units.forEach((u) => Unit.deselect(u));
  }
}
export function initPlanningView() {
  planningViewGraphics = new PIXI.Graphics();
  containerPlanningView.addChild(planningViewGraphics);
  dryRunGraphics = new PIXI.Graphics();
  containerUI.addChild(dryRunGraphics);
}
export function updatePlanningView() {
  if (window.planningViewActive) {
    const halfCell = config.CELL_SIZE / 2;
    planningViewGraphics.clear();
    // Iterate all cells and paint ones that are able to be attacked by an AI
    for (let x = 0; x < config.BOARD_WIDTH; x++) {
      for (let y = 0; y < config.BOARD_HEIGHT; y++) {
        // for each unit...
        for (let unit of window.underworld.units) {
          if (
            unit.alive &&
            unit.unitType === UnitType.AI &&
            unit.faction === Faction.ENEMY
          ) {
            if (allUnits[unit.unitSourceId].canInteractWithCell?.(unit, x, y)) {
              const cell = math.cellToBoardCoords(x, y);
              const color = Unit.getPlanningViewColor(unit);
              // planningViewGraphics.lineStyle(8, color, 0.9);
              planningViewGraphics.beginFill(color);
              planningViewGraphics.drawRect(
                cell.x - halfCell,
                cell.y - halfCell,
                config.CELL_SIZE,
                config.CELL_SIZE,
              );
              planningViewGraphics.endFill();
            }
          }
        }
        // For the player, draw their range
        if (Player.isTargetInRange(window.player, { x, y })) {
          const cell = math.cellToBoardCoords(x, y);
          const color = Unit.getPlanningViewColor(window.player.unit);
          planningViewGraphics.beginFill(color);
          planningViewGraphics.drawRect(
            cell.x - halfCell,
            cell.y - halfCell,
            config.CELL_SIZE,
            config.CELL_SIZE,
          );
          planningViewGraphics.endFill();
        }
      }
    }
  }
}

// Draws the image that shows on the cell under the mouse
export async function syncSpellEffectProjection() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  const mouseCell = getCurrentMouseCellOnGrid();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  if (isOutOfBounds(mouseCell)) {
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {
    // If mouse hovering over a new cell, update the target images

    if (!CardUI.areAnyCardsSelected()) {
      // Do not render if there are no cards selected meaning there is no spell
      return;
    }
    const currentPlayer = window.underworld.players.find(
      (p) => p.clientId === window.clientId,
    );
    if (currentPlayer) {
      if (!Player.isTargetInRange(currentPlayer, mouseCell)) {
        // Draw deny icon to show the player they are out of range
        Image.create(mouseCell.x, mouseCell.y, 'deny.png', containerSpells);
      } else {
        // Dry run cast so the user can see what effect it's going to have
        await window.underworld.castCards(
          currentPlayer,
          CardUI.getSelectedCards(),
          mouseCell,
          true,
        );
      }
    }
  }
}

// SpellEffectProjection are images that appear above cells to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection() {
  if (!window.animatingSpells) {
    dryRunGraphics.clear();
    containerSpells.removeChildren();
  }
}

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

export function isOutOfBounds(cell: Coords) {
  return (
    cell.x < 0 || cell.x >= BOARD_WIDTH || cell.y < 0 || cell.y >= BOARD_HEIGHT
  );
}

const elInspectorTooltip = document.getElementById('inspector-tooltip');
const elInspectorTooltipContainer = document.getElementById(
  'inspector-tooltip-container',
);
const elInspectorTooltipContent = document.getElementById(
  'inspector-tooltip-content',
);
export function updateTooltip() {
  if (
    !(
      elInspectorTooltipContent &&
      elInspectorTooltip &&
      elInspectorTooltipContainer
    )
  ) {
    return;
  }
  const mouseCell = getCurrentMouseCellOnGrid();
  // Update position of HTML element
  elInspectorTooltip.style.transform = `translate(${
    app.stage.x + mouseCell.x * CELL_SIZE
  }px, ${app.stage.y + mouseCell.y * CELL_SIZE}px)`;
  elInspectorTooltipContainer.classList.remove('top');
  elInspectorTooltipContainer.classList.remove('bottom');
  elInspectorTooltipContainer.classList.remove('left');
  elInspectorTooltipContainer.classList.remove('right');
  elInspectorTooltipContainer.classList.add(
    mouseCell.y > BOARD_HEIGHT / 2 ? 'bottom' : 'top',
  );
  elInspectorTooltipContainer.classList.add(
    mouseCell.x > BOARD_WIDTH / 2 ? 'right' : 'left',
  );

  // Update information in content
  // show info on cell, unit, pickup, etc clicked
  let text = '';
  // Find unit:
  const unit = window.underworld.getUnitAt(mouseCell);
  if (unit) {
    let cards = '';
    if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
      const player = window.underworld.players.find((p) => p.unit === unit);
      if (player) {
        cards =
          'Cards: \n' +
          Object.entries(
            [...player.cards, ...player.cardsSelected].reduce<{
              [card: string]: number;
            }>((acc, card) => {
              if (!acc[card]) {
                acc[card] = 0;
              }
              acc[card]++;
              return acc;
            }, {}),
          )
            .map(([card, amount]) => `${amount} ${card}`)
            .join('\n');
      } else {
        console.error(
          'Could not find player corresponding to player controlled unit',
        );
      }
    }
    text += `\
Unit
${allUnits[unit.unitSourceId].info.description}
Type ${UnitType[unit.unitType]}
SubType ${UnitSubType[unit.unitSubType]}
Faction ${Faction[unit.faction]}
Health ${unit.health}/${unit.healthMax}
Modifiers ${JSON.stringify(unit.modifiers, null, 2)}
${cards}
        `;
  }
  const pickup = window.underworld.getPickupAt(mouseCell);
  if (pickup) {
    text += `\
Pickup
${pickup.name}
${pickup.description}
        `;
  }
  const obstacle = window.underworld.getObstacleAt(mouseCell);
  if (obstacle) {
    text += `\
${obstacle.name}
${obstacle.description}
        `;
  }
  // Only show tooltip if it has contents
  if (!text) {
    elInspectorTooltip.style.visibility = 'hidden';
  } else {
    elInspectorTooltip.style.visibility = 'visible';
  }
  elInspectorTooltipContent.innerText = text;
}
