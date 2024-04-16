"use strict";
const {
  Projectile,
  rangedAction,
  commonTypes: commonTypes$g,
  config,
  JPromise,
  JAudio: JAudio$1,
  PixiUtils: PixiUtils$3,
  ParticleCollection: ParticleCollection$1,
  MultiColorReplaceFilter
} = globalThis.SpellmasonsAPI;
const { createVisualLobbingProjectile } = Projectile;
const { getBestRangedLOSTarget, rangedLOSMovement } = rangedAction;
const { UnitSubType } = commonTypes$g;
const { addPixiSpriteAnimated, containerUnits } = PixiUtils$3;
const Unit$e = globalThis.SpellmasonsAPI.Unit;
const ARCHER_ID = "Explosive Archer";
const explosionDamage = 40;
const explosion_radius = 140;
const unit = {
  id: ARCHER_ID,
  info: {
    description: "Shoot explosive arrows",
    image: "units/archerIdle",
    subtype: UnitSubType.RANGED_LOS
  },
  unitProps: {
    attackRange: 500,
    manaMax: 0,
    damage: 10,
    healthMax: 40,
    bloodColor: 4399460
  },
  spawnParams: {
    probability: 50,
    budgetCost: 1,
    unavailableUntilLevelIndex: 7
  },
  animations: {
    idle: "units/archerIdle",
    hit: "units/archerHit",
    attack: "units/archerAttack",
    die: "units/archerDeath",
    walk: "units/archerWalk"
  },
  sfx: {
    damage: "archerHurt",
    death: "archerDeath"
  },
  init: (unit2, _underworld) => {
    if (unit2.image && unit2.image.sprite && unit2.image.sprite.filters) {
      unit2.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [8807010, 5056115],
            //skinLight
            [8147795, 4399460],
            //skinMedium
            [6304306, 2889281],
            //skinDark
            [8621471, 1129823],
            //loin cloth
            [4179906, 1129823]
            // feathers 
          ],
          0.05
        )
      );
    }
  },
  action: async (unit2, attackTargets, underworld, _canAttackTarget) => {
    const attackTarget = attackTargets && attackTargets[0];
    const explosionTargets = attackTargets ? attackTargets.slice(1) : [];
    if (attackTarget) {
      unit2.path = void 0;
      Unit$e.orient(unit2, attackTarget);
      await Unit$e.playComboAnimation(unit2, unit2.animations.attack, () => {
        return createVisualLobbingProjectile(
          unit2,
          attackTarget,
          "projectile/arrow"
        ).then(() => {
          JAudio$1.playSFXKey("explosiveArcherAttack");
          Unit$e.takeDamage({ unit: attackTarget, amount: unit2.damage, fromVec2: unit2, thinBloodLine: true }, underworld, false);
          ParticleCollection$1.makeBloatExplosionWithParticles(attackTarget, 1, false);
          return JPromise.raceTimeout(3e3, "explosive archer push", Promise.all(explosionTargets.map((u) => {
            Unit$e.takeDamage({ unit: u, amount: explosionDamage, fromVec2: attackTarget }, underworld, false);
            return SpellmasonsAPI.forcePushAwayFrom(u, attackTarget, 10, underworld, false);
          })));
        });
      });
    } else {
      await rangedLOSMovement(unit2, underworld);
    }
  },
  getUnitAttackTargets: (unit2, underworld) => {
    const targets = getBestRangedLOSTarget(unit2, underworld);
    const target = targets[0];
    if (target) {
      const explosionTargets = underworld.getUnitsWithinDistanceOfTarget(
        target,
        explosion_radius,
        false
      );
      return [target, ...explosionTargets];
    } else {
      return [];
    }
  }
};
const spike_damage = 80;
const huge_trap = {
  imagePath: "pickups/trap",
  animationSpeed: -config.DEFAULT_ANIMATION_SPEED,
  playerOnly: false,
  name: "Huge Trap",
  probability: 70,
  scale: 1.5,
  description: ["Deals 🍞 to any unit that touches it", spike_damage.toString()],
  willTrigger: ({ unit: unit2 }) => {
    return !!unit2;
  },
  effect: ({ unit: unit2, pickup, prediction, underworld }) => {
    if (unit2) {
      if (!prediction) {
        const animationSprite = addPixiSpriteAnimated("pickups/trapAttack", containerUnits, {
          loop: false,
          animationSpeed: 0.2,
          onComplete: () => {
            if (animationSprite == null ? void 0 : animationSprite.parent) {
              animationSprite.parent.removeChild(animationSprite);
            }
          }
        });
        if (animationSprite) {
          animationSprite.anchor.set(0.5);
          animationSprite.x = pickup.x;
          animationSprite.y = pickup.y;
        }
        const animationSprite2 = addPixiSpriteAnimated("pickups/trapAttackMagic", containerUnits, {
          loop: false,
          animationSpeed: 0.2,
          onComplete: () => {
            if (animationSprite2 == null ? void 0 : animationSprite2.parent) {
              animationSprite2.parent.removeChild(animationSprite2);
            }
          }
        });
        if (animationSprite2) {
          animationSprite2.anchor.set(0.5);
          animationSprite2.x = pickup.x;
          animationSprite2.y = pickup.y;
        }
      }
      Unit$e.takeDamage({ unit: unit2, amount: spike_damage, fromVec2: unit2 }, underworld, prediction);
    }
  }
};
const mod$3 = {
  modName: "Explosive Archer & Big Trap",
  author: "Jordan O'Leary",
  description: "Adds an archer that shoots explosive arrows and a large trap that does more damage.",
  screenshot: "spellmasons-mods/explosive_archer/explosiveArcher.png",
  units: [
    unit
  ],
  pickups: [
    huge_trap
  ],
  sfx: {
    "explosiveArcherAttack": ["./spellmasons-mods/explosive_archer/RPG3_FireMagic_Impact01.mp3"]
  }
};
const {
  PixiUtils: PixiUtils$2,
  rand,
  cardUtils: cardUtils$d,
  commonTypes: commonTypes$f,
  cards: cards$f
} = globalThis.SpellmasonsAPI;
const { randFloat } = rand;
const { refundLastSpell: refundLastSpell$f } = cards$f;
const { containerSpells: containerSpells$1 } = PixiUtils$2;
const Unit$d = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$1, playDefaultSpellSFX: playDefaultSpellSFX$c } = cardUtils$d;
const { CardCategory: CardCategory$f, probabilityMap: probabilityMap$f, CardRarity: CardRarity$f } = commonTypes$f;
const cardId$f = "Undead Blade";
const damageDone$1 = 60;
const animationPath$1 = "spellUndeadBlade";
const delayBetweenAnimationsStart = 400;
const spell$f = {
  card: {
    id: cardId$f,
    category: CardCategory$f.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$f[CardRarity$f.COMMON],
    thumbnail: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
    animationPath: animationPath$1,
    sfx: "hurt",
    description: [`Deals ${damageDone$1} to summoned units and resurrected units only.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !u.originalLife);
      let delayBetweenAnimations = delayBetweenAnimationsStart;
      for (let q = 0; q < quantity; q++) {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$c(card, prediction);
          for (let unit2 of targets) {
            const spellEffectImage = oneOffImage$1(unit2, animationPath$1, containerSpells$1);
            if (spellEffectImage) {
              spellEffectImage.sprite.rotation = randFloat(-Math.PI / 6, Math.PI / 6);
              if (q % 2 == 0) {
                spellEffectImage.sprite.scale.x = -1;
              }
            }
            Unit$d.takeDamage({
              unit: unit2,
              amount: damageDone$1,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
          await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
          delayBetweenAnimations *= 0.8;
          delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
        } else {
          for (let unit2 of targets) {
            Unit$d.takeDamage({
              unit: unit2,
              amount: damageDone$1,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
        }
      }
      if (targets.length == 0) {
        refundLastSpell$f(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const mod$2 = {
  modName: "Undead Blade",
  author: "Jordan O'Leary",
  description: "A spell that does lots of damage to summons and resurrected units",
  screenshot: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
  spells: [
    spell$f
  ],
  // The spritesheet is created with TexturePacker: https://www.codeandweb.com/texturepacker
  spritesheet: "spellmasons-mods/undead_blade/undead_blade.json"
};
const {
  cardUtils: cardUtils$c,
  commonTypes: commonTypes$e,
  cards: cards$e,
  cardsUtil: cardsUtil$6,
  FloatingText: FloatingText$6
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$e } = cards$e;
const Unit$c = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$b } = cardUtils$c;
const { CardCategory: CardCategory$e, probabilityMap: probabilityMap$e, CardRarity: CardRarity$e } = commonTypes$e;
const cardId$e = "Decay";
const spell$e = {
  card: {
    id: cardId$e,
    category: CardCategory$e.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$e[CardRarity$e.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDecay.png",
    sfx: "poison",
    description: [`Causes the target to take damage equal to the number of decay stacks squared at the start of their turn. The target then gains another stack.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$e(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$b(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$c.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$6
  },
  events: {
    onTurnStart: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$e];
      if (modifier && !!Math.pow(modifier.quantity, 2) && !prediction) {
        Unit$c.takeDamage({ unit: unit2, amount: Math.pow(modifier.quantity, 2) }, underworld, prediction);
        FloatingText$6.default({
          coords: unit2,
          text: `${Math.pow(modifier.quantity, 2)} decay damage`,
          style: { fill: "#525863", strokeThickness: 1 }
        });
        modifier.quantity++;
      }
    }
  }
};
function add$6(unit2, _underworld, _prediction, quantity) {
  cardsUtil$6.getOrInitModifier(unit2, cardId$e, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (!unit2.onTurnStartEvents.includes(cardId$e)) {
      unit2.onTurnStartEvents.push(cardId$e);
    }
  });
}
const {
  cardUtils: cardUtils$b,
  commonTypes: commonTypes$d,
  cards: cards$d
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$d } = cards$d;
const Unit$b = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$a } = cardUtils$b;
const { CardCategory: CardCategory$d, probabilityMap: probabilityMap$d, CardRarity: CardRarity$d } = commonTypes$d;
const cardId$d = "Dominate";
const healthThreshhold = 0.25;
const spell$d = {
  card: {
    id: cardId$d,
    category: CardCategory$d.Soul,
    supportQuantity: false,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2.5,
    probability: probabilityMap$d[CardRarity$d.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDominate.png",
    sfx: "suffocate",
    description: [`Converts an enemy to fight for you if they are below ${healthThreshhold * 100}% health.`],
    //Wololo
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && u.health <= u.healthMax * healthThreshhold && u.faction !== state.casterUnit.faction);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$a(card, prediction);
      }
      for (let unit2 of targets) {
        Unit$b.changeFaction(unit2, state.casterUnit.faction);
      }
      if (targets.length == 0) {
        refundLastSpell$d(state, prediction, "No low health targets to convert, mana refunded");
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$a,
  commonTypes: commonTypes$c,
  cards: cards$c,
  cardsUtil: cardsUtil$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$c } = cards$c;
const Unit$a = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$9 } = cardUtils$a;
const { CardCategory: CardCategory$c, probabilityMap: probabilityMap$c, CardRarity: CardRarity$c } = commonTypes$c;
const cardId$c = "Ensnare";
const spell$c = {
  card: {
    id: cardId$c,
    category: CardCategory$c.Curses,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$c[CardRarity$c.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconEnsnare.png",
    sfx: "",
    description: [`Prevents the target from moving for one turn. Furthur casts increase duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$c(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$9(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$a.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$5,
    remove: remove$3
  },
  events: {
    onTurnEnd: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$c];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$a.removeModifier(unit2, cardId$c, underworld);
        }
      }
    }
  }
};
function add$5(unit2, underworld, prediction, quantity) {
  cardsUtil$5.getOrInitModifier(unit2, cardId$c, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit2.staminaMax
  }, () => {
    if (!unit2.onTurnEndEvents.includes(cardId$c)) {
      unit2.onTurnEndEvents.push(cardId$c);
    }
    unit2.stamina = 0;
    unit2.staminaMax = 0;
  });
}
function remove$3(unit2, underworld) {
  if (unit2.modifiers && unit2.modifiers[cardId$c]) {
    const originalStamina = unit2.modifiers[cardId$c].originalstat;
    if (originalStamina && unit2.staminaMax == 0) {
      unit2.staminaMax = originalStamina;
    }
  }
}
const {
  cardUtils: cardUtils$9,
  commonTypes: commonTypes$b,
  cards: cards$b,
  FloatingText: FloatingText$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$b } = cards$b;
globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$8 } = cardUtils$9;
const { CardCategory: CardCategory$b, probabilityMap: probabilityMap$b, CardRarity: CardRarity$b } = commonTypes$b;
const Events = globalThis.SpellmasonsAPI.Events;
const cardId$b = "Fast Forward";
const spell$b = {
  card: {
    id: cardId$b,
    category: CardCategory$b.Soul,
    //Theres no "other" category
    supportQuantity: false,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$b[CardRarity$b.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFastForward.png",
    sfx: "push",
    //TODO
    description: [`Shunt the target forward through time. Causes progression of spell effects but does not affect cooldowns.`],
    //TODO: better deffinition
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$8(card, prediction);
        for (let unit2 of targets) {
          setTimeout(() => {
            FloatingText$5.default({
              coords: unit2,
              text: `Fast Forward`,
              style: { fill: "#ff0000", strokeThickness: 1 }
            });
          }, 200);
          procEvents(unit2, prediction, underworld);
        }
      } else {
        for (let unit2 of targets) {
          procEvents(unit2, prediction, underworld);
        }
      }
      if (targets.length == 0) {
        refundLastSpell$b(state, prediction, "No targets chosen, mana refunded");
      }
      return state;
    }
  }
};
async function procEvents(unit2, prediction, underworld) {
  for (let i = 0; i < unit2.onTurnStartEvents.length; i++) {
    const eventName = unit2.onTurnStartEvents[i];
    if (eventName) {
      const fns = Events.default.onTurnStartSource[eventName];
      if (fns) {
        await fns(unit2, prediction, underworld);
      }
    }
  }
  for (let i = 0; i < unit2.onTurnEndEvents.length; i++) {
    const eventName = unit2.onTurnEndEvents[i];
    if (eventName) {
      const fne = Events.default.onTurnEndSource[eventName];
      if (fne) {
        await fne(unit2, prediction, underworld);
      }
    }
  }
}
const {
  Particles: Particles$3,
  particleEmitter: particleEmitter$1
} = globalThis.SpellmasonsAPI;
function makeFlameStrikeWithParticles(position, prediction, resolver) {
  if (prediction || globalThis.headless) {
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = Particles$3.createParticleTexture();
  if (!texture) {
    Particles$3.logNoTextureWarning("makeFlameStrikeAttack");
    return;
  }
  const config2 = particleEmitter$1.upgradeConfig({
    autoUpdate: true,
    "alpha": {
      "start": 0.425,
      "end": 0.25
    },
    "scale": {
      "start": 1.5,
      "end": 3,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#ebc323",
      "end": "#e63e1c"
    },
    "speed": {
      "start": 400,
      "end": 0,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": -500
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 80,
      "max": 100
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 0.5,
      "max": 1.3
    },
    "blendMode": "normal",
    "frequency": 4e-3,
    "emitterLifetime": 1.2,
    "maxParticles": 230,
    "pos": {
      "x": 0,
      "y": -300
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": -5,
      "y": 180,
      "w": 10,
      "h": 0
    }
  }, [texture]);
  Particles$3.simpleEmitter(position, config2, resolver);
}
const {
  cardUtils: cardUtils$8,
  commonTypes: commonTypes$a,
  PlanningView,
  cards: cards$a
} = globalThis.SpellmasonsAPI;
const { drawUICircle } = PlanningView;
const Unit$9 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$7 } = cardUtils$8;
const { refundLastSpell: refundLastSpell$a } = cards$a;
const { CardCategory: CardCategory$a, probabilityMap: probabilityMap$a, CardRarity: CardRarity$a } = commonTypes$a;
const cardId$a = "FlameStrike";
const damageMain = 40;
const damageSplash = 10;
const splashRadius = 64;
const spell$a = {
  card: {
    id: cardId$a,
    category: CardCategory$a.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$a[CardRarity$a.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFlameStrike.png",
    sfx: "burst",
    description: [`Deals ${damageMain} damage to the target and ${damageSplash} damage to nearby targets in a small area.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise((resolve) => {
        const targets = state.targetedUnits.filter((u) => u.alive);
        const adjustedRadius = getAdjustedRadius(state.aggregator.radiusBoost);
        if (targets.length == 0) {
          refundLastSpell$a(state, prediction);
          resolve();
        }
        for (let unit2 of targets) {
          const explosionTargets = underworld.getUnitsWithinDistanceOfTarget(unit2, adjustedRadius, prediction);
          const quantityAdjustedDamageMain = damageMain * quantity;
          const quantityAdjustedDamageSplash = damageSplash * quantity;
          if (!prediction && !globalThis.headless) {
            playDefaultSpellSFX$7(card, prediction);
            setTimeout(() => {
              explosionTargets.forEach((t) => {
                const damage = t == unit2 ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
                Unit$9.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
              });
              resolve();
            }, 400);
            makeFlameStrikeWithParticles(unit2, prediction);
          } else {
            if (prediction) {
              drawUICircle(globalThis.predictionGraphics, unit2, adjustedRadius, 13981270);
            }
            explosionTargets.forEach((t) => {
              const damage = t == unit2 ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
              Unit$9.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
            });
            resolve();
          }
        }
      });
      return state;
    }
  }
};
function getAdjustedRadius(radiusBoost = 0) {
  return splashRadius * (1 + 0.5 * radiusBoost);
}
const {
  cardUtils: cardUtils$7,
  commonTypes: commonTypes$9,
  cards: cards$9,
  cardsUtil: cardsUtil$4,
  JImage,
  JAudio,
  FloatingText: FloatingText$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$9 } = cards$9;
const Unit$8 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$6 } = cardUtils$7;
const { CardCategory: CardCategory$9, probabilityMap: probabilityMap$9, CardRarity: CardRarity$9 } = commonTypes$9;
const cardId$9 = "Grace";
var healingAmount$1 = -40;
const spell$9 = {
  card: {
    id: cardId$9,
    category: CardCategory$9.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$9[CardRarity$9.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconGrace.png",
    sfx: "purify",
    //TODO
    description: [`Heals the target for ${-healingAmount$1} after 3 turns. Stacks increase the amount, but do not change duration`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$9(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$6(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$8.addModifier(unit2, card.id, underworld, prediction, 0, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$4
  },
  events: {
    onTurnStart: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$9];
      if (modifier) {
        modifier.graceCountdown--;
        updateTooltip$2(unit2);
        if (modifier.graceCountdown <= 0) {
          let healing = calculateGraceHealing(modifier.graceQuantity);
          Unit$8.takeDamage({ unit: unit2, amount: healing }, underworld, prediction);
          if (!prediction) {
            FloatingText$4.default({
              coords: unit2,
              text: `Grace +${-healing} health`,
              style: { fill: "#40a058", strokeThickness: 1 }
            });
            JImage.addOneOffAnimation(unit2, "spell-effects/potionPickup", {}, { animationSpeed: 0.3, loop: false });
            JAudio.playSFXKey("potionPickupHealth");
          }
          Unit$8.removeModifier(unit2, cardId$9, underworld);
        }
      }
    }
  }
};
function add$4(unit2, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$4.getOrInitModifier(unit2, cardId$9, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (!unit2.onTurnStartEvents.includes(cardId$9)) {
      unit2.onTurnStartEvents.push(cardId$9);
    }
  });
  if (!modifier.graceCountdown) {
    modifier.graceCountdown = 3;
  }
  modifier.graceQuantity = (modifier.graceQuantity || 0) + extra.amount;
  if (!prediction) {
    updateTooltip$2(unit2);
  }
}
function updateTooltip$2(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId$9];
  if (modifier) {
    modifier.tooltip = `${modifier.graceCountdown} turns until healed for ${-calculateGraceHealing(modifier.graceQuantity)}`;
  }
}
function calculateGraceHealing(graceQuantity) {
  return graceQuantity * healingAmount$1;
}
const {
  cardUtils: cardUtils$6,
  commonTypes: commonTypes$8,
  cards: cards$8,
  Particles: Particles$2,
  FloatingText: FloatingText$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$8 } = cards$8;
const Unit$7 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$5 } = cardUtils$6;
const { CardCategory: CardCategory$8, probabilityMap: probabilityMap$8, CardRarity: CardRarity$8, UnitType } = commonTypes$8;
const cardId$8 = "Harvest";
const manaRegain = 20;
const spell$8 = {
  card: {
    id: cardId$8,
    category: CardCategory$8.Mana,
    supportQuantity: false,
    manaCost: 0,
    healthCost: 35,
    expenseScaling: 1,
    probability: probabilityMap$8[CardRarity$8.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconHarvest.png",
    sfx: "sacrifice",
    description: [`Consumes target corpse for ${manaRegain} mana. Does not work on player corpses. Unstackable.

Tastes like chicken.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      let totalManaHarvested = 0;
      const targets = state.targetedUnits.filter((u) => !u.alive && u.unitType != UnitType.PLAYER_CONTROLLED && u.flaggedForRemoval != true);
      for (let unit2 of targets) {
        totalManaHarvested += manaRegain * quantity;
        const manaTrailPromises = [];
        if (!prediction) {
          manaTrailPromises.push(Particles$2.makeManaTrail(unit2, state.casterUnit, underworld, "#e4ffee", "#40ff66", targets.length * quantity));
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$5(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$7.cleanup(unit2);
        }
        state.casterUnit.mana += totalManaHarvested;
      });
      if (targets.length == 0 && !totalManaHarvested) {
        refundLastSpell$8(state, prediction, "No corpses, health refunded");
      }
      if (!prediction && !!totalManaHarvested) {
        FloatingText$3.default({
          coords: state.casterUnit,
          text: `${totalManaHarvested} Mana Harvested`,
          style: { fill: "blue", strokeThickness: 1 }
        });
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$5,
  commonTypes: commonTypes$7,
  cards: cards$7,
  cardsUtil: cardsUtil$3,
  FloatingText: FloatingText$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$7 } = cards$7;
const Unit$6 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$4 } = cardUtils$5;
const { CardCategory: CardCategory$7, probabilityMap: probabilityMap$7, CardRarity: CardRarity$7 } = commonTypes$7;
const cardId$7 = "Regenerate";
const spell$7 = {
  card: {
    id: cardId$7,
    category: CardCategory$7.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$7[CardRarity$7.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconRegen.png",
    sfx: "heal",
    //TODO
    description: [`Heals the target for 10 health at the end of their turn for 5 turns. Stacks increase the amount and refresh the duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$7(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$4(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$6.addModifier(unit2, card.id, underworld, prediction, 5, { amount: quantity });
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$3,
    remove: remove$2
  },
  events: {
    onTurnEnd: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$7];
      if (modifier) {
        const healing = healingAmount(modifier.regenCounter);
        Unit$6.takeDamage({ unit: unit2, amount: healing }, underworld, prediction);
        modifier.quantity--;
        if (!prediction) {
          updateTooltip$1(unit2);
          FloatingText$2.default({
            coords: unit2,
            text: `Regenerate +${-healing} health`,
            style: { fill: "#40a058", strokeThickness: 1 }
          });
        }
        if (modifier.quantity <= 0) {
          Unit$6.removeModifier(unit2, cardId$7, underworld);
        }
      }
    }
  }
};
function remove$2(unit2, underworld) {
  const modifier = unit2.modifiers[cardId$7];
  if (modifier) {
    modifier.regenCounter = 0;
  }
}
function add$3(unit2, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$3.getOrInitModifier(unit2, cardId$7, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (!unit2.onTurnEndEvents.includes(cardId$7)) {
      unit2.onTurnEndEvents.push(cardId$7);
    }
  });
  if (modifier.quantity > 5) {
    modifier.quantity = 5;
  }
  if (!prediction) {
    modifier.regenCounter = (modifier.regenCounter || 0) + extra.amount;
    updateTooltip$1(unit2);
  }
}
function healingAmount(castquantity) {
  let healing = -10;
  if (castquantity > 0) {
    healing = castquantity * -10;
  }
  return healing;
}
function updateTooltip$1(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId$7];
  if (modifier) {
    modifier.tooltip = `Healing ${-healingAmount(modifier.regenCounter)} every ${modifier.quantity} turns`;
  }
}
const {
  cardUtils: cardUtils$4,
  commonTypes: commonTypes$6,
  cards: cards$6,
  cardsUtil: cardsUtil$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$6 } = cards$6;
