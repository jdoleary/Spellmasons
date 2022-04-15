import * as PIXI from 'pixi.js';

import { allUnits } from '../units';
import { containerSpells, containerUI } from '../PixiUtils';
import { containerPlanningView } from '../PixiUtils';
import { Faction, UnitType } from '../commonTypes';
import { clone, equal, Vec2 } from '../Vec';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as config from '../config';
import type * as Unit from '../Unit';
import type * as Obstacle from '../Obstacle';
import type * as Pickup from '../Pickup';
import { targetBlue } from './colors';
import { calculateCost, CardCost } from '../cards/cardUtils';

let planningViewGraphics: PIXI.Graphics;
let dryRunGraphics: PIXI.Graphics;
export function initPlanningView() {
  planningViewGraphics = new PIXI.Graphics();
  containerPlanningView.addChild(planningViewGraphics);
  dryRunGraphics = new PIXI.Graphics();
  window.dryRunGraphics = dryRunGraphics;
  containerUI.addChild(dryRunGraphics);
}
let lastSpotCurrentPlayerTurnCircle: Vec2 = { x: 0, y: 0 };
export function updatePlanningView() {
  if (planningViewGraphics) {
    planningViewGraphics.clear();
    // Draw UI for the selectedUnit
    if (selectedUnit) {
      if (
        selectedUnit.alive
      ) {
        window.unitOverlayGraphics.lineStyle(8, 0x0fffff, 0.3);
        window.unitOverlayGraphics.drawCircle(
          selectedUnit.x,
          selectedUnit.y,
          selectedUnit.attackRange
        );
        window.unitOverlayGraphics.drawCircle(
          selectedUnit.x,
          selectedUnit.y,
          selectedUnit.moveDistance
        );
        window.unitOverlayGraphics.endFill();
      }
    }
    // Draw a circle under the feet of the player whos current turn it is
    if (window.underworld) {
      // Update tooltip for whatever is being hovered
      if (document.body.classList.contains('inspect-mode')) {
        const mousePos = window.underworld.getMousePos();
        updateTooltipSelection(mousePos);
      }
      updateTooltipContent();

      const currentTurnPlayer = window.underworld.players[window.underworld.playerTurnIndex];
      if (currentTurnPlayer) {
        // Only draw circle if player isn't moving to avoid UI thrashing
        if (equal(lastSpotCurrentPlayerTurnCircle, currentTurnPlayer.unit)) {
          if (window.player == currentTurnPlayer) {
            // Yellow if it's you
            planningViewGraphics.lineStyle(4, 0xffde5e);
            planningViewGraphics.beginFill(0xffde5e, 0.3);
          } else {
            // Grey if it's other player
            planningViewGraphics.lineStyle(4, 0xdddddd);
            planningViewGraphics.beginFill(0xdddddd, 0.3);
          }
          planningViewGraphics.drawEllipse(currentTurnPlayer.unit.x, currentTurnPlayer.unit.y + config.COLLISION_MESH_RADIUS / 2 + 3, config.COLLISION_MESH_RADIUS, config.COLLISION_MESH_RADIUS / 3);
        }
        lastSpotCurrentPlayerTurnCircle = clone(currentTurnPlayer.unit);
      }
    }
  }
}
export function updateManaCostUI(): CardCost {
  if (window.player) {
    // Update the UI that shows how much cards cost
    CardUI.updateCardBadges();
    // Updates the mana cost
    const cards = CardUI.getSelectedCards();
    const cost = calculateCost(cards, window.player)
    window.spellCost = cost;
    return cost;
  }
  window.spellCost = { manaCost: 0, healthCost: 0 };
  return window.spellCost;
}

export async function syncSpellEffectProjection() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  const mousePos = window.underworld.getMousePos();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  if (isOutOfBounds(mousePos)) {
    updateManaCostUI();
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {

    if (!CardUI.areAnyCardsSelected()) {
      // Do not render if there are no cards selected meaning there is no spell
      return;
    }
    const currentPlayer = window.underworld.players.find(
      (p) => p.clientId === window.clientId,
    );
    if (currentPlayer) {
      updateManaCostUI();
      // Dry run cast so the user can see what effect it's going to have
      const target = mousePos;
      const effectState = await window.underworld.castCards(
        currentPlayer,
        CardUI.getSelectedCardIds(),
        target,
        true,
      );
      for (let unitStats of effectState.aggregator.unitDamage) {
        // If a unit is currently alive and will take fatal damage,
        // draw red circle.
        if (unitStats.health > 0 && unitStats.damageTaken >= unitStats.health) {
          dryRunGraphics.lineStyle(4, 0xff0000, 1.0);
          dryRunGraphics.drawCircle(unitStats.x, unitStats.y, config.COLLISION_MESH_RADIUS);
        }
      }
    }
  }
}

// SpellEffectProjection are images to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection() {
  if (!window.animatingSpells) {
    dryRunGraphics.clear();
    containerSpells.removeChildren();
  }
}

