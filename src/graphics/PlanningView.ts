import type * as PIXI from 'pixi.js';

import { allUnits } from '../entity/units';
import { containerSpells, containerUI, withinCameraBounds } from './PixiUtils';
import { containerPlanningView } from './PixiUtils';
import { Faction, UnitSubType, UnitType } from '../types/commonTypes';
import { clone, equal, Vec2 } from '../jmath/Vec';
import { turn_phase } from '../Underworld';
import * as CardUI from './ui/CardUI';
import * as config from '../config';
import * as Unit from '../entity/Unit';
import type * as Pickup from '../entity/Pickup';
import { calculateCost, CardCost } from '../cards/cardUtils';
import { closestLineSegmentIntersection } from '../jmath/lineSegment';
import { getBestRangedLOSTarget } from '../entity/units/actions/rangedAction';
import * as colors from './ui/colors';
import { getEndOfRangeTarget, isOutOfRange } from '../PlayerUtils';

// Graphics for rendering above board and walls but beneath units and doodads,
// see containerPlanningView for exact render order.
let planningViewGraphics: PIXI.Graphics | undefined;
// Graphics for drawing the spell effects during the dry run phase
let predictionGraphics: PIXI.Graphics | undefined;
// labelText is used to add a label to planningView circles 
// so that the player knows what the circle is referencing.
let labelText = !window.pixi ? undefined : new window.pixi.Text('', { fill: 'white' });
export function initPlanningView() {
  if (containerPlanningView && containerUI && window.pixi) {
    planningViewGraphics = new window.pixi.Graphics();
    window.planningViewGraphics = planningViewGraphics;
    containerPlanningView.addChild(planningViewGraphics);
    predictionGraphics = new window.pixi.Graphics();
    window.predictionGraphics = predictionGraphics;
    containerUI.addChild(predictionGraphics);
    if (labelText) {
      labelText.anchor.x = 0.5;
      labelText.anchor.y = 0;
      containerUI.addChild(labelText);
    }
  }
}
let lastSpotCurrentPlayerTurnCircle: Vec2 = { x: 0, y: 0 };
export function updatePlanningView() {
  if (planningViewGraphics && window.unitOverlayGraphics && labelText) {
    planningViewGraphics.clear();
    if (labelText) {
      labelText.text = '';
    }
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
            labelText.text = 'Attack Range';
          } else if (selectedUnit.unitSubType === UnitSubType.SUPPORT_CLASS) {
            window.unitOverlayGraphics.drawCircle(
              selectedUnit.x,
              selectedUnit.y,
              selectedUnit.attackRange
            );
            labelText.text = 'Support Range';
          } else if (selectedUnit.unitSubType === UnitSubType.MELEE) {
            window.unitOverlayGraphics.drawCircle(
              selectedUnit.x,
              selectedUnit.y,
              selectedUnit.attackRange
            );
            labelText.text = 'Attack Range';
          } else if (selectedUnit.unitSubType === UnitSubType.PLAYER_CONTROLLED) {
            window.unitOverlayGraphics.drawCircle(
              selectedUnit.x,
              selectedUnit.y,
              selectedUnit.attackRange
            );
            labelText.text = 'Cast Range';
          }
          const labelPosition = withinCameraBounds({ x: selectedUnit.x, y: selectedUnit.y + selectedUnit.attackRange }, labelText.width / 2);
          labelText.x = labelPosition.x;
          labelText.y = labelPosition.y;
          window.unitOverlayGraphics.endFill();
        }
      }
    }
    // Draw a circle under the feet of the player whos current turn it is
    if (window.underworld) {
      // Update tooltip for whatever is being hovered
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
          const arbitratyOffset = 10;
          planningViewGraphics.drawEllipse(window.player.unit.x, window.player.unit.y + config.COLLISION_MESH_RADIUS - arbitratyOffset, config.COLLISION_MESH_RADIUS / 2, config.COLLISION_MESH_RADIUS / 3);
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

// Returns true if castCards has effect
async function showCastCardsPrediction(target: Vec2, casterUnit: Unit.IUnit, cardIds: string[], outOfRange: boolean): Promise<boolean> {
  if (window.player) {
    // Note: setPredictionGraphicsLineStyle must be called before castCards (because castCards may use it
    // to draw predictions) and after clearSpellEffectProjection, which clears predictionGraphics.
    setPredictionGraphicsLineStyle(outOfRange ? 0xaaaaaa : colors.targetBlue);
    const effectState = await window.underworld.castCards(
      // Make a copy of cardUsageCounts for prediction so it can accurately
      // calculate mana for multiple copies of one spell in one cast
      JSON.parse(JSON.stringify(window.player.cardUsageCounts)),
      casterUnit,
      cardIds,
      target,
      true,
      false
    );
    // Show units as targeted
    for (let targetedUnit of effectState.targetedUnits) {
      drawTarget(targetedUnit, outOfRange);
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
      window.underworld.syncPredictionEntities();
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
        const outOfRange = isOutOfRange(window.player, target);
        if (outOfRange) {
          // If the target is out of range, try predicting at the point of the end of player's range
          const endOfRangeTarget = getEndOfRangeTarget(window.player, target);
          // Note, showCastCardsPredition's outOfRange is explicitly set to false because the endOfRangeTarget
          // is by-definition, in range because it is the literal end of the player's range
          const didHaveEffect = await showCastCardsPrediction(endOfRangeTarget, casterUnit, cardIds, false);
          if (!didHaveEffect) {
            // Note: we have to resync prediction units since castCards will have been called twice in 
            // this prediction cycle within this branch. Otherwise our player's prediction mana
            // will be reduced by 2x more than it should be
            window.underworld.syncPredictionEntities();
            // Reassign casterUnit now that the predictionUnits array has been completely rebuilt
            const casterUnit = window.predictionUnits.find(u => u.id == window.player?.unit.id)
            if (!casterUnit) {
              console.error('Critical Error, caster unit not found');
              return;
            }
            // If the cast at the end of range had no effect then predict what would happen at the actual
            // target so players can see what it will do if they do get close enough to cast
            await showCastCardsPrediction(target, casterUnit, cardIds, outOfRange);
          }
        } else {
          // If they are within range, just predict like normal, easy peasy.
          await showCastCardsPrediction(target, casterUnit, cardIds, outOfRange);
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
                window.attentionMarkers.push({ imagePath: Unit.subTypeToAttentionMarkerImage(u), pos: clone(u) });
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
    if (predictionGraphics) {
      predictionGraphics.clear();
    }
    if (window.radiusGraphics) {
      window.radiusGraphics.clear();
    }
    if (containerSpells) {
      containerSpells.removeChildren();
    }
    window.underworld.units.forEach(unit => {
      if (unit.image) {
        unit.image.sprite.tint = 0xFFFFFF;
      }
      // if (unit.shaderUniforms.all_red) {
      //   unit.shaderUniforms.all_red.alpha = 0;
      // }
    })
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
export function drawPredictionCircle(target: Vec2, radius: number) {
  if (predictionGraphics) {
    predictionGraphics.drawCircle(target.x, target.y, radius);
  }
}
export function setPredictionGraphicsLineStyle(color: number) {
  if (predictionGraphics) {
    predictionGraphics.lineStyle(3, color, 1.0)
  }
}
export function drawTarget(unit: Unit.IUnit, isOutOfRange: boolean) {
  // Convert prediction unit's associated real unit
  const realUnit = window.underworld.units.find(u => u.id == unit.id);
  if (realUnit && realUnit.image) {
    if (isOutOfRange) {
      realUnit.image.sprite.tint = 0xaaaaaa;
    } else {
      if (unit.faction == window.player?.unit.faction) {
        // Ally
        realUnit.image.sprite.tint = 0x5555ff;
      } else {
        // Enemy
        realUnit.image.sprite.tint = 0xff5555;
      }
    }
  }
  // if (realUnit && realUnit.shaderUniforms.all_red) {
  //   realUnit.shaderUniforms.all_red.alpha = 0.5;
  // }
}
export function drawPredictionCircleFill(target: Vec2, radius: number) {
  if (window.radiusGraphics) {
    window.radiusGraphics.lineStyle(1, 0x000000, 0.0);
    window.radiusGraphics.beginFill(0xFFFFFF, 1.0);
    window.radiusGraphics.drawCircle(target.x, target.y, radius);
    window.radiusGraphics.endFill();
  }
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
  if (selectedPickup && (selectedPickup.image && selectedPickup.image.sprite.parent === null)) {
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
export function drawCircleUnderTarget(mousePos: Vec2, opacity: number, graphics: PIXI.Graphics | undefined) {
  if (!graphics) {
    // For headless
    return;
  }
  const targetUnit = window.underworld.getUnitAt(mousePos)
  const target: Vec2 | undefined = targetUnit || window.underworld.getPickupAt(mousePos);
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
  const barWidth = Math.max(0, barWidthAccountForZoom * numerator / denominator);
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