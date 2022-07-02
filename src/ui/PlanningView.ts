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
import { calculateCost, CardCost } from '../cards/cardUtils';
import { closestLineSegmentIntersection } from '../collision/lineSegment';
import { getBestRangedLOSTarget } from '../units/actions/rangedAction';
import * as math from '../math';
import * as colors from './colors';
import { getCastTarget } from '../PlayerUtils';

let planningViewGraphics: PIXI.Graphics;
let predictionGraphics: PIXI.Graphics;
export function initPlanningView() {
  planningViewGraphics = new PIXI.Graphics();
  window.planningViewGraphics = planningViewGraphics;
  containerPlanningView.addChild(planningViewGraphics);
  predictionGraphics = new PIXI.Graphics();
  window.predictionGraphics = predictionGraphics;
  containerUI.addChild(predictionGraphics);
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
              planningViewGraphics.lineStyle(3, 0xaaaaaa, 0.7);
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
              selectedUnit.staminaMax + selectedUnit.attackRange
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
          // offset ensures the circle is under the player's feet
          // and is dependent on the animation's feet location
          const arbitratyOffset = 3;
          planningViewGraphics.drawEllipse(window.player.unit.x + arbitratyOffset, window.player.unit.y + config.COLLISION_MESH_RADIUS - arbitratyOffset, config.COLLISION_MESH_RADIUS / 2, config.COLLISION_MESH_RADIUS / 3);
          planningViewGraphics.endFill();
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

// predicts what will happen next turn
// via enemy attention markers (showing if they will hurt you)
// your health and mana bar (the stripes)
// and enemy health and mana bars
export async function runPredictions() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  if (!window.underworld) {
    return;
  }
  const startTime = Date.now();
  const mousePos = window.underworld.getMousePos();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  // only show hover target when it's the correct turn phase
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {

    if (window.player) {
      window.underworld.syncPredictionUnits();
      updateManaCostUI();
      // Dry run cast so the user can see what effect it's going to have
      const target = mousePos;
      const casterUnit = window.predictionUnits.find(u => u.id == window.player?.unit.id)
      if (!casterUnit) {
        console.error('Critical Error, caster unit not found');
        return;
      }
      const cardIds = CardUI.getSelectedCardIds();
      if (cardIds.length) {
        const modifiedTarget = getCastTarget(window.player, target);
        const isOutOfRange = Math.round(math.distance(modifiedTarget, casterUnit)) > casterUnit.attackRange;
        // Note: setPredictionGraphicsLineStyle must be called before castCards (because castCards may use it
        // to draw predictions) and after clearSpellEffectProjection, which clears predictionGraphics.
        setPredictionGraphicsLineStyle(isOutOfRange ? 0xaaaaaa : colors.targetBlue);
        const effectState = await window.underworld.castCards(
          // Make a copy of cardUsageCounts for prediction so it can accurately
          // calculate mana for multiple copies of one spell in one cast
          JSON.parse(JSON.stringify(window.player.cardUsageCounts)),
          casterUnit,
          cardIds,
          modifiedTarget,
          true,
          false
        );
        // Draw targeted units
        setPredictionGraphicsLineStyle(isOutOfRange ? 0xaaaaaa : colors.targetBlue);
        for (let targetedUnit of effectState.targetedUnits) {
          drawTarget(targetedUnit);
        }
        for (let unitStats of effectState.aggregator.unitDamage) {
          // If a unit is currently alive and will take fatal damage,
          // draw red circle.
          if (unitStats.health > 0 && unitStats.damageTaken >= unitStats.health) {
            predictionGraphics.lineStyle(4, 0xff0000, 1.0);
            predictionGraphics.drawCircle(unitStats.x, unitStats.y, config.COLLISION_MESH_RADIUS);
          }
        }
      }
      // Send this client's intentions to the other clients so they can see what they're thinking
      window.underworld.sendPlayerThinking({ target, cardIds })

      // Run onTurnStartEvents on predictionUnits:
      // Displays markers above units heads if they will attack the current client's unit
      // next turn
      window.attentionMarkers = [];
      if (window.player) {
        for (let u of window.predictionUnits) {
          const skipTurn = await Unit.runTurnStartEvents(u, true);
          if (skipTurn) {
            continue;
          }
          // Only check for threats if the threat is alive and AI controlled
          if (u.alive && u.unitType == UnitType.AI) {
            const target = window.underworld.getUnitAttackTarget(u);
            // Only bother determining if the unit can attack the target 
            // if the target is the current player, because that's the only
            // player this function has to warn with an attention marker
            if (target === window.player.unit) {
              if (window.underworld.canUnitAttackTarget(u, target)) {
                window.attentionMarkers.push(u);
              }
            }
          }
        }
      }
      // Show if unit will be resurrected
      window.resMarkers = [];
      if (cardIds.includes('resurrect')) {
        window.predictionUnits.filter(u => u.faction == Faction.ALLY && u.alive).forEach(u => {
          // Check if their non-prediction counterpart is dead to see if they will be resurrected:
          const realUnit = window.underworld.units.find(x => x.id == u.id)
          if (realUnit && !realUnit.alive) {
            window.resMarkers.push(clone(realUnit));
          }
        })
      }

    }
  }
  if (window.runPredictionsPanel) {
    window.runPredictionsPanel.update(Date.now() - startTime, 300);
  }
}