export function drawDryRunLine(start: Vec2, end: Vec2) {
  dryRunGraphics.beginFill(0xffff0b, 0.5);
  dryRunGraphics.lineStyle(3, 0x33ff00);
  dryRunGraphics.moveTo(start.x, start.y);
  dryRunGraphics.lineTo(end.x, end.y);
  dryRunGraphics.endFill();
}
export function drawDryRunCircle(target: Vec2, radius: number) {
  dryRunGraphics.lineStyle(3, targetBlue, 0.5);
  dryRunGraphics.beginFill(0x000000, 0);
  dryRunGraphics.drawCircle(target.x, target.y, radius);
  dryRunGraphics.endFill();
}

export function isOutOfBounds(target: Vec2) {
  return (
    target.x < 0 || target.x >= window.underworld.width || target.y < 0 || target.y >= window.underworld.height
  );
}

const elInspectorTooltip = document.getElementById('inspector-tooltip');
const elInspectorTooltipContainer = document.getElementById(
  'inspector-tooltip-container',
);
const elInspectorTooltipContent = document.getElementById(
  'inspector-tooltip-content',
);

let selectedType: "unit" | "pickup" | "obstacle" | null = null;
let selectedUnit: Unit.IUnit | undefined;
let selectedObstacle: Obstacle.IObstacle | undefined;
let selectedPickup: Pickup.IPickup | undefined;
export function updateTooltipContent() {
  if (
    !(
      elInspectorTooltipContent &&
      elInspectorTooltip &&
      elInspectorTooltipContainer
    )
  ) {
    console.error("Tooltip elements failed to initialize")
    return;
  }
  // Update information in content
  // show info on unit, pickup, etc clicked
  let text = '';
  switch (selectedType) {
    case "unit":
      let cards = '';
      if (selectedUnit) {

        if (selectedUnit.unitType === UnitType.PLAYER_CONTROLLED) {
          const player = window.underworld.players.find((p) => p.unit === selectedUnit);
          if (player) {
            cards =
              'Cards: ' +
              player.cards.join(', ');
          } else {
            console.error('Tooltip: selectedUnit is player controlled but does not exist in underworld.players array.');
            selectedUnit = undefined;
            break;
          }
        }
        const unitSource = allUnits[selectedUnit.unitSourceId]
        text += `\
Unit
${unitSource.info.description}
Faction ${Faction[selectedUnit.faction]}
Health ${selectedUnit.health}/${selectedUnit.healthMax}
Mana ${selectedUnit.mana}/${selectedUnit.manaMax} + ${selectedUnit.manaPerTurn} per turn
Attack Damage ${selectedUnit.damage}
Modifiers ${JSON.stringify(selectedUnit.modifiers, null, 2)}
${unitSource.extraTooltipInfo ? unitSource.extraTooltipInfo() : ''}
${cards}
      `;
      }
      break;
    case "pickup":
      if (selectedPickup) {
        text += `\
${selectedPickup.name}
${selectedPickup.description}
      `;
      }
      break;
    case "obstacle":
      if (selectedObstacle) {
        text += `\
${selectedObstacle.name}
${selectedObstacle.description}
      `;

      }
      break;
  }

  elInspectorTooltipContent.innerText = text;
  if (text == '') {
    elInspectorTooltipContent.style.visibility = "hidden";
  } else {
    elInspectorTooltipContent.style.visibility = "visible";

  }
}
export function clearTooltipSelection() {
  selectedUnit = undefined;
  selectedPickup = undefined;
  selectedObstacle = undefined;
  selectedType = null;
}
export function updateTooltipSelection(mousePos: Vec2) {

  // Find unit:
  const unit = window.underworld.getUnitAt(mousePos);
  if (unit) {
    selectedUnit = unit;
    selectedType = "unit";
    return
  } else {
    selectedUnit = undefined;
  }
  const pickup = window.underworld.getPickupAt(mousePos);
  if (pickup) {
    selectedPickup = pickup;
    selectedType = "pickup";
    return
  } else {
    selectedPickup = undefined;
  }
  const obstacle = window.underworld.getObstacleAt(mousePos);
  if (obstacle) {
    selectedObstacle = obstacle;
    selectedType = "obstacle";
    return
  } else {
    selectedObstacle = undefined;
  }
  // If nothing was found to select, null-out selectedType
  // deselect
  selectedType = null;
}

// Draws a faint circle over things that can be clicked on
export function drawOnHoverCircle(mousePos: Vec2) {
  const unit = window.underworld.getUnitAt(mousePos);
  if (unit) {
    dryRunGraphics.lineStyle(3, targetBlue, 0.4);
    dryRunGraphics.beginFill(0x000000, 0);
    dryRunGraphics.drawCircle(unit.x, unit.y, config.COLLISION_MESH_RADIUS);
    dryRunGraphics.endFill();
  }
}