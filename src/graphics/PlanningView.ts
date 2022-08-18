import type * as PIXI from 'pixi.js';

import { allUnits } from '../entity/units';
import { containerSpells, containerUI, withinCameraBounds } from './PixiUtils';
import { containerPlanningView } from './PixiUtils';
import { Faction, UnitSubType, UnitType } from '../types/commonTypes';
import { clone, equal, Vec2, round } from '../jmath/Vec';
import Underworld, { biomeTextColor, turn_phase } from '../Underworld';
import * as CardUI from './ui/CardUI';
import * as config from '../config';
import * as Unit from '../entity/Unit';
import type * as Pickup from '../entity/Pickup';
import { calculateCost, CardCost } from '../cards/cardUtils';
import { closestLineSegmentIntersection } from '../jmath/lineSegment';
import { getBestRangedLOSTarget } from '../entity/units/actions/rangedAction';
import * as colors from './ui/colors';
import { getAdjustedCastTarget, isOutOfRange } from '../PlayerUtils';
import { pointsEveryXDistanceAlongPath } from '../jmath/Pathfinding';
import { distance, getCoordsAtDistanceTowardsTarget } from '../jmath/math';
import { Graphics } from 'pixi.js';
import { allCards } from '../cards';

// Graphics for rendering above board and walls but beneath units and doodads,
// see containerPlanningView for exact render order.
let planningViewGraphics: PIXI.Graphics | undefined;
// Graphics for drawing the spell effects during the dry run phase
let predictionGraphics: PIXI.Graphics | undefined;
// labelText is used to add a label to planningView circles 
// so that the player knows what the circle is referencing.
let labelText = !globalThis.pixi ? undefined : new globalThis.pixi.Text('', { fill: 'white' });
export function initPlanningView() {
  if (containerPlanningView && containerUI && globalThis.pixi) {
    planningViewGraphics = new globalThis.pixi.Graphics();
    globalThis.planningViewGraphics = planningViewGraphics;
    containerPlanningView.addChild(planningViewGraphics);
    predictionGraphics = new globalThis.pixi.Graphics();
    globalThis.predictionGraphics = predictionGraphics;
    containerUI.addChild(predictionGraphics);
    if (labelText) {
      labelText.anchor.x = 0.5;
      labelText.anchor.y = 0;
      containerUI.addChild(labelText);
    }
  }
}
let lastSpotCurrentPlayerTurnCircle: Vec2 = { x: 0, y: 0 };
export function updatePlanningView(underworld: Underworld) {
  if (planningViewGraphics && globalThis.unitOverlayGraphics && labelText) {
    planningViewGraphics.clear();
    if (labelText) {
      labelText.text = '';
      labelText.style.fill = biomeTextColor(underworld.lastLevelCreated?.biome)
    }
    if (selectedPickup) {
      // Draw circle to show that pickup is selected
      drawCircleUnderTarget(selectedPickup, underworld, 1.0, planningViewGraphics);
    }
    // Draw UI for the globalThis.selectedUnit
    if (globalThis.selectedUnit) {
      if (
        globalThis.selectedUnit.alive
      ) {
        // Draw circle to show that unit is selected
        drawCircleUnderTarget(globalThis.selectedUnit, underworld, 1.0, planningViewGraphics);
        // If globalThis.selectedUnit is an archer, draw LOS attack line
        //  instead of attack range for them
        if (globalThis.selectedUnit.unitSubType == UnitSubType.RANGED_LOS) {
          let archerTarget = getBestRangedLOSTarget(globalThis.selectedUnit, underworld);
          // If they don't have a target they can actually attack
          // draw a line to the closest enemy that they would target if
          // they had LOS
          if (!archerTarget) {
            archerTarget = Unit.findClosestUnitInDifferentFaction(globalThis.selectedUnit, underworld);
          }
          if (archerTarget) {
            const attackLine = { p1: globalThis.selectedUnit, p2: archerTarget };
            const closestIntersection = closestLineSegmentIntersection(attackLine, underworld.walls);

            planningViewGraphics.moveTo(attackLine.p1.x, attackLine.p1.y);
            if (closestIntersection) {
              // Draw a grey line  showing that the target is blocked
              planningViewGraphics.lineStyle(3, colors.outOfRangeGrey, 0.7);
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

          if (globalThis.selectedUnit.attackRange > 0) {

            const rangeCircleColor = globalThis.selectedUnit.faction == Faction.ALLY ? colors.attackRangeAlly : colors.attackRangeEnemy;
            globalThis.unitOverlayGraphics.lineStyle(2, rangeCircleColor, 1.0);
            if (globalThis.selectedUnit.unitSubType === UnitSubType.RANGED_RADIUS) {
              globalThis.unitOverlayGraphics.drawCircle(
                globalThis.selectedUnit.x,
                globalThis.selectedUnit.y,
                globalThis.selectedUnit.attackRange
              );
              labelText.text = 'Attack Range';
              const labelPosition = withinCameraBounds({ x: globalThis.selectedUnit.x, y: globalThis.selectedUnit.y + globalThis.selectedUnit.attackRange }, labelText.width / 2);
              labelText.x = labelPosition.x;
              labelText.y = labelPosition.y;
            } else if (globalThis.selectedUnit.unitSubType === UnitSubType.SUPPORT_CLASS) {
              globalThis.unitOverlayGraphics.drawCircle(
                globalThis.selectedUnit.x,
                globalThis.selectedUnit.y,
                globalThis.selectedUnit.attackRange
              );
              labelText.text = 'Support Range';
              const labelPosition = withinCameraBounds({ x: globalThis.selectedUnit.x, y: globalThis.selectedUnit.y + globalThis.selectedUnit.attackRange }, labelText.width / 2);
              labelText.x = labelPosition.x;
              labelText.y = labelPosition.y;
            } else if (globalThis.selectedUnit.unitSubType === UnitSubType.MELEE) {
              globalThis.unitOverlayGraphics.drawCircle(
                globalThis.selectedUnit.x,
                globalThis.selectedUnit.y,
                globalThis.selectedUnit.staminaMax + globalThis.selectedUnit.attackRange
              );
              globalThis.unitOverlayGraphics.endFill();
              labelText.text = 'Attack Range';
              const labelPosition = withinCameraBounds({ x: globalThis.selectedUnit.x, y: globalThis.selectedUnit.y + globalThis.selectedUnit.staminaMax + globalThis.selectedUnit.attackRange }, labelText.width / 2);
              labelText.x = labelPosition.x;
              labelText.y = labelPosition.y;
            } else if (globalThis.selectedUnit.unitSubType === UnitSubType.PLAYER_CONTROLLED) {
              drawCastRangeCircle(globalThis.selectedUnit, globalThis.selectedUnit.attackRange, globalThis.unitOverlayGraphics)
            }
          }
        }
      }
    }
    // Draw a circle under the feet of the player whos current turn it is
    if (underworld) {
      // Update tooltip for whatever is being hovered
      updateTooltipContent(underworld);

      if (globalThis.player) {
        // Only draw circle if player isn't moving to avoid UI thrashing
        if (equal(lastSpotCurrentPlayerTurnCircle, globalThis.player.unit)) {
          if (underworld.isMyTurn()) {
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
          const arbitratyOffset = 10;
          planningViewGraphics.drawEllipse(globalThis.player.unit.x, globalThis.player.unit.y + config.COLLISION_MESH_RADIUS - arbitratyOffset, config.COLLISION_MESH_RADIUS / 2, config.COLLISION_MESH_RADIUS / 3);
          planningViewGraphics.endFill();
        }
        lastSpotCurrentPlayerTurnCircle = clone(globalThis.player.unit);
      }
    }
  }
}
// a UnitPath that is used to display the player's "walk rope"
// which shows the path that they will travel if they were
// to move towards the mouse cursor
let walkRopePath: Unit.UnitPath | undefined = undefined;
export function drawWalkRope(target: Vec2, underworld: Underworld) {
  if (!globalThis.player) {
    return
  }
  //
  // Show the player's current walk path (walk rope)
  //
  // The distance that the player can cover with their current stamina
  // is drawn in the stamina color.
  // There are dots dilineating how far the unit can move each turn.
  //
  // Show walk path
  globalThis.walkPathGraphics?.clear();
  walkRopePath = underworld.calculatePath(walkRopePath, round(globalThis.player.unit), round(target));
  const { points: currentPlayerPath } = walkRopePath;
  if (currentPlayerPath.length) {
    const turnStopPoints = pointsEveryXDistanceAlongPath(globalThis.player.unit, currentPlayerPath, globalThis.player.unit.staminaMax, globalThis.player.unit.staminaMax - globalThis.player.unit.stamina);
    globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
    globalThis.walkPathGraphics?.moveTo(globalThis.player.unit.x, globalThis.player.unit.y);
    let lastPoint: Vec2 = globalThis.player.unit;
    let distanceCovered = 0;
    let pointAtWhichUnitOutOfStamina: Vec2 | undefined;
    const distanceLeftToMove = globalThis.player.unit.stamina;
    for (let i = 0; i < currentPlayerPath.length; i++) {
      const point = currentPlayerPath[i];
      if (point) {
        const thisLineDistance = distance(lastPoint, point);
        if (distanceCovered > distanceLeftToMove) {
          globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
          globalThis.walkPathGraphics?.lineTo(point.x, point.y);
        } else {
          globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
          if (distanceCovered + thisLineDistance > distanceLeftToMove) {
            // Draw up to the firstStop with the stamina color
            pointAtWhichUnitOutOfStamina = getCoordsAtDistanceTowardsTarget(lastPoint, point, distanceLeftToMove - distanceCovered);
            globalThis.walkPathGraphics?.lineTo(pointAtWhichUnitOutOfStamina.x, pointAtWhichUnitOutOfStamina.y);
            globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
            globalThis.walkPathGraphics?.lineTo(point.x, point.y);
          } else {
            globalThis.walkPathGraphics?.lineTo(point.x, point.y);
          }
        }
        distanceCovered += distance(lastPoint, point);
        lastPoint = point;
      }
    }
    drawCastRangeCircle(pointAtWhichUnitOutOfStamina || lastPoint, globalThis.player.unit.attackRange, globalThis.walkPathGraphics, 'Potential Cast Range');
    // Draw the points along the path at which the unit will stop on each turn
    for (let i = 0; i < turnStopPoints.length; i++) {
      if (i == 0 && distanceLeftToMove > 0) {
        globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
      } else {
        globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
      }
      const point = turnStopPoints[i];
      if (point) {
        globalThis.walkPathGraphics?.drawCircle(point.x, point.y, 3);
      }
    }
    if (turnStopPoints.length == 0 && distanceLeftToMove > 0) {
      globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
    } else {
      globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
    }
    // Draw a stop circle at the end
    const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
    if (lastPointInPath) {
      globalThis.walkPathGraphics?.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
    }
  }

}
function drawCastRangeCircle(point: Vec2, range: number, graphics?: Graphics, text: string = 'Cast Range') {
  if (graphics) {
    // Draw what cast range would be if unit moved to this point:
    graphics.lineStyle(3, colors.attackRangeAlly, 1.0);
    graphics.drawCircle(
      point.x,
      point.y,
      range
    );
    if (labelText) {
      labelText.text = text;
      const labelPosition = withinCameraBounds({ x: point.x, y: point.y + range }, labelText.width / 2);
      labelText.x = labelPosition.x;
      labelText.y = labelPosition.y;
    }
  }
}
export function updateManaCostUI(underworld: Underworld): CardCost {
  if (globalThis.player) {
    // Update the UI that shows how much cards cost
    CardUI.updateCardBadges(underworld);
    // Updates the mana cost
    const cards = CardUI.getSelectedCards();
    const cost = calculateCost(cards, globalThis.player.cardUsageCounts)
    return cost;
  }
  return { manaCost: 0, healthCost: 0 };
}
export function clearUnitTints(underworld: Underworld) {
  // Reset tints before setting new tints to show targeting
  underworld.units.forEach(unit => {
    if (unit.image) {
      unit.image.sprite.tint = 0xFFFFFF;
    }
  });
}

// Returns true if castCards has effect
async function showCastCardsPrediction(underworld: Underworld, target: Vec2, casterUnit: Unit.IUnit, cardIds: string[], outOfRange: boolean): Promise<boolean> {
  if (globalThis.player) {
    // Note: setPredictionGraphicsLineStyle must be called before castCards (because castCards may use it
    // to draw predictions) and after clearSpellEffectProjection, which clears predictionGraphics.
    setPredictionGraphicsLineStyle(outOfRange ? 0xaaaaaa : colors.targetBlue);
    const effectState = await underworld.castCards(
      // Make a copy of cardUsageCounts for prediction so it can accurately
      // calculate mana for multiple copies of one spell in one cast
      JSON.parse(JSON.stringify(globalThis.player.cardUsageCounts)),
      casterUnit,
      cardIds,
      target,
      true,
      false,
      outOfRange
    );
    // Clears unit tints in preparation for setting new tints to symbolize which units are targeted by spell
    clearUnitTints(underworld);
    // Show units as targeted with tint
    for (let targetedUnit of effectState.targetedUnits) {
      // Convert prediction unit's associated real unit
      const realUnit = underworld.units.find(u => u.id == targetedUnit.id);
      // don't change tint if HUD is hidden
      if (realUnit && realUnit.image && !globalThis.isHUDHidden) {
        if (outOfRange) {
          realUnit.image.sprite.tint = 0xaaaaaa;
        } else {
          if (targetedUnit.faction == globalThis.player?.unit.faction) {
            // Ally
            realUnit.image.sprite.tint = 0x5555ff;
          } else {
            // Enemy
            realUnit.image.sprite.tint = 0xff5555;
          }
        }
      }
    }
    for (let unitStats of effectState.aggregator.unitDamage) {
      // If a unit is currently alive and will take fatal damage,
      // draw red circle.
      if (unitStats.health > 0 && unitStats.damageTaken >= unitStats.health) {
        if (predictionGraphics) {
          predictionGraphics.lineStyle(4, 0xff0000, 1.0);
          predictionGraphics.drawCircle(unitStats.x, unitStats.y, config.COLLISION_MESH_RADIUS);
        }
      }
    }
    return effectState.targetedUnits.length > 0 || effectState.targetedPickups.length > 0;
  }
  return false;
}
// predicts what will happen next turn
// via enemy attention markers (showing if they will hurt you)
// your health and mana bar (the stripes)
// and enemy health and mana bars
export async function runPredictions(underworld: Underworld) {
  if (globalThis.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  if (!underworld) {
    return;
  }
  const startTime = Date.now();
  const mousePos = underworld.getMousePos();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection(underworld);
  // only show hover target when it's the correct turn phase
  if (underworld.turn_phase == turn_phase.PlayerTurns) {

    if (globalThis.player) {
      underworld.syncPredictionEntities();
      updateManaCostUI(underworld);
      // Dry run cast so the user can see what effect it's going to have
      const target = getAdjustedCastTarget(globalThis.player, mousePos);
      const casterUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id)
      if (!casterUnit) {
        console.error('Critical Error, caster unit not found');
        return;
      }
      const cardIds = CardUI.getSelectedCardIds();
      if (cardIds.length) {
        const outOfRange = isOutOfRange(globalThis.player, target, true);
        await showCastCardsPrediction(underworld, target, casterUnit, cardIds, outOfRange);
      } else {
        // If there are no cards ready to cast, clear unit tints (which symbolize units that are targeted by the active spell)
        clearUnitTints(underworld);
      }
      // Send this client's intentions to the other clients so they can see what they're thinking
      underworld.sendPlayerThinking({ target, cardIds })

      // Run onTurnStartEvents on predictionUnits:
      // Displays markers above units heads if they will attack the current client's unit
      // next turn
      globalThis.attentionMarkers = [];
      if (globalThis.player) {
        for (let u of underworld.unitsPrediction) {
          const skipTurn = await Unit.runTurnStartEvents(u, true, underworld);
          if (skipTurn) {
            continue;
          }
          // Only check for threats if the threat is alive and AI controlled
          if (u.alive && u.unitType == UnitType.AI) {
            const target = underworld.getUnitAttackTarget(u);
            // Only bother determining if the unit can attack the target 
            // if the target is the current player, because that's the only
            // player this function has to warn with an attention marker
            if (target === globalThis.player.unit) {
              if (underworld.canUnitAttackTarget(u, target)) {
                globalThis.attentionMarkers.push({ imagePath: Unit.subTypeToAttentionMarkerImage(u), pos: clone(u) });
              }
            }
          }
        }
      }
      // Show if unit will be resurrected
      globalThis.resMarkers = [];
      if (cardIds.includes('resurrect')) {
        underworld.unitsPrediction.filter(u => u.faction == Faction.ALLY && u.alive).forEach(u => {
          // Check if their non-prediction counterpart is dead to see if they will be resurrected:
          const realUnit = underworld.units.find(x => x.id == u.id)
          if (realUnit && !realUnit.alive) {
            globalThis.resMarkers?.push(clone(realUnit));
          }
        })
      }
    }
  }
  if (globalThis.runPredictionsPanel) {
    globalThis.runPredictionsPanel.update(Date.now() - startTime, 300);
  }
}

// SpellEffectProjection are images to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection(underworld: Underworld) {
  if (!globalThis.animatingSpells) {
    if (predictionGraphics) {
      predictionGraphics.clear();
    }
    if (globalThis.radiusGraphics) {
      globalThis.radiusGraphics.clear();
    }
    if (containerSpells) {
      containerSpells.removeChildren();
    }
  }
}

export function drawPredictionLine(start: Vec2, end: Vec2) {
  if (predictionGraphics) {
    // predictionGraphics.beginFill(0xffff0b, 0.5);
    predictionGraphics.lineStyle(3, 0x33ff00, 1.0);
    predictionGraphics.moveTo(start.x, start.y);
    predictionGraphics.lineTo(end.x, end.y);
    // predictionGraphics.endFill();
  }
}
export function drawPredictionCircle(target: Vec2, radius: number, color: number, text?: string) {
  if (predictionGraphics) {
    predictionGraphics.lineStyle(2, color, 1.0)
    predictionGraphics.endFill();
    predictionGraphics.drawCircle(target.x, target.y, radius);
    if (text && labelText) {
      labelText.text = text;
      const labelPosition = withinCameraBounds({ x: target.x, y: target.y + radius }, labelText.width / 2);
      labelText.x = labelPosition.x;
      labelText.y = labelPosition.y;
    }
  }
}
export function setPredictionGraphicsLineStyle(color: number) {
  if (predictionGraphics) {
    predictionGraphics.lineStyle(3, color, 1.0)
  }
}
export function drawPredictionCircleFill(target: Vec2, radius: number) {
  if (globalThis.radiusGraphics) {
    globalThis.radiusGraphics.lineStyle(1, 0x000000, 0.0);
    globalThis.radiusGraphics.beginFill(0xFFFFFF, 1.0);
    globalThis.radiusGraphics.drawCircle(target.x, target.y, radius);
    globalThis.radiusGraphics.endFill();
  }
}

export function isOutOfBounds(target: Vec2, underworld: Underworld) {
  return (
    target.x < underworld.limits.xMin || target.x >= underworld.limits.xMax || target.y < underworld.limits.yMin || target.y >= underworld.limits.yMax
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
let selectedPickup: Pickup.IPickup | undefined;
export function updateTooltipContent(underworld: Underworld) {
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
      if (globalThis.selectedUnit) {
        if (globalThis.selectedUnit.unitType === UnitType.PLAYER_CONTROLLED) {
          const player = underworld.players.find((p) => p.unit === globalThis.selectedUnit);
          if (player) {
            cards =
              'Cards: ' +
              player.cards.join(', ');
          } else {
            console.error('Tooltip: globalThis.selectedUnit is player controlled but does not exist in underworld.players array.');
            globalThis.selectedUnit = undefined;
            break;
          }
        }
        const unitSource = allUnits[globalThis.selectedUnit.unitSourceId]
        if (unitSource) {
          text += `\
${unitSource.id}
${unitSource.info.description}
${globalThis.selectedUnit.faction == Faction.ALLY ? '🤝' : '⚔️️'} ${Faction[globalThis.selectedUnit.faction]}
🗡️ ${globalThis.selectedUnit.damage}
❤️ ${globalThis.selectedUnit.health}/${globalThis.selectedUnit.healthMax}
🔵 Mana ${globalThis.selectedUnit.mana}/${globalThis.selectedUnit.manaMax} + ${globalThis.selectedUnit.manaPerTurn} per turn

${modifiersToText(globalThis.selectedUnit.modifiers)}
${unitSource.extraTooltipInfo ? unitSource.extraTooltipInfo() : ''}
${cards}
      `;

          // Temporarily disabled image since unit images are not in public folder
          // and i don't want it to report a bunch of 404s
          // const imagePath = Unit.getImagePathForUnitId(unitSource.id);
          // if (elInspectorTooltipImage.src !== imagePath) {

          //   elInspectorTooltipImage.src = imagePath;
          // }
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

  elInspectorTooltipContent.innerHTML = text;
  if (text == '') {
    elInspectorTooltipContainer.style.visibility = "hidden";
  } else {
    elInspectorTooltipContainer.style.visibility = "visible";

  }
}
function modifiersToText(modifiers: object): string {
  if (Object.keys(modifiers).length === 0) {
    return ''
  }
  let message = '';
  for (let [key, value] of Object.entries(modifiers)) {
    message += `<div style="line-height:16px"><img width="16px" height="16px" src="images/spell/${allCards[key]?.thumbnail}"> ${key} ${value.stacks || value.turnsLeft || value.damage_block || ''}</div>`
  }
  return message;

}
export function checkIfNeedToClearTooltip() {
  if (globalThis.selectedUnit && !globalThis.selectedUnit.alive) {
    clearTooltipSelection();
  }
  // Quick hack to check if the pickup has been picked up
  // If so, deselect it
  if (selectedPickup && (selectedPickup.image && selectedPickup.image.sprite.parent === null)) {
    clearTooltipSelection();
  }

}
// return boolean represents if there was a tooltip to clear
export function clearTooltipSelection(): boolean {
  if (selectedType) {
    globalThis.selectedUnit = undefined;
    selectedPickup = undefined;
    selectedType = null;
    return true
  } else {
    return false;
  }
}
export function updateTooltipSelection(mousePos: Vec2, underworld: Underworld) {

  // Find unit:
  const unit = underworld.getUnitAt(mousePos);
  if (unit) {
    globalThis.selectedUnit = unit;
    selectedType = "unit";
    return
  } else {
    globalThis.selectedUnit = undefined;
  }
  const pickup = underworld.getPickupAt(mousePos);
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
export function drawCircleUnderTarget(mousePos: Vec2, underworld: Underworld, opacity: number, graphics: PIXI.Graphics | undefined) {
  if (!graphics) {
    // For headless
    return;
  }
  const targetUnit = underworld.getUnitAt(mousePos)
  const target: Vec2 | undefined = targetUnit || underworld.getPickupAt(mousePos);
  if (target) {
    graphics.lineStyle(3, 0xaaaaaa, opacity);
    graphics.beginFill(0x000000, 0);
    // offset ensures the circle is under the player's feet
    // and is dependent on the animation's feet location
    const offsetX = targetUnit ? 0 : 0;
    const offsetY = targetUnit ? -10 : -15;
    graphics.drawEllipse(target.x + offsetX, target.y + config.COLLISION_MESH_RADIUS + offsetY, config.COLLISION_MESH_RADIUS / 2, config.COLLISION_MESH_RADIUS / 3);
    graphics.endFill();
  }
}


// Used to return properties for drawRect for drawing
// unit health and mana bars
export function getUIBarProps(x: number, y: number, numerator: number, denominator: number, zoom: number): { x: number, y: number, width: number, height: number } {
  const barWidthAccountForZoom = config.UNIT_UI_BAR_WIDTH / zoom;
  const barWidth = Math.max(0, barWidthAccountForZoom * Math.min(1, numerator / denominator));
  const height = config.UNIT_UI_BAR_HEIGHT / zoom;
  return {
    x: x - barWidthAccountForZoom / 2,
    // - height so that bar stays in the same position relative to the unit
    // regardless of zoom
    // - config.HEALTH_BAR_UI_Y_POS so that it renders above their head instead of
    // on their center point
    y: y - config.HEALTH_BAR_UI_Y_POS - height,
    width: barWidth,
    height
  }


}