// SpellEffectProjection are images to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection() {
  if (!window.animatingSpells) {
    predictionGraphics.clear();
    window.radiusGraphics.clear();
    containerSpells.removeChildren();
    window.underworld.units.forEach(unit => {
      if (unit.shaderUniforms.all_red) {
        unit.shaderUniforms.all_red.alpha = 0;
      }
    })
  }
}

export function drawPredictionLine(start: Vec2, end: Vec2) {
  // predictionGraphics.beginFill(0xffff0b, 0.5);
  predictionGraphics.lineStyle(3, 0x33ff00, 1.0);
  predictionGraphics.moveTo(start.x, start.y);
  predictionGraphics.lineTo(end.x, end.y);
  // predictionGraphics.endFill();
}
export function drawPredictionCircle(target: Vec2, radius: number) {
  predictionGraphics.drawCircle(target.x, target.y, radius);
}
export function setPredictionGraphicsLineStyle(color: number) {
  predictionGraphics.lineStyle(3, color, 1.0)
}
export function drawTarget(unit: Unit.IUnit) {
  const realUnit = window.underworld.units.find(u => u.id == unit.id);
  if (realUnit && realUnit.shaderUniforms.all_red) {
    realUnit.shaderUniforms.all_red.alpha = 0.5;
  }
}
export function drawPredictionCircleFill(target: Vec2, radius: number) {
  window.radiusGraphics.lineStyle(1, 0x000000, 0.0);
  window.radiusGraphics.beginFill(0xFFFFFF, 1.0);
  window.radiusGraphics.drawCircle(target.x, target.y, radius);
  window.radiusGraphics.endFill();
}

export function isOutOfBounds(target: Vec2) {
  return (
    target.x < window.underworld.limits.xMin || target.x >= window.underworld.limits.xMax || target.y < window.underworld.limits.yMin || target.y >= window.underworld.limits.yMax
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
${selectedUnit.faction == Faction.ALLY ? '🤝' : '⚔️️'} ${Faction[selectedUnit.faction]}
🗡️ ${selectedUnit.damage}
❤️ ${selectedUnit.health}/${selectedUnit.healthMax}
🔵 Mana ${selectedUnit.mana}/${selectedUnit.manaMax} + ${selectedUnit.manaPerTurn} per turn
Modifiers ${modifiersToText(selectedUnit.modifiers)}
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
  }

  elInspectorTooltipContent.innerText = text;
  if (text == '') {
    elInspectorTooltipContainer.style.visibility = "hidden";
  } else {
    elInspectorTooltipContainer.style.visibility = "visible";

  }
}
function modifiersToText(modifiers: object): string {
  let message = '';
  for (let [key, value] of Object.entries(modifiers)) {
    message += `
${key}${JSON.stringify(value, null, 2).split('"').join('').split('{').join('').split('}').join('')}`

  }
  return message;

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
// return boolean represents if there was a tooltip to clear
export function clearTooltipSelection(): boolean {
  if (selectedType) {
    selectedUnit = undefined;
    selectedPickup = undefined;
    selectedType = null;
    return true
  } else {
    return false;
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
  // If nothing was found to select, null-out selectedType
  // deselect
  selectedType = null;
}

// Draws a faint circle over things that can be clicked on
export function drawCircleUnderTarget(mousePos: Vec2, opacity: number, graphics: PIXI.Graphics) {
  const targetUnit = window.underworld.getUnitAt(mousePos)
  const target: Vec2 | undefined = targetUnit || window.underworld.getPickupAt(mousePos);
  if (target) {
    graphics.lineStyle(3, 0xaaaaaa, opacity);
    graphics.beginFill(0x000000, 0);
    // offset ensures the circle is under the player's feet
    // and is dependent on the animation's feet location
    const offsetX = targetUnit ? 3 : 0;
    const offsetY = targetUnit ? -3 : -15;
    graphics.drawEllipse(target.x + offsetX, target.y + config.COLLISION_MESH_RADIUS + offsetY, config.COLLISION_MESH_RADIUS / 2, config.COLLISION_MESH_RADIUS / 3);
    graphics.endFill();
  }
}