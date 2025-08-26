import type * as PIXI from 'pixi.js';

import { allUnits } from '../entity/units';
import { containerSpells, containerUI, getCamera, withinCameraBounds } from './PixiUtils';
import { containerPlanningView } from './PixiUtils';
import { Faction, UnitSubType, UnitType } from '../types/commonTypes';
import { clone, equal, Vec2, round } from '../jmath/Vec';
import Underworld, { biomeTextColor, turn_phase } from '../Underworld';
import * as CardUI from './ui/CardUI';
import * as config from '../config';
import * as Unit from '../entity/Unit';
import * as Vec from '../jmath/Vec';
import * as math from '../jmath/math';
import * as ImmediateMode from './ImmediateModeSprites';
import * as colors from './ui/colors';
import { isOutOfRange } from '../PlayerUtils';
import { pointsEveryXDistanceAlongPath } from '../jmath/Pathfinding';
import { distance, getCoordsAtDistanceTowardsTarget } from '../jmath/math';
import { Graphics } from 'pixi.js';
import { allCards } from '../cards';
import { keyDown } from './ui/eventListeners';
import { inPortal } from '../entity/Player';
import { View } from '../View';
import { getSuffocateBuildup, suffocateCardId } from '../cards/suffocate';
import * as Cards from '../cards';
import { ANCIENT_UNIT_ID } from '../entity/units/ancient';
import { isRune } from '../cards/cardUtils';
import { GlowFilter } from '@pixi/filter-glow';

