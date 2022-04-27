import * as PIXI from 'pixi.js';

import { allUnits } from '../units';
import { containerSpells, containerUI } from '../PixiUtils';
import { containerPlanningView } from '../PixiUtils';
import { Faction, UnitSubType, UnitType } from '../commonTypes';
import { clone, equal, Vec2 } from '../Vec';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as config from '../config';
import * as Unit from '../Unit';
import type * as Pickup from '../Pickup';
import { targetBlue } from './colors';
import { calculateCost, CardCost } from '../cards/cardUtils';
import { closestLineSegmentIntersection } from '../collision/collisionMath';
import * as colors from './colors';
import { getBestRangedLOSTarget } from '../units/actions/rangedAction';

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
    if (selectedPickup) {
      // Draw circle to show that pickup is selected
      drawCircleUnderTarget(selectedPickup, 1.0, planningViewGraphics);
    }
    // Draw UI for the selectedUnit
    if (selectedUnit) {
      if (
        selectedUnit.alive
      ) {
        // Draw circle to show that unit is selected
        drawCircleUnderTarget(selectedUnit, 1.0, planningViewGraphics);
        // If selectedUnit is an archer, draw LOS attack line
        //  instead of attack range for them
        if (selectedUnit.unitSubType == UnitSubType.RANGED_LOS) {
          let archerTarget = getBestRangedLOSTarget(selectedUnit)
          // If they don't have a target they can actually attack
          // draw a line to the closest enemy that they would target if
          // they had LOS
          if (!archerTarget) {
            archerTarget = Unit.findClosestUnitInDifferentFaction(selectedUnit);
          }
          if (archerTarget) {
            const attackLine = { p1: selectedUnit, p2: archerTarget };
            const closestIntersection = closestLineSegmentIntersection(attackLine, window.underworld.walls);

            planningViewGraphics.moveTo(attackLine.p1.x, attackLine.p1.y);
            if (closestIntersection) {
              // Draw a grey line  showing that the target is blocked
              planningViewGraphics.lineStyle(3, 0x333333, 0.7);
              planningViewGraphics.lineTo(closestIntersection.x, closestIntersection.y);
              planningViewGraphics.lineTo(attackLine.p2.x, attackLine.p2.y);
              planningViewGraphics.drawCircle(attackLine.p2.x, attackLine.p2.y, 3);
            } else {
              // Draw a red line, showing that you are in danger
              planningViewGraphics.lineStyle(3, 0xff0000, 0.7);
              planningViewGraphics.lineTo(attackLine.p2.x, attackLine.p2.y);
              planningViewGraphics.drawCircle(attackLine.p2.x, attackLine.p2.y, 3);
            }
          }
        } else {

          const rangeCircleColor = selectedUnit.faction == Faction.ALLY ? 0x40a058 : 0xd55656;
          window.unitOverlayGraphics.lineStyle(8, rangeCircleColor, 0.3);
          if (selectedUnit.unitSubType === UnitSubType.RANGED_RADIUS) {
            window.unitOverlayGraphics.drawCircle(
              selectedUnit.x,
              selectedUnit.y,
              selectedUnit.attackRange
            );
          } else if (selectedUnit.unitSubType === UnitSubType.MELEE) {
            window.unitOverlayGraphics.drawCircle(
              selectedUnit.x,
              selectedUnit.y,
              selectedUnit.stamina + selectedUnit.attackRange
            );
          }
          window.unitOverlayGraphics.endFill();
        }
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

      if (window.player) {
        // Only draw circle if player isn't moving to avoid UI thrashing
        if (equal(lastSpotCurrentPlayerTurnCircle, window.player.unit)) {
          if (window.underworld.isMyTurn()) {
            // Yellow if it's you
            planningViewGraphics.lineStyle(4, 0xffde5e);
            planningViewGraphics.beginFill(0xffde5e, 0.3);
          } else {
            // Grey if it's other player's turn
            planningViewGraphics.lineStyle(4, 0xdddddd);
            planningViewGraphics.beginFill(0xdddddd, 0.3);
          }
          planningViewGraphics.drawEllipse(window.player.unit.x, window.player.unit.y + config.COLLISION_MESH_RADIUS / 2 + 3, config.COLLISION_MESH_RADIUS, config.COLLISION_MESH_RADIUS / 3);
        }
        lastSpotCurrentPlayerTurnCircle = clone(window.player.unit);
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
    const cost = calculateCost(cards, window.player.cardUsageCounts)
    return cost;
  }
  return { manaCost: 0, healthCost: 0 };
}

export async function syncSpellEffectProjection() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  if (!window.underworld) {
    return;
  }
  const mousePos = window.underworld.getMousePos();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  // only show hover target when it's the correct turn phase
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {

    if (window.player) {
      window.underworld.syncDryRunUnits();
      updateManaCostUI();
      // Dry run cast so the user can see what effect it's going to have
      const target = mousePos;
      const casterUnit = window.dryRunUnits.find(u => u.id == window.player?.unit.id)
      if (!casterUnit) {
        console.error('Critical Error, caster unit not found');
        return;
      }
      const cardIds = CardUI.getSelectedCardIds();
      if (cardIds.length) {
        const effectState = await window.underworld.castCards(
          // Make a copy of cardUsageCounts for dryrun so it can accurately
          // calculate mana for multiple copies of one spell in one cast
          JSON.parse(JSON.stringify(window.player.cardUsageCounts)),
          casterUnit,
          cardIds,
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
const elInspectorTooltipImage: HTMLImageElement = (document.getElementById(
  'inspector-tooltip-image',
) as HTMLImageElement);

let selectedType: "unit" | "pickup" | "obstacle" | null = null;
let selectedUnit: Unit.IUnit | undefined;
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
  elInspectorTooltipImage.src = '';
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
        if (unitSource) {
          text += `\
${unitSource.id}
${unitSource.info.description}
Faction ${Faction[selectedUnit.faction]}
Health ${selectedUnit.health}/${selectedUnit.healthMax}
Mana ${selectedUnit.mana}/${selectedUnit.manaMax} + ${selectedUnit.manaPerTurn} per turn
Attack Damage ${selectedUnit.damage}
Modifiers ${JSON.stringify(selectedUnit.modifiers, null, 2)}
${unitSource.extraTooltipInfo ? unitSource.extraTooltipInfo() : ''}
${cards}
      `;

          const imagePath = Unit.getImagePathForUnitId(unitSource.id);
          if (elInspectorTooltipImage.src !== imagePath) {

            elInspectorTooltipImage.src = imagePath;
          }
        }
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
      break;
  }

  elInspectorTooltipContent.innerText = text;
  if (text == '') {
    elInspectorTooltipContainer.style.visibility = "hidden";
  } else {
    elInspectorTooltipContainer.style.visibility = "visible";

  }
}
export function checkIfNeedToClearTooltip() {
  if (selectedUnit && !selectedUnit.alive) {
    clearTooltipSelection();
  }
  // Quick hack to check if the pickup has been picked up
  // If so, deselect it
  if (selectedPickup && selectedPickup.image.sprite.parent === null) {
    clearTooltipSelection();
  }

}
export function clearTooltipSelection() {
  selectedUnit = undefined;
  selectedPickup = undefined;
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
  // If nothing was found to select, null-out selectedType
  // deselect
  selectedType = null;
}

// Draws a faint circle over things that can be clicked on
export function drawCircleUnderTarget(mousePos: Vec2, opacity: number, graphics: PIXI.Graphics) {
  const target: Vec2 | undefined = window.underworld.getUnitAt(mousePos) || window.underworld.getPickupAt(mousePos);
  if (target) {
    graphics.lineStyle(3, 0xFFFFFF, opacity);
    graphics.beginFill(0x000000, 0);
    graphics.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
    graphics.endFill();
  }
}