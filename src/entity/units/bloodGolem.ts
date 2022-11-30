import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { action } from './actions/golemAction';
import * as config from '../../config'
import * as Unit from '../Unit';
import type Underworld from '../../Underworld';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';

const unit: UnitSource = {
  id: 'Blood Golem',
  info: {
    description: 'The blood golem is heaftier and more deadly than it\'s more common bretheren.',
    image: 'units/gruntIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    staminaMax: config.UNIT_BASE_STAMINA * 1.2,
    attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
    manaMax: 0,
    healthMax: 6,
    damage: 5,
    bloodColor: 0x8a2e2e
  },
  spawnParams: {
    probability: 100,
    unavailableUntilLevelIndex: 7,
  },
  animations: {
    idle: 'units/gruntIdle',
    hit: 'units/gruntHit',
    attack: 'units/gruntAttack',
    die: 'units/gruntDeath',
    walk: 'units/gruntWalk',
  },
  sfx: {
    // Golem shares hurt sfx with archer intentionally
    damage: 'archerHurt',
    death: 'golemDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [0x9a7d7d, 0x7089a6], // skin head
            [0x866262, 0x627386], //skinLight
            [0x7c5353, 0x53667c], //skinMedium
            [0x603232, 0x324860], //skinDark
            [0x838d9f, 0x802230], //loin cloth
            [0x583131, 0x1c324b], // mouth opening
          ],
          0.05
        )
      );
    }
  },
  action,
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