const TEXT_OUT_OF_RANGE = 'Out of Range';
// Graphics for rendering above board and walls but beneath units and doodads,
// see containerPlanningView for exact render order.
let planningViewGraphics: PIXI.Graphics | undefined;
// labelText is used to add a label to planningView circles 
// so that the player knows what the circle is referencing.
let labelText = !globalThis.pixi ? undefined : new globalThis.pixi.Text('', { fill: 'white', ...config.PIXI_TEXT_DROP_SHADOW, fontFamily: 'Forum' });
let mouseLabelText = !globalThis.pixi ? undefined : new globalThis.pixi.Text('', { fill: 'white', ...config.PIXI_TEXT_DROP_SHADOW, fontFamily: 'Forum' });
export function initPlanningView() {
  if (containerPlanningView && containerUI && globalThis.pixi) {
    planningViewGraphics = new globalThis.pixi.Graphics();
    globalThis.planningViewGraphics = planningViewGraphics;
    containerPlanningView.addChild(planningViewGraphics);
    globalThis.predictionGraphicsGreen = new globalThis.pixi.Graphics();
    globalThis.predictionGraphicsGreen.filters = [
      new GlowFilter({ distance: 15, outerStrength: config.predictionGlowStrength, innerStrength: 0, color: colors.targetingSpellGreen })
    ];
    containerUI.addChild(globalThis.predictionGraphicsGreen);

    globalThis.predictionGraphicsRed = new globalThis.pixi.Graphics();
    globalThis.predictionGraphicsRed.filters = [
      new GlowFilter({ distance: 15, outerStrength: config.predictionGlowStrength, innerStrength: 1, color: colors.trueRed })
    ];
    containerUI.addChild(globalThis.predictionGraphicsRed);

    globalThis.predictionGraphicsWhite = new globalThis.pixi.Graphics();
    globalThis.predictionGraphicsWhite.filters = [
      new GlowFilter({ distance: 15, outerStrength: config.predictionGlowStrength, innerStrength: 0, color: 0xffffff })
    ];
    containerUI.addChild(globalThis.predictionGraphicsWhite);

    globalThis.predictionGraphicsBlue = new globalThis.pixi.Graphics();
    globalThis.predictionGraphicsBlue.filters = [
      new GlowFilter({ distance: 15, outerStrength: config.predictionGlowStrength, innerStrength: 0, color: colors.predictionBlue })
    ];
    containerUI.addChild(globalThis.predictionGraphicsBlue);
    if (labelText) {
      labelText.style.fontSize = 100;
      labelText.anchor.x = 0.5;
      labelText.anchor.y = 0.5;
      labelText.scale.x = 0.3;
      labelText.scale.y = 0.3;
      containerUI.addChild(labelText);
    }
    if (mouseLabelText) {
      mouseLabelText.style.fontSize = 100;
      mouseLabelText.anchor.x = 0.5;
      mouseLabelText.anchor.y = 0.5;
      mouseLabelText.scale.x = 0.3;
      mouseLabelText.scale.y = 0.3;
      containerUI.addChild(mouseLabelText);
    }
  }
}
let lastSpotCurrentPlayerTurnCircle: Vec2 = { x: 0, y: 0 };
export function updatePlanningView(underworld: Underworld) {
  if (planningViewGraphics && globalThis.selectedUnitGraphics && globalThis.unitOverlayGraphics && labelText) {

    planningViewGraphics.clear();
    globalThis.selectedUnitGraphics.clear();
    //unitOverlayGraphics is handled by underworld: it uses it before updatePlanningView() is called to draw hp/mp bars
    labelText.style.fill = biomeTextColor(underworld.lastLevelCreated?.biome)

    const mouseTarget = underworld.getMousePos();
    // If the player has a spell ready and the mouse is beyond their max cast range
    // show the players cast range so they user knows that they are out of range
    if (globalThis.player) {
      // Do not draw out of range information if player is viewing the walkRope so that
      // they can see how far they can move unobstructed
      if (!keyDown.showWalkRope) {
        const cardIds = CardUI.getSelectedCardIds();
        if (cardIds.length) {
          const outOfRange = isOutOfRange(globalThis.player, mouseTarget, underworld, cardIds);
          if (outOfRange) {
            // Only show outOfRange information if mouse is over the game canvas, not when it's over UI elements
            if (globalThis.hoverTarget && globalThis.hoverTarget.closest('#PIXI-holder')) {
              addWarningAtMouse(TEXT_OUT_OF_RANGE);
            }
          } else {
            removeWarningAtMouse(TEXT_OUT_OF_RANGE);
          }
        }
      }
    }

    // These arrays are leftover from an old version
    // might be better to replace with a boolean, tracking whether or not prediction UI is active
    const currentlyWarningOutOfRange = warnings.has(TEXT_OUT_OF_RANGE);
    if (predictionPolys.length || predictionCones.length || predictionCircles.length || predictionCirclesFill.length || currentlyWarningOutOfRange) {
      // Only draw selected unit graphics if there is no prediction UI or out-of-range warning
      // prediction graphics are drawn in runPrediction()
    }
    else {
      // Clear label if there are no predictions
      labelText.text = '';

      // Draw selected unit stuff
      if (selectedType == "unit" && globalThis.selectedUnit) {
        // Draw circle to show that unit is selected
        drawCircleUnderTarget(globalThis.selectedUnit, underworld, 1.0, planningViewGraphics);
        // Draws the unit's graphics, and the graphics of any relevant modifiers
        // I.E. attack range and bloat radius
        Unit.drawSelectedGraphics(globalThis.selectedUnit, false, underworld);
      }

      // Draw selected pickup stuff
      if (selectedType == "pickup" && globalThis.selectedPickup) {
        // Draw circle to show that pickup is selected
        drawCircleUnderTarget(globalThis.selectedPickup, underworld, 1.0, planningViewGraphics);
      }
    }

    // Draw a circle under the feet of the player whos current turn it is
    if (underworld) {
      // Update tooltip for whatever is being hovered
      updateTooltipContent(underworld);
      if (globalThis.player && globalThis.player.isSpawned && !inPortal(globalThis.player)) {
        // Only draw circle if player isn't moving to avoid UI thrashing
        // Gold circle under player feet
        if (equal(lastSpotCurrentPlayerTurnCircle, globalThis.player.unit)) {
          const fill = underworld.isMyTurn() ? 0xffde5e : 0xdddddd;
          drawCircleUnderTarget(globalThis.player.unit, underworld, 1.0, planningViewGraphics, fill);
        }
        lastSpotCurrentPlayerTurnCircle = clone(globalThis.player.unit);
      }
    }

    // Draw warnings
    if (mouseLabelText && globalThis.player) {
      const text = Array.from(warnings).map(i18n).join('\n');
      mouseLabelText.text = text;
      mouseLabelText.style.fill = colors.errorRed;

      mouseLabelText.style.align = 'center';
      const labelPosition = withinCameraBounds({ x: mouseTarget.x, y: mouseTarget.y - mouseLabelText.height / 2 - 20 }, mouseLabelText.width / 2, mouseLabelText.height / 2);
      mouseLabelText.x = labelPosition.x;
      mouseLabelText.y = labelPosition.y;
      if (currentlyWarningOutOfRange) {
        globalThis.unitOverlayGraphics.lineStyle(3, colors.errorRed, 1.0);
        globalThis.unitOverlayGraphics.drawCircle(
          globalThis.player.unit.x,
          globalThis.player.unit.y,
          globalThis.player.unit.attackRange
        );
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
  if (currentPlayerPath[0]) {
    const turnStopPoints = pointsEveryXDistanceAlongPath(globalThis.player.unit, currentPlayerPath, globalThis.player.unit.staminaMax, globalThis.player.unit.staminaMax - globalThis.player.unit.stamina);
    globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
    // Use this similarTriangles calculation to make the line pretty so it doesn't originate from the exact center of the
    // other player but from the edge instead
    const startPoint = math.distance(globalThis.player.unit, currentPlayerPath[0]) <= config.COLLISION_MESH_RADIUS
      ? currentPlayerPath[0]
      : Vec.subtract(globalThis.player.unit, math.similarTriangles(globalThis.player.unit.x - currentPlayerPath[0].x, globalThis.player.unit.y - currentPlayerPath[0].y, math.distance(globalThis.player.unit, currentPlayerPath[0]), config.COLLISION_MESH_RADIUS));
    globalThis.walkPathGraphics?.moveTo(startPoint.x, startPoint.y);

    let lastPoint: Vec2 = globalThis.player.unit;
    let distanceCovered = 0;
    // Default to current unit position, in the event that they have no stamina this will be the point
    // at which they are out of stamina.  If they do have stamina it will be reassigned later
    let lastStaminaPoint: Vec2 = globalThis.player.unit;
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
          lastStaminaPoint = point;
          if (distanceCovered + thisLineDistance > distanceLeftToMove) {
            // Draw up to the firstStop with the stamina color
            lastStaminaPoint = getCoordsAtDistanceTowardsTarget(lastPoint, point, distanceLeftToMove - distanceCovered);
            globalThis.walkPathGraphics?.lineTo(lastStaminaPoint.x, lastStaminaPoint.y);
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
    drawCastRangeCircle(lastStaminaPoint, globalThis.player.unit.attackRange, globalThis.walkPathGraphics, 'Potential Cast Range');
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
    drawUICircle(graphics, point, range, colors.attackRangeAlly, text);
  }
}
export function clearTints(underworld: Underworld) {
  // Reset tints before setting new tints to show targeting
  underworld.units.forEach(unit => {
    if (unit.image) {
      unit.image.sprite.tint = 0xFFFFFF;
      Unit.updateAccessibilityOutline(unit, false);
    }
  });
  underworld.pickups.forEach(pickup => {
    if (pickup.image) {
      // @ts-ignore: Special property to keep the tint of portals
      // it may be undefined, in which case we revert to no tint
      pickup.image.sprite.tint = pickup.image.sprite.keepTint || 0xFFFFFF;
    }
  });
}
function updatePredictionGlow(graphics: PIXI.Graphics | undefined, outOfRange: boolean) {
  if (graphics) {
    const glowFilter = (graphics.filters || [])[0];
    if (glowFilter) {
      // @ts-ignore
      glowFilter.outerStrength = outOfRange ? 0 : config.predictionGlowStrength;
    }
  }

}

// Returns true if castCards has effect
async function showCastCardsPrediction(underworld: Underworld, target: Vec2, casterUnit: Unit.IUnit, cardIds: string[], outOfRange: boolean): Promise<boolean> {
  if (keyDown.showWalkRope) {
    // Do not show castCards prediction if the player is also viewing walkRope
    return Promise.resolve(false);
  }
  if (globalThis.player) {
    // Note: setPredictionGraphicsLineStyle must be called before castCards (because castCards may use it
    // to draw predictions) and after clearSpellEffectProjection, which clears predictionGraphics.

    // Handle out of range colors for prediction graphics
    [globalThis.predictionGraphicsBlue, globalThis.predictionGraphicsGreen, globalThis.predictionGraphicsWhite].forEach(g => updatePredictionGlow(g, outOfRange));

    const effectState = await underworld.castCards({
      // Make a copy of cardUsageCounts for prediction so it can accurately
      // calculate mana for multiple copies of one spell in one cast
      casterCardUsage: JSON.parse(JSON.stringify(globalThis.player.cardUsageCounts)),
      casterUnit,
      casterPositionAtTimeOfCast: Vec.clone(casterUnit),
      cardIds,
      castLocation: target,
      prediction: true,
      outOfRange,
      magicColor: undefined,
      casterPlayer: globalThis.player,
    });
    // Clears unit tints in preparation for setting new tints to symbolize which units are targeted by spell
    clearTints(underworld);
    // Show pickups as targeted with tint
    for (let targetedPickup of effectState.targetedPickups) {
      // Convert prediction pickup's associated real pickup
      const realPickup = targetedPickup.real || targetedPickup;
      // don't change tint if HUD is hidden
      if (realPickup && realPickup.image && !globalThis.isHUDHidden) {
        if (outOfRange) {
          realPickup.image.sprite.tint = 0xaaaaaa;
        } else {
          realPickup.image.sprite.tint = 0xff5555;
        }
      }
    }
    // Show units as targeted with tint
    for (let targetedUnit of effectState.targetedUnits) {
      // Convert prediction unit's associated real unit
      const realUnit = targetedUnit.real || targetedUnit;
      // don't change tint if HUD is hidden
      if (realUnit && realUnit.image && !globalThis.isHUDHidden) {
        Unit.updateAccessibilityOutline(realUnit, true, outOfRange);
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
    return effectState.targetedUnits.length > 0 || effectState.targetedPickups.length > 0;
  }
  return false;
}
export function drawHealthBarAboveHead(unitIndex: number, underworld: Underworld, zoom: number) {
  if (globalThis.isHealthbarsHidden) {
    return;
  }
  const u = underworld.units[unitIndex];
  if (u) {
    if (u.unitSubType === UnitSubType.DOODAD) {
      // Don't draw healthbars for Doodads
      return;
    }
    const predictionUnit = u.predictionCopy;
    // Draw unit overlay graphics
    //--
    // Prevent drawing unit overlay graphics when a unit is in the portal
    if (u.x !== null && u.y !== null && u.alive && predictionUnit && !predictionUnit.flaggedForRemoval && !globalThis.isHUDHidden && globalThis.unitOverlayGraphics) {
      const skipDrawingHealthBar = !globalThis.alwaysDrawHealthBars && globalThis.selectedUnit !== u && u.faction != Faction.ALLY && predictionUnit.healthMax == predictionUnit.health;
      // Only show health and mana bars only for allies, damaged units, selected units
      // This makes the screen much less cluttered with many units
      if (skipDrawingHealthBar) {
        return;
      }
      // Draw base health bar
      const healthBarColor = u.faction == Faction.ALLY ? colors.healthAllyGreen : colors.healthRed;
      const healthBarHurtColor = u.faction == Faction.ALLY ? colors.healthAllyDarkGreen : colors.healthDarkRed;
      const healthBarHealColor = u.faction == Faction.ALLY ? colors.healthAllyBrightGreen : colors.healthBrightRed;

      const healthBarMax = predictionUnit.healthMax || 1;
      //background
      let healthBarFill = getFillRect(u, 0, healthBarMax, 0, healthBarMax, zoom);
      globalThis.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
      globalThis.unitOverlayGraphics.beginFill(0x111111, 0.8);
      globalThis.unitOverlayGraphics.drawRect(
        healthBarFill.x,
        // Stack the health bar above the mana bar
        healthBarFill.y - healthBarFill.height,
        healthBarFill.width,
        healthBarFill.height
      );
      //current health
      healthBarFill = getFillRect(u, 0, healthBarMax, 0, u.health, zoom);
      globalThis.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
      globalThis.unitOverlayGraphics.beginFill(healthBarColor, 1.0);
      globalThis.unitOverlayGraphics.drawRect(
        healthBarFill.x,
        // Stack the health bar above the mana bar
        healthBarFill.y - healthBarFill.height,
        healthBarFill.width,
        healthBarFill.height
      );

      // Only show health bar predictions on PlayerTurns, while players are able
      // to cast, otherwise it will show out of sync when NPCs do damage
      if (underworld.turn_phase == turn_phase.PlayerTurns && globalThis.unitOverlayGraphics) {
        // Show how the health bar changes
        if (predictionUnit) {
          const healthAfterPrediction = predictionUnit.health;
          if (healthAfterPrediction < u.health) {
            globalThis.unitOverlayGraphics.beginFill(healthBarHurtColor, 1.0);
          }
          else {
            globalThis.unitOverlayGraphics.beginFill(healthBarHealColor, 1.0);
          }

          healthBarFill = getFillRect(u, 0, healthBarMax, u.health, healthAfterPrediction, zoom);
          globalThis.unitOverlayGraphics.drawRect(
            healthBarFill.x,
            // Stack the health bar above the mana bar
            healthBarFill.y - healthBarFill.height,
            healthBarFill.width,
            healthBarFill.height);

          // Display a death marker if a unit is currently alive, but wont be after cast
          if (u.alive && !predictionUnit.alive) {
            if (globalThis.player && u.faction === globalThis.player.unit.faction) {
              drawUnitMarker('badgeDeathAlly.png', u, u.image?.sprite.scale.y, 2)
            }
            else {
              drawUnitMarker('badgeDeath.png', u, u.image?.sprite.scale.y, 1.5)
            }
          }
        }
      }

      // draw suffocate bar over hp
      if (predictionUnit?.modifiers[suffocateCardId]) {
        const buildup = getSuffocateBuildup(predictionUnit);

        healthBarFill = getFillRect(u, 0, healthBarMax, 0, buildup, zoom);
        globalThis.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
        globalThis.unitOverlayGraphics.beginFill(0x440088, 1);
        globalThis.unitOverlayGraphics.drawRect(
          healthBarFill.x,
          // Stack the health bar over hp
          healthBarFill.y - healthBarFill.height,
          healthBarFill.width,
          healthBarFill.height
        );
      }

      // Draw base mana bar
      const manaBarMax = predictionUnit.manaMax || 1;

      //background for mana using units
      let manaBarProps = getFillRect(u, 0, manaBarMax, 0, manaBarMax, zoom);
      if (u.manaMax > 0) {
        globalThis.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
        globalThis.unitOverlayGraphics.beginFill(0x111111, 0.8);
        globalThis.unitOverlayGraphics.drawRect(
          manaBarProps.x,
          manaBarProps.y,
          manaBarProps.width,
          manaBarProps.height
        );
      }
      //current mana
      manaBarProps = getFillRect(u, 0, manaBarMax, 0, u.mana, zoom);
      globalThis.unitOverlayGraphics.lineStyle(0, 0x000000, 1.0);
      globalThis.unitOverlayGraphics.beginFill(colors.manaBlue, 1.0);
      globalThis.unitOverlayGraphics.drawRect(
        manaBarProps.x,
        manaBarProps.y,
        manaBarProps.width,
        manaBarProps.height
      );

      if (underworld.turn_phase == turn_phase.PlayerTurns && globalThis.unitOverlayGraphics) {
        // Show mana bar prediction
        if (predictionUnit) {
          const manaAfterPrediction = predictionUnit.mana;
          if (manaAfterPrediction < u.mana) {
            globalThis.unitOverlayGraphics.beginFill(colors.manaDarkBlue, 1.0);
          }
          else {
            globalThis.unitOverlayGraphics.beginFill(colors.manaBrightBlue, 1.0);
          }

          let fillRect = getFillRect(u, 0, manaBarMax, u.mana, manaAfterPrediction, zoom);
          globalThis.unitOverlayGraphics.drawRect(
            fillRect.x,
            fillRect.y,
            fillRect.width,
            fillRect.height);
        }
      }

      globalThis.unitOverlayGraphics.endFill();
    }
  }
}

export function getFillRect(unit: Unit.IUnit, min: number, max: number, value1: number, value2: number, zoom: number): { x: number, y: number, width: number, height: number } {
  const start01 = Math.max(0, Math.min(value1 / (min + max), 1))
  const end01 = Math.max(0, Math.min(value2 / (min + max), 1))

  const widthAdjusted = config.UNIT_UI_BAR_WIDTH / zoom;
  const fillWidth = widthAdjusted * Math.abs(end01 - start01);
  const height = config.UNIT_UI_BAR_HEIGHT / zoom;

  let HEALTH_BAR_UI_Y_POS = config.HEALTH_BAR_UI_Y_POS;
  if (unit.unitSourceId == ANCIENT_UNIT_ID) {
    HEALTH_BAR_UI_Y_POS /= 2;
  }

  return {
    x: unit.x - widthAdjusted / 2 + Math.min(start01, end01) * widthAdjusted,
    // - height so that bar stays in the same position relative to the unit
    // regardless of zoom
    // - HEALTH_BAR_UI_Y_POS so that it renders above their head instead of
    // on their center point
    y: unit.y - HEALTH_BAR_UI_Y_POS * (unit.image?.sprite.scale.y || 1) - height,
    width: fillWidth,
    height,
  }
}

export function drawUnitMarker(imagePath: string, pos: Vec2, unitYScale: number = 1, extraMarkerScale: number = 1) {
  if (globalThis.isAttentionMarkersHidden) {
    return;
  }
  const zoom = getCamera().zoom;
  // 1/zoom keeps the attention marker the same size regardless of the level of zoom
  // Math.sin makes the attention marker swell and shink so it grabs the player's attention
  // + 1 makes it go from 0 to 2 instead of -1 to 1
  // / 8 limits the change in size
  const markerScale = ((1 / zoom) + (Math.sin(Date.now() / 500) + 1) / 8) * extraMarkerScale;
  const markerHeightHalf = 16 * markerScale;
  const markerMarginAboveHealthBar = 10;

  // Offset marker just above the head of the unit, where pos = unit positon
  const markerPosition = withinCameraBounds({
    x: pos.x, y: pos.y
      - config.HEALTH_BAR_UI_Y_POS * unitYScale
      - config.UNIT_UI_BAR_HEIGHT / zoom
      - markerHeightHalf
      - markerMarginAboveHealthBar / zoom
  }, markerHeightHalf, markerHeightHalf);

  ImmediateMode.draw(imagePath, markerPosition, markerScale);
}

globalThis.currentPredictionId = 0;

// Wraps _runPredictions in a check to make sure it isn't called again
// before finishing
let runPredictionsPromise: Promise<void> | undefined;
// A `vital` runPredictions call must trigger and cannot be aborted, so if there is another prediction already running it will
// wait for it to finish and then start itself.
export async function runPredictions(underworld: Underworld, vital?: boolean) {
  if (runPredictionsPromise) {
    // Just await the runPrediction thats already running instead of starting a new one which can cause serious issues
    // by operating on shared state.
    await runPredictionsPromise;
    if (!vital) {
      console.log('Aborting non-vital runPredictions call because another is already running.');
      return;
    }
  }
  runPredictionsPromise = _runPredictions(underworld);
  await runPredictionsPromise;
  // set to undefined once finished so that runPredictions can be triggered again
  runPredictionsPromise = undefined;
}
// runPredictions predicts what will happen next turn
// via enemy attention markers (showing if they will hurt you)
// your health and mana bar (the stripes)
// and enemy health and mana bars
// Note: if the player's health or mana or stamina has JUST
// changed before you invoke this function, you should also call
// underworld.syncPlayerPredictionUnitOnly() and then this function
// to update the attribute bars.  syncPlayerPredictionUnitOnly isn't
// automatically invoked in this function, because sometimes
// it is critical that the prediction player's attributes
// are different than the players (for example, when showing
// "50 Mana Remaining" when running a spell prediction). Syncing
// the prediction player with the player brings the prediction player's
// attributes in sync with the players, so for example after the player
// takes damage is when syncPlayerPredictionunitOnly should be called
// prior to runPredictions()
export async function _runPredictions(underworld: Underworld) {
  if (globalThis.view !== View.Game) {
    return;
  }
  // TODO: Future enhancement: If runPredictions is allowed to run
  // while spells are animating you could set up and cast your next spell
  // visually while the other is still animating.  The issue is that
  // if you don't return here it won't properly clear animating graphics
  // objects
  if (globalThis.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  if (!underworld) {
    return;
  }
  if (exists(globalThis.currentPredictionId)) {
    globalThis.currentPredictionId++;
  }
  const startTime = performance.now();
  const mousePos = underworld.getMousePos();
  // Queue mousePosition from the start of runPredictions so that when
  // runPredictions is successful it can be saved to
  // check if castLocation is different from last successful runPredictions
  globalThis._queueLastPredictionMousePos = mousePos;
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection(underworld);

  // only show hover target when it's the correct turn phase
  if (underworld.turn_phase == turn_phase.PlayerTurns) {
    if (globalThis.player) {
      underworld.syncPredictionEntities();
      // Dry run cast so the user can see what effect it's going to have
      const target = mousePos;
      const casterUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id)
      if (!casterUnit) {
        if (underworld.unitsPrediction.length) {
          console.error('Critical Error, caster unit not found');
        } else {
          // unitsPrediction is empty, this can happen after a load()
        }
        return;
      }
      const cardIds = CardUI.getSelectedCardIds();
      let outOfRange = false;
      if (cardIds.length) {
        outOfRange = isOutOfRange(globalThis.player, target, underworld, cardIds);
        await showCastCardsPrediction(underworld, target, casterUnit, cardIds, outOfRange);
      } else {
        // If there are no cards ready to cast, clear unit tints (which symbolize units that are targeted by the active spell)
        clearTints(underworld);
      }
      // Send this client's intentions to the other clients so they can see what they're thinking
      underworld.sendPlayerThinking({ target, cardIds })

      // draw spell predictions
      // Modify and draw all of the stored predictions
      // If out of range, set color to grey
      if (globalThis.predictionGraphicsGreen && !globalThis.isHUDHidden) {
        for (let { points, color, text } of predictionPolys) {
          const colorOverride = outOfRange ? colors.outOfRangeGrey : color;
          drawUIPoly(globalThis.predictionGraphicsGreen, points, colorOverride, text);
        }
        for (let { target, color, radius, startArc, endArc, text } of predictionCones) {
          const colorOverride = outOfRange ? colors.outOfRangeGrey : color;
          drawUICone(globalThis.predictionGraphicsGreen, target, radius, startArc, endArc, colorOverride);
        }
        for (let { target, color, radius, text } of predictionCircles) {
          const colorOverride = outOfRange ? colors.outOfRangeGrey : 0xffffff;
          if (globalThis.predictionGraphicsRed && color == colors.healthRed) {
            drawUICircle(globalThis.predictionGraphicsRed, target, radius, colorOverride, text);
          } else {
            drawUICircle(globalThis.predictionGraphicsGreen, target, radius, colorOverride, text);
          }
        }
      }
      if (globalThis.radiusGraphics) {
        for (let { target, color, radius, text } of predictionCirclesFill) {
          //const colorOverride = currentlyWarningOutOfRange ? colors.outOfRangeGrey : color;
          drawUICircleFill(globalThis.radiusGraphics, target, radius, color, text);
        }
      }

      predictAIActions(underworld, true);

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
      Unit.syncPlayerHealthManaUI(underworld);
    }
  }
  if (globalThis.runPredictionsPanel) {
    globalThis.runPredictionsPanel.update(performance.now() - startTime, 300);
  }
}

// predictAIActions is expensive due to `getStartTargets`
// the way to optimize this is to have it run on gameloop,
// but only to process a few units (a chunk) at a time
// and it restarts explicitly when something changes.
export function predictAIActions(underworld: Underworld, restartChunks: boolean) {
  // Optimization: if predictAIActions is invoked with restartChunks, but
  // it is still processing, exit early so it will keep processing until finished.
  // This ensures the attentionMarkers don't just render the first chunk over and over
  if (restartChunks && globalThis.currentChunk! > 0) {
    // Don't restart until previous is finished processing
    return;
  }
  // If all chunks have finished processing but we're not starting processing over,
  // abort.
  if (!restartChunks && globalThis.currentChunk === -1) {
    // Done but not restarting
    return;
  }
  const aiUnits = underworld.unitsPrediction.filter(u => u.unitType == UnitType.AI);
  // Careful when making enemy predictions:
  // Ally turn happens before Enemy turn, and some effects
  // like bloat may not be easy to factor into predictions
  // Issue: https://github.com/jdoleary/Spellmasons/issues/388

  // TODO - Run turn start events for units that will run it?
  //Unit.startTurnForUnits(aiUnits, underworld, true, faction);

  // We want to draw attention markers above enemies
  // who plan to attack the player next turn.
  // This prediction is not perfect, and does not factor in:
  // Allies, Bloat/Effects, Debilitate/Damage Modifiers
  // So may sometimes lead to false positives/negatives

  // Optimized: This function is FPS heavy.  See "chunks" / "chunking strategy"
  let cachedTargets = underworld.getSmartTargets(aiUnits, restartChunks);

  for (let u of aiUnits) {
    const unitSource = allUnits[u.unitSourceId];
    const thisUnitsCachedTargets = cachedTargets[u.id];
    if (unitSource && thisUnitsCachedTargets) {
      const { targets, canAttack } = thisUnitsCachedTargets;
      const pos = clone(u);
      // Exception: Ancients are short,
      // draw their attention marker lower
      if (u.unitSourceId == ANCIENT_UNIT_ID) {
        pos.y += config.HEALTH_BAR_UI_Y_POS / 2;
      }
      if (u.unitSubType == UnitSubType.SUPPORT_CLASS || u.unitSubType == UnitSubType.GORU_BOSS) {
        // Draw attention marker over any support unit who is taking an action
        if (targets.length) {
          // use u.predictionScale here since we are dealing with prediction units
          // prediction units don't have images, and thus sprite.scale.y
          u.attentionMarker = { imagePath: Unit.subTypeToAttentionMarkerImage(u), pos, unitSpriteScaleY: u.predictionScale || 1, markerScale: 1 };
        } else {
          delete u.attentionMarker;
        }
      }
      else {
        // Draw attention marker over any unit who is attacking this player
        if (globalThis.player && targets.includes(globalThis.player.unit) && canAttack) {
          // use u.predictionScale here since we are dealing with prediction units
          // prediction units don't have images, and thus sprite.scale.y
          u.attentionMarker = { imagePath: Unit.subTypeToAttentionMarkerImage(u), pos, unitSpriteScaleY: u.predictionScale || 1, markerScale: 1 };
        } else {
          delete u.attentionMarker;
        }
      }
    }
  }

}

// SpellEffectProjection are images to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection(underworld: Underworld, forceClear?: boolean) {
  if (!globalThis.animatingSpells || forceClear) {
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
    }
    if (globalThis.predictionGraphicsRed) {
      globalThis.predictionGraphicsRed.clear();
    }
    if (globalThis.predictionGraphicsWhite) {
      globalThis.predictionGraphicsWhite.clear();
    }
    if (globalThis.predictionGraphicsBlue) {
      globalThis.predictionGraphicsBlue.clear();
    }
    if (globalThis.radiusGraphics) {
      globalThis.radiusGraphics.clear();
    }
    if (containerSpells) {
      containerSpells.removeChildren();
    }

    clearWarnings();
    predictionPolys = [];
    predictionCones = [];
    predictionCircles = [];
    predictionCirclesFill = [];
  }
}

export function drawPredictionLine(start: Vec2, end: Vec2) {
  if (predictionGraphicsGreen && !globalThis.isHUDHidden) {
    predictionGraphicsGreen.lineStyle(2, 0xffffff, 1.0);
    predictionGraphicsGreen.moveTo(start.x, start.y);
    predictionGraphicsGreen.lineTo(end.x, end.y);
  }
}

let predictionPolys: { points: Vec2[], color: number, text?: string }[] = [];
let predictionCones: { target: Vec2, radius: number, startArc: number, endArc: number, color: number, text?: string }[] = [];
let predictionCircles: { target: Vec2, radius: number, color: number, text?: string }[] = [];
let predictionCirclesFill: { target: Vec2, radius: number, color: number, text?: string }[] = [];
export function drawUIPoly(graphics: PIXI.Graphics, points: Vec2[], color: number, text?: string) {
  graphics.lineStyle(2, color, 1.0)
  graphics.endFill();
  graphics.drawPolygon(points as PIXI.Point[]);
}
export function drawUICone(graphics: PIXI.Graphics, target: Vec2, radius: number, startArc: number, endArc: number, color: number) {
  graphics.lineStyle(2, color, 1.0)
  graphics.endFill();
  // Note: endAngle corresponds to startArc and startAngle corresponds to endArc because
  // how pixi.js draws arcs is opposite to how I think of angles (going counterclockwise)
  graphics.arc(target.x, target.y, radius, endArc, startArc);
  graphics.moveTo(target.x, target.y);
  const startArcPoint = math.getPosAtAngleAndDistance(target, startArc, radius);
  graphics.lineTo(startArcPoint.x, startArcPoint.y);
  graphics.moveTo(target.x, target.y);
  const endArcPoint = math.getPosAtAngleAndDistance(target, endArc, radius);
  graphics.lineTo(endArcPoint.x, endArcPoint.y);
}
export function drawUICircle(graphics: PIXI.Graphics, target: Vec2, radius: number, color: number, text?: string) {
  graphics.lineStyle(2, color, 1.0)
  graphics.endFill();
  graphics.drawCircle(target.x, target.y, radius);
  if (text && labelText) {
    //labelText.style.fill = color;
    labelText.text = text;
    const labelPosition = withinCameraBounds({ x: target.x, y: target.y + radius + labelText.height / 2 }, labelText.width / 2, labelText.height / 2);
    labelText.x = labelPosition.x;
    labelText.y = labelPosition.y;
  }
}
export function drawUICircleFill(graphics: PIXI.Graphics, target: Vec2, radius: number, color: number, text?: string) {
  graphics.lineStyle(1, 0x000000, 0.0);
  graphics.beginFill(color, 1.0);
  graphics.drawCircle(target.x, target.y, radius);
  graphics.endFill();
  if (text && labelText) {
    //labelText.style.fill = color;
    labelText.text = text;
    const labelPosition = withinCameraBounds({ x: target.x, y: target.y + radius + labelText.height / 2 }, labelText.width / 2, labelText.height / 2);
    labelText.x = labelPosition.x;
    labelText.y = labelPosition.y;
  }
}
export function drawUIPolyPrediction(points: Vec2[], color: number, text?: string) {
  // Note: The actual drawing now happens inside of runPredictions
  // clone target so it's not a reference, it should draw what the value was when it was passed into this function
  predictionPolys.push({ points: points.map(Vec.clone), color, text });
}
export function drawUIConePrediction(target: Vec2, radius: number, startArc: number, endArc: number, color: number, text?: string) {
  // Note: The actual drawing now happens inside of runPredictions
  // clone target so it's not a reference, it should draw what the value was when it was passed into this function
  predictionCones.push({ target: Vec.clone(target), radius, startArc, endArc, color, text });
}
export function drawUICirclePrediction(target: Vec2, radius: number, color: number, text?: string) {
  // Note: The actual drawing now happens inside of runPredictions
  // clone target so it's not a reference, it should draw what the value was when it was passed into this function
  predictionCircles.push({ target: Vec.clone(target), radius, color, text });
}
export function drawUICircleFillPrediction(target: Vec2, radius: number, color: number, text?: string) {
  // Note: The actual drawing now happens inside of runPredictions
  // clone target so it's not a reference, it should draw what the value was when it was passed into this function
  predictionCirclesFill.push({ target: Vec.clone(target), radius, color, text });
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
const elInspectorTooltipImage: HTMLImageElement | undefined = document.getElementById(
  'inspector-tooltip-img',
) as HTMLImageElement | undefined;

let selectedType: "unit" | "pickup" | "obstacle" | null = null;
export function updateTooltipContent(underworld: Underworld) {
  if (
    !(
      elInspectorTooltipContent &&
      elInspectorTooltip &&
      elInspectorTooltipContainer &&
      elInspectorTooltipImage
    )
  ) {
    console.error("Tooltip elements failed to initialize")
    return;
  }
  // Update information in content
  // show info on unit, pickup, etc clicked
  let text = '';
  let description = '';
  let skipDescription = false;
  switch (selectedType) {
    case "unit":
      let playerSpecificInfo = '';
      if (globalThis.selectedUnit) {
        if (globalThis.selectedUnit.unitType === UnitType.PLAYER_CONTROLLED) {
          const player = underworld.players.find((p) => p.unit === globalThis.selectedUnit);
          if (player) {
            if (player.wizardType != 'Spellmason') {
              skipDescription = true;
            }
            const replacedCards = Cards.getCardsFromIds(player.inventory).flatMap(card => card.replaces || []);
            const inventory = player.inventory
              // .filter: Hide replaced cards in inventory
              .filter(cardId => !replacedCards.includes(cardId));

            playerSpecificInfo = '';
            playerSpecificInfo += `<br/>${i18n('Level')} ${underworld.cardDropsDropped}</div>`;
            const lastLevelKills = underworld.calculateKillsNeededForLevel(underworld.cardDropsDropped);
            const nextLevelKills = underworld.getNumberOfEnemyKillsNeededForNextLevelUp();
            const expDenominator = nextLevelKills - lastLevelKills;
            const expNumerator = underworld.enemiesKilled - lastLevelKills;
            playerSpecificInfo += `<br/>${i18n('Experience')} ${expNumerator}/${expDenominator}<div><progress id="experience-bar" max="${expDenominator}" value="${expNumerator}"></progress></div>`;

            playerSpecificInfo +=
              `<h3>${i18n('Spells')}</h3>` +
              inventory.filter(x => x !== '').map(x => i18n(x)).join(', ');

          } else {
            console.error('Tooltip: globalThis.selectedUnit is player controlled but does not exist in underworld.players array.');
            globalThis.selectedUnit = undefined;
            break;
          }
        }
        const unitSource = allUnits[globalThis.selectedUnit.unitSourceId]
        if (unitSource) {
          if (!skipDescription) {
            description = i18n(unitSource.info.description)
          }
          const imageSrc = Unit.getExplainPathForUnitId(unitSource.id);
          if (!elInspectorTooltipImage.src.endsWith(imageSrc)) {
            // Only show tooltip images if gore is allowed since they contain gore
            if (!globalThis.noGore) {
              elInspectorTooltipImage.src = imageSrc;
            }
            elInspectorTooltipImage.onerror = e => {
              elInspectorTooltipImage.style.display = 'none';
              elInspectorTooltipImage.dataset.errorSrc = imageSrc;
            }
          }
          if (imageSrc !== elInspectorTooltipImage.dataset.errorSrc) {
            // on error image is hidden so set it back to block whenever it is changed.
            // the onError handler prevents the broken image icon from showing
            elInspectorTooltipImage.style.display = "block";
          }
          // Turns decimals into UI friendly numbers
          function txt(attribute: number): number {
            // We use ceil so 0.3 health doesn't display as 0 health
            return Math.ceil(attribute);
          }

          const extraText = `
${modifiersToText(globalThis.selectedUnit)}
${globalThis.selectedUnit.manaCostToCast && globalThis.selectedUnit.manaCostToCast > 0 ? `${i18n('mana cost to cast')}: ${globalThis.selectedUnit.manaCostToCast}` : ''}
          `.trim();
          // NOTE: globalThis.selectedUnit.name is NOT localized on purpose
          // because those are user provided names
          // Use this to debug strength when developing, but strength isn't relevant to players `💪 ${globalThis.selectedUnit.strength} Strength`
          text += `\
<h1>${globalThis.selectedUnit.name ? globalThis.selectedUnit.name.split(' ').map(name => i18n(name)).join(' ') : i18n(unitSource.id)}</h1>
${description ? `
<hr/>
<div>${description}</div>
  `: ''}
<hr/>
${globalThis.selectedUnit.faction == Faction.ALLY ? '🤝' : '⚔️️'} ${i18n((Faction[globalThis.selectedUnit.faction] || '').toString())} ${globalThis.selectedUnit.unitType !== UnitType.PLAYER_CONTROLLED ? `
🗡️ ${txt(globalThis.selectedUnit.damage)} ${i18n(['damage'])}` : ''}${globalThis.selectedUnit.unitSubType !== UnitSubType.MELEE ? `
🎯 ${txt(globalThis.selectedUnit.attackRange)} ${i18n(['attack range'])}` : ''}
❤️ ${txt(globalThis.selectedUnit.health)}/${txt(globalThis.selectedUnit.healthMax)} ${i18n(['health capacity'])}
🔵 ${txt(globalThis.selectedUnit.mana)}/${txt(globalThis.selectedUnit.manaMax)} + ${txt(globalThis.selectedUnit.manaPerTurn)} ${i18n('Mana')} ${i18n('per turn')}
⚪ ${txt(globalThis.selectedUnit.soulFragments)} ${i18n('Soul Fragments')}
${extraText}
${playerSpecificInfo}
      `;
        }
      }
      break;
    case "pickup":
      if (globalThis.selectedPickup) {
        // Hide tooltip since pickups don't yet have tooltip images
        elInspectorTooltipImage.style.display = 'none';
        text += `\
<h1>${i18n(globalThis.selectedPickup.name)}</h1>
<hr/>
${i18n(globalThis.selectedPickup.description(globalThis.selectedPickup, underworld))}
<hr/>
      `;
      }
      break;
  }

  elInspectorTooltipContent.innerHTML = text;
  if (text == '') {
    elInspectorTooltipContainer.style.display = "none";
  } else {
    elInspectorTooltipContainer.style.display = "block";

  }
}
export function modifiersToText(selectedUnit: Unit.IUnit): string {
  const { modifiers } = selectedUnit;
  if (Object.keys(modifiers).length === 0) {
    return ''
  }
  let message = '';
  for (let [key, value] of Object.entries(modifiers)) {
    const modifier = Cards.allModifiers[key];
    const modifierInstance = selectedUnit.modifiers[key];
    const thumbnailPath = CardUI.getSpellThumbnailPath(allCards[key]?.thumbnail);
    // Note: Runes do not recieve a 'blessing' nor 'curse' class
    message += `<div class="tooltip-modifier-row"><div class="tooltip-modifier-key ${isRune(modifier) ? '' : value.isCurse ? 'curse' : 'blessing'}">${thumbnailPath ? `<div class="modifier-tooltip-image" style="background-image:url(${thumbnailPath})"></div> ` : ''}${value.tooltip || `${i18n(key)} ${modifier?.probability ? /*Only show quantity for non miniboss modifiers*/'' : value.quantity || ''}`}</div>${modifier?.description ? `<div>${i18n(modifier.description)}</div>` : ''}</div>`
  }
  return `<div class="modifiers">${message}</div>`;

}
export function checkIfNeedToClearTooltip() {
  if (globalThis.selectedUnit && !globalThis.selectedUnit.alive) {
    clearTooltipSelection();
  }
  // Quick hack to check if the pickup has been picked up
  // If so, deselect it
  if (globalThis.selectedPickup && (globalThis.selectedPickup.image && globalThis.selectedPickup.image.sprite.parent === null)) {
    clearTooltipSelection();
  }

}
// return boolean represents if there was a tooltip to clear
export function clearTooltipSelection(): boolean {
  if (selectedType) {
    globalThis.selectedUnit = undefined;
    globalThis.selectedPickup = undefined;
    selectedType = null;
    return true
  } else {
    return false;
  }
}

// A special slightly-modified copy of updateTooltipSelection to be used when
// player is choosing a spawn point but also wants to inspect units or things on
// the game field.
export function updateTooltipSelectionWhileSpawning(mousePos: Vec2, underworld: Underworld) {
  if (player && !player.isSpawned) {

    // Find unit:
    const units = underworld.getUnitsAt(mousePos);
    // Omit the current player unit from the tooltip selection,
    // because the player is currently looking for a spawn point,
    // their self will always be the first unit returned from getUnitsAt
    // and they want to inspect what's under them, not themself
    if (units[0] == player.unit) {
      units.shift();
    }
    const unit = units[0];
    if (unit) {
      globalThis.selectedUnit = unit;
      selectedType = "unit";
      return
    } else {
      globalThis.selectedUnit = undefined;
    }
    const pickup = underworld.getPickupAt(mousePos);
    if (pickup) {
      globalThis.selectedPickup = pickup;
      selectedType = "pickup";
      return
    } else {
      globalThis.selectedPickup = undefined;
    }
    // If nothing was found to select, null-out selectedType
    // deselect
    selectedType = null;
  }
}
export function updateTooltipSelection(mousePos: Vec2, underworld: Underworld) {

  const targetUnit = underworld.getUnitAt(mousePos)
  const pickup = underworld.getPickupAt(mousePos);

  if (targetUnit) {
    globalThis.selectedUnit = targetUnit;
    selectedType = "unit";
    return;
  }
  else if (pickup) {
    globalThis.selectedPickup = pickup;
    selectedType = "pickup";
    return;
  }

  // If nothing was found to select, null-out selectedType and deselect
  globalThis.selectedUnit = undefined;
  globalThis.selectedPickup = undefined;
  selectedType = null;
}

// Draws a faint circle over things that can be clicked on
export function drawCircleUnderTarget(mousePos: Vec2, underworld: Underworld, opacity: number, graphics: PIXI.Graphics | undefined, fill?: number) {
  if (!graphics || globalThis.recordingShorts) {
    return;
  }
  const targetUnit = underworld.getUnitAt(mousePos)
  const target: Vec2 | undefined = targetUnit || underworld.getPickupAt(mousePos);
  if (target) {
    graphics.lineStyle(3, fill || 0xaaaaaa, opacity);
    graphics.beginFill(0x000000, 0);
    // offset ensures the circle is under the player's feet
    // and is dependent on the animation's feet location
    const offsetX = targetUnit ? 0 : 0;
    const offsetY = targetUnit ? targetUnit.UITargetCircleOffsetY : -15;
    const scaleY = targetUnit?.image?.sprite.scale.y || 1;
    graphics.drawEllipse(target.x + offsetX, target.y + config.COLLISION_MESH_RADIUS * scaleY + offsetY * scaleY, Math.abs(targetUnit?.image?.sprite.scale.x || 1) * config.COLLISION_MESH_RADIUS / 2, (targetUnit?.image?.sprite.scale.y || 1) * config.COLLISION_MESH_RADIUS / 3);
    graphics.endFill();
  }
}

let warnings = new Set<string>();
export function addWarningAtMouse(warning: string) {
  if (globalThis.isHUDHidden) {
    return
  }
  warnings.add(warning);
}
export function removeWarningAtMouse(warning: string) {
  warnings.delete(warning);
}
export function clearWarnings() {
  warnings.clear();
}