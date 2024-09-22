"use strict";
const {
  PixiUtils: PixiUtils$4,
  rand,
  cardUtils: cardUtils$g,
  commonTypes: commonTypes$j,
  cards: cards$i
} = globalThis.SpellmasonsAPI;
const { randFloat } = rand;
const { refundLastSpell: refundLastSpell$h } = cards$i;
const { containerSpells: containerSpells$3 } = PixiUtils$4;
const Unit$h = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$3, playDefaultSpellSFX: playDefaultSpellSFX$f } = cardUtils$g;
const { CardCategory: CardCategory$j, probabilityMap: probabilityMap$j, CardRarity: CardRarity$i } = commonTypes$j;
const cardId$i = "Undead Blade";
const damageDone$1 = 60;
const animationPath$3 = "spellUndeadBlade";
const delayBetweenAnimationsStart = 400;
const spell$i = {
  card: {
    id: cardId$i,
    category: CardCategory$j.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$j[CardRarity$i.COMMON],
    thumbnail: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
    animationPath: animationPath$3,
    sfx: "hurt",
    description: [`Deals ${damageDone$1} to summoned units and resurrected units only.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !u.originalLife);
      let delayBetweenAnimations = delayBetweenAnimationsStart;
      for (let q = 0; q < quantity; q++) {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$f(card, prediction);
          for (let unit of targets) {
            const spellEffectImage = oneOffImage$3(unit, animationPath$3, containerSpells$3);
            if (spellEffectImage) {
              spellEffectImage.sprite.rotation = randFloat(-Math.PI / 6, Math.PI / 6);
              if (q % 2 == 0) {
                spellEffectImage.sprite.scale.x = -1;
              }
            }
            Unit$h.takeDamage({
              unit,
              amount: damageDone$1,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
          await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
          delayBetweenAnimations *= 0.8;
          delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
        } else {
          for (let unit of targets) {
            Unit$h.takeDamage({
              unit,
              amount: damageDone$1,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
        }
      }
      if (targets.length == 0) {
        refundLastSpell$h(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const mod$3 = {
  modName: "Undead Blade",
  author: "Jordan O'Leary",
  description: "A spell that does lots of damage to summons and resurrected units",
  screenshot: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
  spells: [
    spell$i
  ],
  // The spritesheet is created with TexturePacker: https://www.codeandweb.com/texturepacker
  spritesheet: "spellmasons-mods/undead_blade/undead_blade.json"
};
const {
  cardUtils: cardUtils$f,
  commonTypes: commonTypes$i,
  cards: cards$h,
  cardsUtil: cardsUtil$6,
  FloatingText: FloatingText$6
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$g } = cards$h;
const Unit$g = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$e } = cardUtils$f;
const { CardCategory: CardCategory$i, probabilityMap: probabilityMap$i, CardRarity: CardRarity$h } = commonTypes$i;
const cardId$h = "Decay";
const spell$h = {
  card: {
    id: cardId$h,
    category: CardCategory$i.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$i[CardRarity$h.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDecay.png",
    sfx: "poison",
    description: [`Causes the target to take damage equal to the number of decay stacks squared at the start of their turn. The target then gains another stack.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$g(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$e(card, prediction);
        }
        for (let unit of targets) {
          Unit$g.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$6
  },
  events: {
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$h];
      if (modifier && !!Math.pow(modifier.quantity, 2) && !prediction) {
        Unit$g.takeDamage({ unit, amount: Math.pow(modifier.quantity, 2) }, underworld, prediction);
        FloatingText$6.default({
          coords: unit,
          text: `${Math.pow(modifier.quantity, 2)} decay damage`,
          style: { fill: "#525863", strokeThickness: 1 }
        });
        modifier.quantity++;
      }
    }
  }
};
function add$6(unit, _underworld, _prediction, quantity) {
  cardsUtil$6.getOrInitModifier(unit, cardId$h, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$h);
  });
}
const {
  cardUtils: cardUtils$e,
  commonTypes: commonTypes$h,
  cards: cards$g
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$f } = cards$g;
const Unit$f = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$d } = cardUtils$e;
const { CardCategory: CardCategory$h, probabilityMap: probabilityMap$h, CardRarity: CardRarity$g } = commonTypes$h;
const cardId$g = "Dominate";
const healthThreshhold = 0.25;
const spell$g = {
  card: {
    id: cardId$g,
    category: CardCategory$h.Soul,
    supportQuantity: false,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2.5,
    probability: probabilityMap$h[CardRarity$g.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDominate.png",
    sfx: "suffocate",
    description: [`Converts an enemy to fight for you if they are below ${healthThreshhold * 100}% health.`],
    //Wololo
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && u.health <= u.healthMax * healthThreshhold && u.faction !== state.casterUnit.faction);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$d(card, prediction);
      }
      for (let unit of targets) {
        Unit$f.changeFaction(unit, state.casterUnit.faction);
      }
      if (targets.length == 0) {
        refundLastSpell$f(state, prediction, "No low health targets to convert, mana refunded");
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$d,
  commonTypes: commonTypes$g,
  cards: cards$f,
  cardsUtil: cardsUtil$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$e } = cards$f;
const Unit$e = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$c } = cardUtils$d;
const { CardCategory: CardCategory$g, probabilityMap: probabilityMap$g, CardRarity: CardRarity$f } = commonTypes$g;
const cardId$f = "Ensnare";
const spell$f = {
  card: {
    id: cardId$f,
    category: CardCategory$g.Curses,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$g[CardRarity$f.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconEnsnare.png",
    sfx: "",
    description: [`Prevents the target from moving for one turn. Furthur casts increase duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$e(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$c(card, prediction);
        }
        for (let unit of targets) {
          Unit$e.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$5,
    remove: remove$3
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$f];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$e.removeModifier(unit, cardId$f, underworld);
        }
      }
    }
  }
};
function add$5(unit, underworld, prediction, quantity) {
  cardsUtil$5.getOrInitModifier(unit, cardId$f, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit.staminaMax
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$f);
    unit.stamina = 0;
    unit.staminaMax = 0;
  });
}
function remove$3(unit, underworld) {
  if (unit.modifiers && unit.modifiers[cardId$f]) {
    const originalStamina = unit.modifiers[cardId$f].originalstat;
    if (originalStamina && unit.staminaMax == 0) {
      unit.staminaMax = originalStamina;
    }
  }
}
const {
  cardUtils: cardUtils$c,
  commonTypes: commonTypes$f,
  cards: cards$e,
  FloatingText: FloatingText$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$d } = cards$e;
globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$b } = cardUtils$c;
const { CardCategory: CardCategory$f, probabilityMap: probabilityMap$f, CardRarity: CardRarity$e } = commonTypes$f;
const Events = globalThis.SpellmasonsAPI.Events;
const cardId$e = "Fast Forward";
const spell$e = {
  card: {
    id: cardId$e,
    category: CardCategory$f.Soul,
    //Theres no "other" category
    supportQuantity: false,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$f[CardRarity$e.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFastForward.png",
    sfx: "push",
    //TODO
    description: [`Shunt the target forward through time. Causes progression of spell effects but does not affect cooldowns.`],
    //TODO: better deffinition
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$b(card, prediction);
        for (let unit of targets) {
          setTimeout(() => {
            FloatingText$5.default({
              coords: unit,
              text: `Fast Forward`,
              style: { fill: "#ff0000", strokeThickness: 1 }
            });
          }, 200);
          procEvents(unit, underworld, prediction);
        }
      } else {
        for (let unit of targets) {
          procEvents(unit, underworld, prediction);
        }
      }
      if (targets.length == 0) {
        refundLastSpell$d(state, prediction, "No targets chosen, mana refunded");
      }
      return state;
    }
  }
};
async function procEvents(unit, underworld, prediction) {
  for (let i = 0; i < unit.events.length; i++) {
    const eventName = unit.events[i];
    if (eventName) {
      const fns = Events.default.onTurnStartSource[eventName];
      if (fns) {
        await fns(unit, underworld, prediction);
      }
    }
  }
  for (let i = 0; i < unit.events.length; i++) {
    const eventName = unit.events[i];
    if (eventName) {
      const fne = Events.default.onTurnEndSource[eventName];
      if (fne) {
        await fne(unit, underworld, prediction);
      }
    }
  }
}
const {
  Particles: Particles$4,
  particleEmitter: particleEmitter$2
} = globalThis.SpellmasonsAPI;
function makeFlameStrikeWithParticles(position, prediction, resolver) {
  if (prediction || globalThis.headless) {
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = Particles$4.createParticleTexture();
  if (!texture) {
    Particles$4.logNoTextureWarning("makeFlameStrikeAttack");
    return;
  }
  const config = particleEmitter$2.upgradeConfig({
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
  Particles$4.simpleEmitter(position, config, resolver);
}
const {
  cardUtils: cardUtils$b,
  commonTypes: commonTypes$e,
  PlanningView: PlanningView$1,
  cards: cards$d
} = globalThis.SpellmasonsAPI;
const { drawUICircle } = PlanningView$1;
const Unit$d = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$a } = cardUtils$b;
const { refundLastSpell: refundLastSpell$c } = cards$d;
const { CardCategory: CardCategory$e, probabilityMap: probabilityMap$e, CardRarity: CardRarity$d } = commonTypes$e;
const cardId$d = "FlameStrike";
const damageMain = 40;
const damageSplash = 10;
const splashRadius = 64;
const spell$d = {
  card: {
    id: cardId$d,
    category: CardCategory$e.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$e[CardRarity$d.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFlameStrike.png",
    sfx: "burst",
    description: [`Deals ${damageMain} damage to the target and ${damageSplash} damage to nearby targets in a small area.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise((resolve) => {
        const targets = state.targetedUnits.filter((u) => u.alive);
        const adjustedRadius = getAdjustedRadius(state.aggregator.radiusBoost);
        if (targets.length == 0) {
          refundLastSpell$c(state, prediction);
          resolve();
        }
        for (let unit of targets) {
          const explosionTargets = underworld.getUnitsWithinDistanceOfTarget(unit, adjustedRadius, prediction);
          const quantityAdjustedDamageMain = damageMain * quantity;
          const quantityAdjustedDamageSplash = damageSplash * quantity;
          if (!prediction && !globalThis.headless) {
            playDefaultSpellSFX$a(card, prediction);
            setTimeout(() => {
              explosionTargets.forEach((t) => {
                const damage = t == unit ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
                Unit$d.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
              });
              resolve();
            }, 400);
            makeFlameStrikeWithParticles(unit, prediction);
          } else {
            if (prediction) {
              drawUICircle(globalThis.predictionGraphics, unit, adjustedRadius, 13981270);
            }
            explosionTargets.forEach((t) => {
              const damage = t == unit ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
              Unit$d.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
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
  cardUtils: cardUtils$a,
  commonTypes: commonTypes$d,
  cards: cards$c,
  cardsUtil: cardsUtil$4,
  JImage,
  JAudio,
  FloatingText: FloatingText$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$b } = cards$c;
const Unit$c = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$9 } = cardUtils$a;
const { CardCategory: CardCategory$d, probabilityMap: probabilityMap$d, CardRarity: CardRarity$c } = commonTypes$d;
const cardId$c = "Grace";
var healingAmount$1 = -40;
const spell$c = {
  card: {
    id: cardId$c,
    category: CardCategory$d.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$d[CardRarity$c.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconGrace.png",
    sfx: "purify",
    //TODO
    description: [`Heals the target for ${-healingAmount$1} after 3 turns. Stacks increase the amount, but do not change duration`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$b(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$9(card, prediction);
        }
        for (let unit of targets) {
          Unit$c.addModifier(unit, card.id, underworld, prediction, 0, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$4
  },
  events: {
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$c];
      if (modifier) {
        modifier.graceCountdown--;
        updateTooltip$2(unit);
        if (modifier.graceCountdown <= 0) {
          let healing = calculateGraceHealing(modifier.graceQuantity);
          Unit$c.takeDamage({ unit, amount: healing }, underworld, prediction);
          if (!prediction) {
            FloatingText$4.default({
              coords: unit,
              text: `Grace +${-healing} health`,
              style: { fill: "#40a058", strokeThickness: 1 }
            });
            JImage.addOneOffAnimation(unit, "potionPickup", {}, { animationSpeed: 0.3, loop: false });
            JAudio.playSFXKey("potionPickupHealth");
          }
          Unit$c.removeModifier(unit, cardId$c, underworld);
        }
      }
    }
  }
};
function add$4(unit, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$4.getOrInitModifier(unit, cardId$c, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$c);
  });
  if (!modifier.graceCountdown) {
    modifier.graceCountdown = 3;
  }
  modifier.graceQuantity = (modifier.graceQuantity || 0) + extra.amount;
  if (!prediction) {
    updateTooltip$2(unit);
  }
}
function updateTooltip$2(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$c];
  if (modifier) {
    modifier.tooltip = `${modifier.graceCountdown} turns until healed for ${-calculateGraceHealing(modifier.graceQuantity)}`;
  }
}
function calculateGraceHealing(graceQuantity) {
  return graceQuantity * healingAmount$1;
}
const {
  cardUtils: cardUtils$9,
  commonTypes: commonTypes$c,
  cards: cards$b,
  Particles: Particles$3,
  FloatingText: FloatingText$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$a } = cards$b;
const Unit$b = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$8 } = cardUtils$9;
const { CardCategory: CardCategory$c, probabilityMap: probabilityMap$c, CardRarity: CardRarity$b, UnitType } = commonTypes$c;
const cardId$b = "Harvest";
const manaRegain = 20;
const spell$b = {
  card: {
    id: cardId$b,
    category: CardCategory$c.Mana,
    supportQuantity: false,
    manaCost: 0,
    healthCost: 35,
    expenseScaling: 1,
    probability: probabilityMap$c[CardRarity$b.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconHarvest.png",
    sfx: "sacrifice",
    description: [`Consumes target corpse for ${manaRegain} mana. Does not work on player corpses. Unstackable.

Tastes like chicken.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      let totalManaHarvested = 0;
      const targets = state.targetedUnits.filter((u) => !u.alive && u.unitType != UnitType.PLAYER_CONTROLLED && u.flaggedForRemoval != true);
      for (let unit of targets) {
        totalManaHarvested += manaRegain * quantity;
        const manaTrailPromises = [];
        if (!prediction) {
          manaTrailPromises.push(Particles$3.makeManaTrail(unit, state.casterUnit, underworld, "#e4ffee", "#40ff66", targets.length * quantity));
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$8(card, prediction);
        }
        for (let unit of targets) {
          Unit$b.cleanup(unit);
        }
        state.casterUnit.mana += totalManaHarvested;
      });
      if (targets.length == 0 && !totalManaHarvested) {
        refundLastSpell$a(state, prediction, "No corpses, health refunded");
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
  cardUtils: cardUtils$8,
  commonTypes: commonTypes$b,
  cards: cards$a,
  cardsUtil: cardsUtil$3,
  FloatingText: FloatingText$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$9 } = cards$a;
const Unit$a = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$7 } = cardUtils$8;
const { CardCategory: CardCategory$b, probabilityMap: probabilityMap$b, CardRarity: CardRarity$a } = commonTypes$b;
const cardId$a = "Regenerate";
const spell$a = {
  card: {
    id: cardId$a,
    category: CardCategory$b.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$b[CardRarity$a.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconRegen.png",
    sfx: "heal",
    //TODO
    description: [`Heals the target for 10 health at the end of their turn for 5 turns. Stacks increase the amount and refresh the duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$9(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$7(card, prediction);
        }
        for (let unit of targets) {
          Unit$a.addModifier(unit, card.id, underworld, prediction, 5, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$3,
    remove: remove$2
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$a];
      if (modifier) {
        const healing = healingAmount(modifier.regenCounter);
        Unit$a.takeDamage({ unit, amount: healing }, underworld, prediction);
        modifier.quantity--;
        if (!prediction) {
          updateTooltip$1(unit);
          FloatingText$2.default({
            coords: unit,
            text: `Regenerate +${-healing} health`,
            style: { fill: "#40a058", strokeThickness: 1 }
          });
        }
        if (modifier.quantity <= 0) {
          Unit$a.removeModifier(unit, cardId$a, underworld);
        }
      }
    }
  }
};
function remove$2(unit, underworld) {
  const modifier = unit.modifiers[cardId$a];
  if (modifier) {
    modifier.regenCounter = 0;
  }
}
function add$3(unit, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$3.getOrInitModifier(unit, cardId$a, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$a);
  });
  if (modifier.quantity > 5) {
    modifier.quantity = 5;
  }
  if (!prediction) {
    modifier.regenCounter = (modifier.regenCounter || 0) + extra.amount;
    updateTooltip$1(unit);
  }
}
function healingAmount(castquantity) {
  let healing = -10;
  if (castquantity > 0) {
    healing = castquantity * -10;
  }
  return healing;
}
function updateTooltip$1(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$a];
  if (modifier) {
    modifier.tooltip = `Healing ${-healingAmount(modifier.regenCounter)} every ${modifier.quantity} turns`;
  }
}
const {
  cardUtils: cardUtils$7,
  commonTypes: commonTypes$a,
  cards: cards$9,
  cardsUtil: cardsUtil$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$8 } = cards$9;
const Unit$9 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$6 } = cardUtils$7;
const { CardCategory: CardCategory$a, probabilityMap: probabilityMap$a, CardRarity: CardRarity$9 } = commonTypes$a;
const cardId$9 = "Pacify";
const spell$9 = {
  card: {
    id: cardId$9,
    category: CardCategory$a.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$a[CardRarity$9.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconPacify.png",
    sfx: "",
    description: [`Prevents the target from attacking for one turn. Stacks increase duration. Does not affect Support Class units such as summoners or priests.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !(u.unitSubType == 3));
      if (targets.length == 0) {
        refundLastSpell$8(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$6(card, prediction);
        }
        for (let unit of targets) {
          Unit$9.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$2,
    remove: remove$1
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$9];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$9.removeModifier(unit, cardId$9, underworld);
        }
      }
    }
  }
};
function add$2(unit, underworld, prediction, quantity) {
  cardsUtil$2.getOrInitModifier(unit, cardId$9, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit.attackRange
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$9);
    unit.attackRange = 0;
  });
}
function remove$1(unit, underworld) {
  if (unit.modifiers && unit.modifiers[cardId$9]) {
    const originalRange = unit.modifiers[cardId$9].originalstat;
    if (originalRange && unit.attackRange == 0) {
      unit.attackRange = originalRange;
    }
  }
}
const {
  cardUtils: cardUtils$6,
  commonTypes: commonTypes$9,
  cards: cards$8,
  Particles: Particles$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$7 } = cards$8;
const Unit$8 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$5 } = cardUtils$6;
const { CardCategory: CardCategory$9, probabilityMap: probabilityMap$9, CardRarity: CardRarity$8 } = commonTypes$9;
const cardId$8 = "Vengeance";
const spell$8 = {
  card: {
    id: cardId$8,
    category: CardCategory$9.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$9[CardRarity$8.UNCOMMON],
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
        refundLastSpell$7(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        const manaTrailPromises = [];
        if (!prediction) {
          for (let i = 0; i < quantity; i++) {
            manaTrailPromises.push(Particles$2.makeManaTrail(state.casterUnit, unit, underworld, "#ef4242", "#400d0d", targets.length * quantity));
          }
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$5(card, prediction);
        }
        for (let q = 0; q < quantity; q++) {
          for (let unit of targets) {
            Unit$8.takeDamage({ unit, amount: damageDone(state), sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
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
const mod$2 = {
  modName: "Wode's Grimoire",
  author: "Blood Spartan",
  description: "Adds 10 new spells to your arsenal.",
  //TODO make word good
  screenshot: "spellmasons-mods/Wodes_Grimoire/graphics/icons/Wodes_grimoire_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$h,
    spell$g,
    spell$f,
    spell$e,
    //Very buggy, absolutly no idea how I got this working, but it does /shrug
    spell$d,
    spell$c,
    spell$b,
    spell$a,
    spell$9,
    //Stasis, //Not working as intended, can still be pushed
    spell$8
  ],
  // This spritesheet allows spell icons to be used in player thought bubbles in multiplayer
  spritesheet: "spellmasons-mods/Wodes_Grimoire/graphics/wodes_grimoire_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$3,
  cardUtils: cardUtils$5,
  commonTypes: commonTypes$8,
  cards: cards$7
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$6 } = cards$7;
const { containerSpells: containerSpells$2 } = PixiUtils$3;
const Unit$7 = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$2 } = cardUtils$5;
const { CardCategory: CardCategory$8, probabilityMap: probabilityMap$8, CardRarity: CardRarity$7 } = commonTypes$8;
const animationPath$2 = "VampBite";
const cardId$7 = "Vampire Bite";
const spell$7 = {
  card: {
    id: cardId$7,
    category: CardCategory$8.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$8[CardRarity$7.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/VampireBite.png",
    animationPath: animationPath$2,
    sfx: "hurt",
    description: [`Deals 10 to the target and heals you for up to 50% damage done. Healing is not affected by modifiers, including blood curse`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$6(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        if (state.casterUnit.health < state.casterUnit.healthMax) {
          if (unit.health < 10 * quantity) {
            state.casterUnit.health += unit.health / 2;
          } else {
            state.casterUnit.health += 5 * quantity;
          }
          if (state.casterUnit.health > state.casterUnit.healthMax) {
            state.casterUnit.health = state.casterUnit.healthMax;
          }
        }
        if (!prediction) {
          oneOffImage$2(unit, animationPath$2, containerSpells$2);
        }
        Unit$7.takeDamage({ unit, amount: 10 * quantity, sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
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
  cardUtils: cardUtils$4,
  commonTypes: commonTypes$7,
  cards: cards$6,
  VisualEffects
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$5 } = cards$6;
const { playDefaultSpellSFX: playDefaultSpellSFX$4 } = cardUtils$4;
const { CardCategory: CardCategory$7, probabilityMap: probabilityMap$7, CardRarity: CardRarity$6 } = commonTypes$7;
const cardId$6 = "Summon Trap";
const spell$6 = {
  card: {
    id: cardId$6,
    category: CardCategory$7.Damage,
    supportQuantity: false,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$7[CardRarity$6.UNCOMMON],
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
          refundLastSpell$5(state, prediction, "Invalid summon location, mana refunded.");
        }
        return state;
      }
      playDefaultSpellSFX$4(card, prediction);
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
  commonTypes: commonTypes$6,
  cards: cards$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$4 } = cards$5;
const Unit$6 = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$6, probabilityMap: probabilityMap$6, CardRarity: CardRarity$5 } = commonTypes$6;
const retaliate = 0.15;
const cardId$5 = "Sadism";
const spell$5 = {
  card: {
    id: cardId$5,
    category: CardCategory$6.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$6[CardRarity$5.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Sadism.png",
    sfx: "hurt",
    description: [`Damage to target equal to its attack, you receive ${retaliate * 100}% of that attack damage`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$4(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        let damage = unit.damage * quantity;
        Unit$6.takeDamage({ unit, amount: damage, fromVec2: state.casterUnit, sourceUnit: state.casterUnit }, underworld, prediction);
        Unit$6.takeDamage({ unit: state.casterUnit, amount: damage * retaliate }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      return state;
    }
  }
};
const {
  particleEmitter: particleEmitter$1,
  Particles: Particles$1,
  PixiUtils: PixiUtils$2,
  cardUtils: cardUtils$3,
  commonTypes: commonTypes$5,
  cards: cards$4,
  cardsUtil: cardsUtil$1,
  FloatingText: FloatingText$1,
  ParticleCollection: ParticleCollection$1
} = globalThis.SpellmasonsAPI;
const BURNING_RAGE_PARTICLE_EMITTER_NAME = "BURNING_RAGE";
function makeBurningRageParticles(follow, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles$1.createParticleTexture();
  if (!texture) {
    Particles$1.logNoTextureWarning("makeBurningRageParticles");
    return;
  }
  const particleConfig = particleEmitter$1.upgradeConfig({
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
    "frequency": 0.45,
    "emitterLifetime": -1,
    "maxParticles": 20,
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
  if (PixiUtils$2.containerUnits) {
    const wrapped = Particles$1.wrappedEmitter(particleConfig, PixiUtils$2.containerUnits);
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
const { refundLastSpell: refundLastSpell$3 } = cards$4;
const Unit$5 = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$3 } = cardUtils$3;
const { CardCategory: CardCategory$5, probabilityMap: probabilityMap$5, CardRarity: CardRarity$4 } = commonTypes$5;
const damageMultiplier$1 = 8;
const attackMultiplier = 5;
const cardId$4 = "Burning Rage";
const spell$4 = {
  card: {
    id: cardId$4,
    category: CardCategory$5.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$5[CardRarity$4.RARE],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Burninig_rage.png",
    sfx: "poison",
    description: [`Each stack causes target to take ${damageMultiplier$1} damage, but also increases the target's damage by ${attackMultiplier}. Staks increase each turn`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$3(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$3(card, prediction);
        }
        for (let unit of targets) {
          Unit$5.addModifier(unit, card.id, underworld, prediction, quantity);
          unit.damage += quantity * attackMultiplier;
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
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$4];
      if (modifier && !prediction) {
        Unit$5.takeDamage({ unit, amount: modifier.quantity * damageMultiplier$1 }, underworld, prediction);
        FloatingText$1.default({
          coords: unit,
          text: `${modifier.quantity * damageMultiplier$1} rage damage`,
          style: { fill: "red", strokeThickness: 1 }
        });
        unit.damage += attackMultiplier;
        modifier.quantity++;
      }
    }
  }
};
function add$1(unit, underworld, prediction, quantity) {
  cardsUtil$1.getOrInitModifier(unit, cardId$4, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$4);
    makeBurningRageParticles(unit, underworld, prediction);
  });
}
function remove(unit, underworld) {
  unit.damage -= unit.modifiers[cardId$4].quantity * attackMultiplier;
  unit.damage = Math.max(unit.damage, 0);
  for (let follower of underworld.particleFollowers) {
    if (follower.emitter.name === BURNING_RAGE_PARTICLE_EMITTER_NAME && follower.target == unit) {
      ParticleCollection$1.stopAndDestroyForeverEmitter(follower.emitter);
      break;
    }
  }
}
const {
  commonTypes: commonTypes$4,
  cards: cards$3,
  cardsUtil,
  FloatingText
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$2 } = cards$3;
const Unit$4 = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$4, probabilityMap: probabilityMap$4, CardRarity: CardRarity$3 } = commonTypes$4;
const maxDuration = 3;
const distanceToDamageRatio = 0.05;
const cardId$3 = "Caltrops";
const spell$3 = {
  card: {
    id: cardId$3,
    category: CardCategory$4.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$4[CardRarity$3.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/" + cardId$3 + ".png",
    sfx: "hurt",
    description: [`Target takes some damage it moves. Stacks, casting again replenishes duration up to ${maxDuration} turns. (Updates on turn change, recasts or damage)`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$2(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        Unit$4.addModifier(unit, cardId$3, underworld, prediction, maxDuration, { amount: quantity });
        if (!prediction) {
          triggerDistanceDamage(unit, underworld, prediction);
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
    onTakeDamage: (unit, amount, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
      return amount;
    },
    onTurnStart: async (unit, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
    },
    onTurnEnd: async (unit, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
    }
  }
};
function add(unit, _underworld, prediction, quantity, extra) {
  let firstStack = !unit.events.includes(cardId$3);
  const modifier = cardsUtil.getOrInitModifier(unit, cardId$3, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (firstStack) {
      SpellmasonsAPI.Unit.addEvent(unit, cardId$3);
    }
  });
  if (firstStack) {
    modifier.last_x = unit.x;
    modifier.last_y = unit.y;
  }
  if (modifier.quantity > maxDuration) {
    modifier.quantity = maxDuration;
  }
  if (!prediction) {
    modifier.caltropsCounter = (modifier.caltropsCounter || 0) + extra.amount;
    updateTooltip(unit);
  }
}
function caltropsAmount(castquantity) {
  let caltrops = 1;
  if (castquantity > 0) {
    caltrops = castquantity * 1;
  }
  return caltrops;
}
function updateTooltip(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$3];
  if (modifier) {
    modifier.tooltip = `When target moves deal ${caltropsAmount(modifier.caltropsCounter)} damage, lasts ${modifier.quantity} turns`;
  }
}
function triggerDistanceDamage(unit, underworld, prediction = false) {
  if (!unit.alive) {
    return;
  }
  const modifier = unit.modifiers && unit.modifiers[cardId$3];
  let x_diff = unit.x - modifier.last_x;
  let y_diff = unit.y - modifier.last_y;
  if (x_diff == 0 && y_diff == 0) {
    return;
  }
  let damage = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
  damage = damage * distanceToDamageRatio * modifier.caltropsCounter;
  damage -= damage % 1;
  if (!modifier || damage < 1) {
    return;
  }
  modifier.last_x = unit.x;
  modifier.last_y = unit.y;
  Unit$4.takeDamage({ unit, amount: damage }, underworld, prediction);
  if (!prediction) {
    FloatingText.default({
      coords: unit,
      text: `${damage} caltrops damage`,
      style: { fill: "#grey", strokeThickness: 1 }
    });
  }
}
const mod$1 = {
  modName: "Renes gimmicks",
  author: "Renesans123/Edeusz",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Renes_gimmicks/graphics/icons/Renes_Gimmicks_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$7,
    spell$6,
    spell$5,
    spell$4,
    spell$3
    //OnMove doesnt seem to be implemented
    //Thorns,//composeOnDamageEvents do not pass argument damageDealer right now
  ],
  spritesheet: "spellmasons-mods/Renes_gimmicks/graphics/icons/renes_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$1,
  commonTypes: commonTypes$3,
  cards: cards$2,
  cardUtils: cardUtils$2,
  Unit: Unit$3,
  JPromise
} = globalThis.SpellmasonsAPI;
const { oneOffImage: oneOffImage$1, playDefaultSpellSFX: playDefaultSpellSFX$2, playSpellSFX } = cardUtils$2;
const { refundLastSpell: refundLastSpell$1 } = cards$2;
const { CardCategory: CardCategory$3, probabilityMap: probabilityMap$3, CardRarity: CardRarity$2 } = commonTypes$3;
const { containerSpells: containerSpells$1 } = PixiUtils$1;
const animationPath$1 = "spellGravity";
const cardId$2 = "Gravity";
const percentDamage = 0.1;
const spell$2 = {
  card: {
    id: cardId$2,
    category: CardCategory$3.Damage,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$3[CardRarity$2.RARE],
    animationPath: animationPath$1,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/Gravity.png",
    sfx: "pull",
    description: [`Deals damage to target(s) equal to ${percentDamage * 100}% of its current health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playSpellSFX("push", prediction);
        let promises = [];
        for (let unit of targets) {
          promises.push(new Promise((res) => {
            oneOffImage$1(unit, animationPath$1, containerSpells$1, res);
            setTimeout(() => {
              playDefaultSpellSFX$2(card, prediction);
            }, 1e3);
          }));
        }
        await JPromise.raceTimeout(2e3, "Gravity attack animation", Promise.all(promises));
      }
      for (let unit of targets) {
        let damage = unit.health * percentDamage * quantity;
        Unit$3.takeDamage({
          unit,
          amount: damage,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
      }
      if (targets.length == 0) {
        refundLastSpell$1(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$2,
  cards: cards$1,
  Unit: Unit$2,
  cardUtils: cardUtils$1,
  PixiUtils
} = globalThis.SpellmasonsAPI;
const { oneOffImage, playDefaultSpellSFX: playDefaultSpellSFX$1 } = cardUtils$1;
const { refundLastSpell } = cards$1;
const { CardCategory: CardCategory$2, probabilityMap: probabilityMap$2, CardRarity: CardRarity$1 } = commonTypes$2;
const { containerSpells } = PixiUtils;
const cardId$1 = "Limit Blast";
const animationPath = "Limit Glove";
const healthRequirement = 0.3;
const baseDamage = 5;
const damageMultiplier = 10;
const spell$1 = {
  card: {
    id: cardId$1,
    category: CardCategory$2.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$2[CardRarity$1.UNCOMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/LimitGlove.png",
    animationPath,
    sfx: "debilitate",
    description: [`Deals ${baseDamage} damage to target(s). If caster's health is ${healthRequirement * 100}% or less, deals ${baseDamage * damageMultiplier} damage instead.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell(state, prediction, "No valid targets. Cost refunded.");
        return state;
      }
      if (!prediction && !globalThis.headless) {
        for (let unit of targets) {
          oneOffImage(unit, animationPath, containerSpells);
        }
        playDefaultSpellSFX$1(card, prediction);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      for (let unit of targets) {
        let healthReqCalc = state.casterUnit.healthMax * healthRequirement;
        let damage = baseDamage;
        if (state.casterUnit.health <= healthReqCalc) {
          damage = damage * damageMultiplier;
        }
        Unit$2.takeDamage({
          unit,
          amount: damage * quantity,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      return state;
    }
  }
};
const {
  Particles,
  ParticleCollection,
  particleEmitter,
  commonTypes: commonTypes$1,
  Unit: Unit$1,
  PlanningView,
  colors,
  cardUtils
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$1, probabilityMap: probabilityMap$1, CardRarity } = commonTypes$1;
const { drawUICirclePrediction } = PlanningView;
const { playDefaultSpellSFX } = cardUtils;
const { simpleEmitter } = Particles;
function makeWhiteWindParticles(position, radius, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles.createParticleTexture();
  if (!texture) {
    return;
  }
  const particleConfig = particleEmitter.upgradeConfig({
    "alpha": {
      "start": 1,
      "end": 0
    },
    "scale": {
      "start": 0.5,
      "end": 0.05,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": radius * 1.5,
      "end": 0,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 0
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 90,
      "max": 180
    },
    "noRotation": true,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 0.2,
      "max": 0.8
    },
    "blendMode": "add",
    "frequency": 1e-3,
    "emitterLifetime": waitTime / 2,
    "maxParticles": 500 * radius,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "ring",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": radius,
      "minR": 0
    }
  }, [texture]);
  simpleEmitter(position, particleConfig);
}
const cardId = "Healing Breeze";
const baseRange = 100;
const waitTime = 2;
const spell = {
  card: {
    id: cardId,
    category: CardCategory$1.Blessings,
    supportQuantity: true,
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$1[CardRarity.RARE],
    allowNonUnitTarget: true,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/WhiteWind.png",
    sfx: "heal",
    description: [`Heals targets in an area around self equal to own health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let adjustedRange = baseRange * (1 + (quantity - 1) * 0.5 + 0.25 * state.aggregator.radiusBoost);
      if (prediction) {
        drawUICirclePrediction(state.casterUnit, adjustedRange, colors.targetingSpellGreen, "Target Radius");
      } else {
        makeWhiteWindParticles(state.casterUnit, adjustedRange, underworld, prediction);
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, waitTime * 1e3);
        });
      }
      let entities = underworld.getEntitiesWithinDistanceOfTarget(state.casterUnit, adjustedRange, prediction);
      for (let entity of entities) {
        if (Unit$1.isUnit(entity)) {
          let target = entity;
          Unit$1.takeDamage({ unit: target, amount: -state.casterUnit.health }, underworld, prediction);
        }
        playDefaultSpellSFX(card, prediction);
      }
      return state;
    }
  }
};
const {
  cards,
  Pickup,
  Unit,
  math,
  commonTypes
} = globalThis.SpellmasonsAPI;
const { addTarget } = cards;
const { CardCategory, probabilityMap } = commonTypes;
const UNITS_PER_STACK = 3;
function generateTargetHpMultipleOfSpell(multipleOf, manaCost, requiredId, rarity) {
  let reqId;
  if (requiredId) {
    if (requiredId == "Prime") {
      reqId = ["Target Health Prime"];
    } else {
      reqId = [`Target Health * ${requiredId}`];
    }
  } else {
    reqId = void 0;
  }
  return {
    card: {
      id: `Target Health * ${multipleOf}`,
      requires: reqId,
      category: CardCategory.Targeting,
      supportQuantity: true,
      manaCost,
      healthCost: 0,
      expenseScaling: 1,
      probability: probabilityMap[rarity],
      thumbnail: `spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHp${multipleOf}.png`,
      requiresFollowingCard: true,
      description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any multiple of ${multipleOf}, starting with the closest from the target point.`],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
        const targets = underworld.getPotentialTargets(prediction).filter((u) => {
          if (Unit.isUnit(u)) {
            return u.alive && u.health % multipleOf == 0;
          } else {
            return false;
          }
        }).sort(math.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
        for (let target of targets) {
          addTarget(target, state, underworld, prediction);
        }
        return state;
      }
    }
  };
}
function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  for (let n = 2; n < num; n++) {
    if (num % n == 0) {
      return false;
    }
  }
  return true;
}
const TargetHp3 = generateTargetHpMultipleOfSpell(3, 30, "Prime", commonTypes.CardRarity.UNCOMMON);
const TargetHp4 = generateTargetHpMultipleOfSpell(4, 35, 3, commonTypes.CardRarity.RARE);
const TargetHp5 = generateTargetHpMultipleOfSpell(5, 40, 4, commonTypes.CardRarity.FORBIDDEN);
const TargetHpPrime = {
  card: {
    id: `Target Health Prime`,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap[commonTypes.CardRarity.COMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHpPrime.png",
    requiresFollowingCard: true,
    description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any prime number, starting with the closest from the target point.`],
    allowNonUnitTarget: true,
    ignoreRange: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const targets = underworld.getPotentialTargets(prediction).filter((u) => {
        if (Unit.isUnit(u)) {
          return u.alive && isPrime(u.health);
        } else {
          return false;
        }
      }).sort(math.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
      for (let target of targets) {
        addTarget(target, state, underworld, prediction);
      }
      return state;
    }
  }
};
const mod = {
  modName: "DaiNekoIchi's Tome of Spells",
  author: "DaiNekoIchi, PADS",
  description: "Adds several spells (probably heavily inspired from Final Fantasy)",
  screenshot: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TomeOfSpellsIcon.png",
  spells: [
    spell$2,
    spell$1,
    spell,
    TargetHpPrime,
    TargetHp3,
    TargetHp4,
    TargetHp5
  ],
  spritesheet: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/spritesheet.json"
};
const mods = [
  mod$3,
  mod$2,
  mod$1,
  mod
];
globalThis.mods = globalThis.mods !== void 0 ? [...globalThis.mods, ...mods] : mods;
console.log("Mods: Add mods", globalThis.mods);