const Unit$5 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$3 } = cardUtils$4;
const { CardCategory: CardCategory$6, probabilityMap: probabilityMap$6, CardRarity: CardRarity$6 } = commonTypes$6;
const cardId$6 = "Pacify";
const spell$6 = {
  card: {
    id: cardId$6,
    category: CardCategory$6.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$6[CardRarity$6.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconPacify.png",
    sfx: "",
    description: [`Prevents the target from attacking for one turn. Stacks increase duration. Does not affect Support Class units such as summoners or priests.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !(u.unitSubType == 3));
      if (targets.length == 0) {
        refundLastSpell$6(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$3(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$5.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$2,
    remove: remove$1
  },
  events: {
    onTurnEnd: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$6];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$5.removeModifier(unit2, cardId$6, underworld);
        }
      }
    }
  }
};
function add$2(unit2, underworld, prediction, quantity) {
  cardsUtil$2.getOrInitModifier(unit2, cardId$6, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit2.attackRange
  }, () => {
    if (!unit2.onTurnEndEvents.includes(cardId$6)) {
      unit2.onTurnEndEvents.push(cardId$6);
    }
    unit2.attackRange = 0;
  });
}
function remove$1(unit2, underworld) {
  if (unit2.modifiers && unit2.modifiers[cardId$6]) {
    const originalRange = unit2.modifiers[cardId$6].originalstat;
    if (originalRange && unit2.attackRange == 0) {
      unit2.attackRange = originalRange;
    }
  }
}
const {
  cardUtils: cardUtils$3,
  commonTypes: commonTypes$5,
  cards: cards$5,
  Particles: Particles$1
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$5 } = cards$5;
const Unit$4 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$2 } = cardUtils$3;
const { CardCategory: CardCategory$5, probabilityMap: probabilityMap$5, CardRarity: CardRarity$5 } = commonTypes$5;
const cardId$5 = "Vengeance";
const spell$5 = {
  card: {
    id: cardId$5,
    category: CardCategory$5.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$5[CardRarity$5.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconVengeance.png",
    sfx: "hurt",
    description: [`Deals damage equal to your missing health. This harms you first if you are targeted, then enemies.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const targets = state.targetedUnits.filter((u) => u.alive);
      let [potentialCaster] = targets.filter((u) => u == state.casterUnit);
      if (!!potentialCaster && targets[0] != state.casterUnit) {
        targets.splice(targets.indexOf(state.casterUnit), 1);
        targets.unshift(state.casterUnit);
      }
      if (targets.length == 0 || state.casterUnit.health == state.casterUnit.healthMax) {
        refundLastSpell$5(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        const manaTrailPromises = [];
        if (!prediction) {
          for (let i = 0; i < quantity; i++) {
            manaTrailPromises.push(Particles$1.makeManaTrail(state.casterUnit, unit2, underworld, "#ef4242", "#400d0d", targets.length * quantity));
          }
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$2(card, prediction);
        }
        for (let q = 0; q < quantity; q++) {
          for (let unit2 of targets) {
            Unit$4.takeDamage({ unit: unit2, amount: damageDone(state), sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
          }
        }
      });
      return state;
    }
  }
};
function damageDone(state) {
  let damageMain2 = state.casterUnit.healthMax - state.casterUnit.health;
  damageMain2 = Math.max(0, damageMain2);
  return damageMain2;
}
const mod$1 = {
  modName: "Wode's Grimoire",
  author: "Blood Spartan",
  description: "Adds 10 new spells to your arsenal.",
  //TODO make word good
  screenshot: "spellmasons-mods/Wodes_Grimoire/graphics/icons/Wodes_grimoire_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$e,
    spell$d,
    spell$c,
    spell$b,
    //Very buggy, absolutly no idea how I got this working, but it does /shrug
    spell$a,
    spell$9,
    spell$8,
    spell$7,
    spell$6,
    //Stasis, //Not working as intended, can still be pushed
    spell$5
  ],
  // This spritesheet allows spell icons to be used in player thought bubbles in multiplayer
  spritesheet: "spellmasons-mods/Wodes_Grimoire/graphics/wodes_grimoire_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$1,
  cardUtils: cardUtils$2,
  commonTypes: commonTypes$4,
  cards: cards$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$4 } = cards$4;
const { containerSpells } = PixiUtils$1;
const Unit$3 = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage } = cardUtils$2;
const { CardCategory: CardCategory$4, probabilityMap: probabilityMap$4, CardRarity: CardRarity$4 } = commonTypes$4;
const animationPath = "VampBite";
const cardId$4 = "Vampire Bite";
const spell$4 = {
  card: {
    id: cardId$4,
    category: CardCategory$4.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$4[CardRarity$4.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/VampireBite.png",
    animationPath,
    sfx: "hurt",
    description: [`Deals 10 to the target and heals you for up to 50% damage done. Healing is not affected by modifiers, including blood curse`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$4(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        if (state.casterUnit.health < state.casterUnit.healthMax) {
          if (unit2.health < 10 * quantity) {
            state.casterUnit.health += unit2.health / 2;
          } else {
            state.casterUnit.health += 5 * quantity;
          }
          if (state.casterUnit.health > state.casterUnit.healthMax) {
            state.casterUnit.health = state.casterUnit.healthMax;
          }
        }
        if (!prediction) {
          oneOffImage(unit2, animationPath, containerSpells);
        }
        Unit$3.takeDamage({ unit: unit2, amount: 10 * quantity, sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 400);
        });
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$1,
  commonTypes: commonTypes$3,
  cards: cards$3,
  VisualEffects
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$3 } = cards$3;
const { playDefaultSpellSFX: playDefaultSpellSFX$1 } = cardUtils$1;
const { CardCategory: CardCategory$3, probabilityMap: probabilityMap$3, CardRarity: CardRarity$3 } = commonTypes$3;
const cardId$3 = "Summon Trap";
const spell$3 = {
  card: {
    id: cardId$3,
    category: CardCategory$3.Damage,
    supportQuantity: false,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$3[CardRarity$3.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/SummonTrap.png",
    sfx: "hurt",
    description: [`Summons a trap that does 30 damage when stepped on`],
    allowNonUnitTarget: true,
    effect: async (state, card, _quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      if (underworld.isCoordOnWallTile(summonLocation)) {
        if (prediction)
          ;
        else {
          refundLastSpell$3(state, prediction, "Invalid summon location, mana refunded.");
        }
        return state;
      }
      playDefaultSpellSFX$1(card, prediction);
      const index = 0;
      if (!prediction) {
        VisualEffects.skyBeam(summonLocation);
        underworld.spawnPickup(index, summonLocation, prediction);
      } else {
        underworld.spawnPickup(index, summonLocation, prediction);
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$2,
  cards: cards$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$2 } = cards$2;
const Unit$2 = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$2, probabilityMap: probabilityMap$2, CardRarity: CardRarity$2 } = commonTypes$2;
const retaliate = 0.15;
const cardId$2 = "Sadism";
const spell$2 = {
  card: {
    id: cardId$2,
    category: CardCategory$2.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$2[CardRarity$2.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Sadism.png",
    sfx: "hurt",
    description: [`Damage to target equal to its attack, you receive ${retaliate * 100}% of that attack damage`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$2(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        let damage = unit2.damage * quantity;
        Unit$2.takeDamage({ unit: unit2, amount: damage, fromVec2: state.casterUnit, sourceUnit: state.casterUnit }, underworld, prediction);
        Unit$2.takeDamage({ unit: state.casterUnit, amount: damage * retaliate }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      return state;
    }
  }
};
const {
  particleEmitter,
  Particles,
  PixiUtils,
  cardUtils,
  commonTypes: commonTypes$1,
  cards: cards$1,
  cardsUtil: cardsUtil$1,
  FloatingText: FloatingText$1,
  ParticleCollection
} = globalThis.SpellmasonsAPI;
const BURNING_RAGE_PARTICLE_EMITTER_NAME = "BURNING_RAGE";
function makeBurningRageParticles(follow, prediction, underworld, quantity) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles.createParticleTexture();
  if (!texture) {
    Particles.logNoTextureWarning("makeBurningRageParticles");
    return;
  }
  const particleConfig = particleEmitter.upgradeConfig({
    autoUpdate: true,
    "alpha": {
      "start": 1,
      "end": 0
    },
    "scale": {
      "start": 1,
      "end": 0.25,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#9e1818",
      "end": "#ffee00"
    },
    "speed": {
      "start": 20,
      "end": 60,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": -50
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 265,
      "max": 275
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 1,
      "max": 1.5
    },
    "blendMode": "normal",
    "frequency": 0.45 / quantity,
    "emitterLifetime": -1,
    "maxParticles": 20 * quantity,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "circle",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": 25
    }
  }, [texture]);
  if (PixiUtils.containerUnits) {
    const wrapped = Particles.wrappedEmitter(particleConfig, PixiUtils.containerUnits);
    if (wrapped) {
      const { container, emitter } = wrapped;
      emitter.name = BURNING_RAGE_PARTICLE_EMITTER_NAME;
      underworld.particleFollowers.push({
        displayObject: container,
        emitter,
        target: follow
      });
    } else {
      console.error("Failed to create BurnigRage particle emitter");
    }
  } else {
    return;
  }
}
const { refundLastSpell: refundLastSpell$1 } = cards$1;
const Unit$1 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX } = cardUtils;
const { CardCategory: CardCategory$1, probabilityMap: probabilityMap$1, CardRarity: CardRarity$1 } = commonTypes$1;
const damageMultiplier = 8;
const attackMultiplier = 5;
const cardId$1 = "Burning Rage";
const spell$1 = {
  card: {
    id: cardId$1,
    category: CardCategory$1.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$1[CardRarity$1.RARE],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Burninig_rage.png",
    sfx: "poison",
    description: [`Each stack causes target to take ${damageMultiplier} damage, but also increases the target's damage by ${attackMultiplier}. Staks increase each turn`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$1(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$1.addModifier(unit2, card.id, underworld, prediction, quantity);
          unit2.damage += quantity * attackMultiplier;
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$1,
    remove
  },
  events: {
    onTurnStart: async (unit2, prediction, underworld) => {
      const modifier = unit2.modifiers[cardId$1];
      if (modifier && !prediction) {
        Unit$1.takeDamage({ unit: unit2, amount: modifier.quantity * damageMultiplier }, underworld, prediction);
        FloatingText$1.default({
          coords: unit2,
          text: `${modifier.quantity * damageMultiplier} rage damage`,
          style: { fill: "red", strokeThickness: 1 }
        });
        unit2.damage += attackMultiplier;
        modifier.quantity++;
      }
    }
  }
};
function add$1(unit2, underworld, prediction, quantity) {
  cardsUtil$1.getOrInitModifier(unit2, cardId$1, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (!unit2.onTurnStartEvents.includes(cardId$1)) {
      unit2.onTurnStartEvents.push(cardId$1);
    }
    makeBurningRageParticles(unit2, prediction, underworld, quantity);
  });
}
function remove(unit2, underworld) {
  unit2.damage -= unit2.modifiers[cardId$1].quantity * attackMultiplier;
  unit2.damage = Math.max(unit2.damage, 0);
  for (let follower of underworld.particleFollowers) {
    if (follower.emitter.name === BURNING_RAGE_PARTICLE_EMITTER_NAME && follower.target == unit2) {
      ParticleCollection.stopAndDestroyForeverEmitter(follower.emitter);
      break;
    }
  }
}
const {
  commonTypes,
  cards,
  cardsUtil,
  FloatingText
} = globalThis.SpellmasonsAPI;
const { refundLastSpell } = cards;
const Unit = globalThis.SpellmasonsAPI.Unit;
const { CardCategory, probabilityMap, CardRarity } = commonTypes;
const maxDuration = 3;
const distanceToDamageRatio = 0.05;
const cardId = "Caltrops";
const spell = {
  card: {
    id: cardId,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/" + cardId + ".png",
    sfx: "hurt",
    description: [`Target takes some damage it moves. Stacks, casting again replenishes duration up to ${maxDuration} turns. (Updates on turn change, recasts or damage)`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        Unit.addModifier(unit2, cardId, underworld, prediction, maxDuration, { amount: quantity });
        if (!prediction) {
          triggerDistanceDamage(unit2, underworld, prediction);
        }
      }
      return state;
    }
  },
  modifiers: {
    add
  },
  events: {
    //onMove: (unit, newLocation) => {triggerDistanceDamage(unit);return newLocation},
    onTakeDamage: (unit2, amount, underworld, prediction) => {
      triggerDistanceDamage(unit2, underworld, prediction);
      return amount;
    },
    onTurnStart: async (unit2, prediction, underworld) => {
      triggerDistanceDamage(unit2, underworld, prediction);
    },
    onTurnEnd: async (unit2, prediction, underworld) => {
      triggerDistanceDamage(unit2, underworld, prediction);
    }
  }
};
function add(unit2, _underworld, prediction, quantity, extra) {
  let firstStack = !unit2.onTurnStartEvents.includes(cardId);
  const modifier = cardsUtil.getOrInitModifier(unit2, cardId, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (firstStack) {
      unit2.onTurnEndEvents.push(cardId);
      unit2.onTurnStartEvents.push(cardId);
      unit2.onTakeDamageEvents.push(cardId);
    }
  });
  if (firstStack) {
    modifier.last_x = unit2.x;
    modifier.last_y = unit2.y;
  }
  if (modifier.quantity > maxDuration) {
    modifier.quantity = maxDuration;
  }
  if (!prediction) {
    modifier.caltropsCounter = (modifier.caltropsCounter || 0) + extra.amount;
    updateTooltip(unit2);
  }
}
function caltropsAmount(castquantity) {
  let caltrops = 1;
  if (castquantity > 0) {
    caltrops = castquantity * 1;
  }
  return caltrops;
}
function updateTooltip(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId];
  if (modifier) {
    modifier.tooltip = `When target moves deal ${caltropsAmount(modifier.caltropsCounter)} damage, lasts ${modifier.quantity} turns`;
  }
}
function triggerDistanceDamage(unit2, underworld, prediction = false) {
  if (!unit2.alive) {
    return;
  }
  const modifier = unit2.modifiers && unit2.modifiers[cardId];
  let x_diff = unit2.x - modifier.last_x;
  let y_diff = unit2.y - modifier.last_y;
  if (x_diff == 0 && y_diff == 0) {
    return;
  }
  let damage = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
  damage = damage * distanceToDamageRatio * modifier.caltropsCounter;
  damage -= damage % 1;
  if (!modifier || damage < 1) {
    return;
  }
  modifier.last_x = unit2.x;
  modifier.last_y = unit2.y;
  Unit.takeDamage({ unit: unit2, amount: damage }, underworld, prediction);
  if (!prediction) {
    FloatingText.default({
      coords: unit2,
      text: `${damage} caltrops damage`,
      style: { fill: "#grey", strokeThickness: 1 }
    });
  }
}
const mod = {
  modName: "Renes gimmicks",
  author: "Renesans123/Edeusz",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Renes_gimmicks/graphics/icons/Renes_Gimmicks_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$4,
    spell$3,
    spell$2,
    spell$1,
    spell
    //OnMove doesnt seem to be implemented
    //Thorns,//composeOnDamageEvents do not pass argument damageDealer right now
  ],
  spritesheet: "spellmasons-mods/Renes_gimmicks/graphics/icons/renes_spritesheet.json"
};
const mods = [
  mod$3,
  mod$2,
  mod$1,
  mod
];
console.log("Mods: Add mods", mods);
globalThis.mods = mods;
