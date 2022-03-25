import * as PIXI from 'pixi.js';

import { allUnits } from '../units';
import { containerSpells, containerUI } from '../PixiUtils';
import { containerPlanningView } from '../PixiUtils';
import { Faction, UnitSubType, UnitType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as config from '../config';
import * as Unit from '../Unit';
import type * as Obstacle from '../Obstacle';
import type * as Pickup from '../Pickup';
import * as Image from '../Image';
import * as math from '../math';
import { targetBlue } from './colors';
import { calculateManaCost } from '../cards/cardUtils';
import unit from '../units/manBlue';

let planningViewGraphics: PIXI.Graphics;
let dryRunGraphics: PIXI.Graphics;
export function initPlanningView() {
  planningViewGraphics = new PIXI.Graphics();
  containerPlanningView.addChild(planningViewGraphics);
  dryRunGraphics = new PIXI.Graphics();
  containerUI.addChild(dryRunGraphics);
}
export function updatePlanningView() {
  if (planningViewGraphics) {
    planningViewGraphics.clear();
    // Draw UI for the selectedUnit
    if (selectedUnit) {
      if (
        selectedUnit.alive
      ) {
        planningViewGraphics.lineStyle(8, 0xffffff, 0.9);
        // Only draw attack range for non player units
        if (selectedUnit.unitType != UnitType.PLAYER_CONTROLLED) {
          planningViewGraphics.drawCircle(
            selectedUnit.x,
            selectedUnit.y,
            selectedUnit.attackRange
          );
        }
        planningViewGraphics.drawCircle(
          selectedUnit.x,
          selectedUnit.y,
          selectedUnit.moveDistance
        );
        planningViewGraphics.endFill();
      }
    }
    planningViewGraphics.endFill();
  }
  updateTooltipContent();
}
export function updateManaCostUI(): number {
  if (window.player) {
    // Update the UI that shows how much cards cost
    CardUI.updateCardManaBadges();
    // Updates the mana cost
    const cards = CardUI.getSelectedCards();
    const mousePos = window.underworld.getMousePos();
    const castDistance = isOutOfBounds(mousePos) ? 0 : math.distance(mousePos, window.player.unit)
    const manaCost = calculateManaCost(cards, castDistance, window.player)
    _updateManaCostUI(manaCost);
    return manaCost;
  }
  return 0;
}
function _updateManaCostUI(manaCost: number) {
  if (window.player) {

    if (manaCost <= window.player.unit.mana) {
      updateTooltipSpellCost(manaCost.toString())
    } else {
      updateTooltipSpellCost(`${manaCost} - Insufficient mana`)
    }
  }

}

export async function syncSpellEffectProjection() {
  clearTooltipSpellCost();
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
      const manaCost = updateManaCostUI();
      if (manaCost > currentPlayer.unit.mana) {
        // Draw deny icon to show the player they are out of range
        Image.create(mousePos.x, mousePos.y, 'deny.png', containerSpells);
      } else {
        // Dry run cast so the user can see what effect it's going to have
        const target = mousePos;
        await window.underworld.castCards(
          currentPlayer,
          CardUI.getSelectedCardIds(),
          target,
          true,
        );
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

export function drawSwapLine(one: Vec2, two: Vec2) {
  if (one && two) {
    dryRunGraphics.beginFill(0xffff0b, 0.5);
    dryRunGraphics.lineStyle(3, 0x33ff00);
    dryRunGraphics.moveTo(one.x, one.y);
    dryRunGraphics.lineTo(two.x, two.y);
    dryRunGraphics.drawCircle(two.x, two.y, 10);
    dryRunGraphics.endFill();
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
    target.x < 0 || target.x >= config.MAP_WIDTH || target.y < 0 || target.y >= config.MAP_HEIGHT
  );
}

const elInspectorTooltip = document.getElementById('inspector-tooltip');
const elInspectorTooltipContainer = document.getElementById(
  'inspector-tooltip-container',
);
const elInspectorTooltipContent = document.getElementById(
  'inspector-tooltip-content',
);
const elSpellManaCost = document.getElementById(
  'spell-mana-cost',
);
export function clearTooltipSpellCost() {
  if (elSpellManaCost) {
    elSpellManaCost.innerHTML = '';
  }

}
export function updateTooltipSpellCost(manaCost: string) {
  if (elSpellManaCost && parseInt(manaCost) !== 0) {
    elSpellManaCost.innerHTML = `${manaCost}`
  }
}

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
            console.error(
              'Could not find player corresponding to player controlled unit',
            );
          }
        }
        text += `\
Unit
${allUnits[selectedUnit.unitSourceId].info.description}
Type ${UnitType[selectedUnit.unitType]}
SubType ${UnitSubType[selectedUnit.unitSubType]}
Faction ${Faction[selectedUnit.faction]}
Health ${selectedUnit.health}/${selectedUnit.healthMax}
Mana ${selectedUnit.mana}/${selectedUnit.manaMax} + ${selectedUnit.manaPerTurn} per turn
Modifiers ${JSON.stringify(selectedUnit.modifiers, null, 2)}
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
